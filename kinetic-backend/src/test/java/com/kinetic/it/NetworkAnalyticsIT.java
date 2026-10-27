package com.kinetic.it;

import com.kinetic.dtos.EmpresaAnalyticsDTO;
import com.kinetic.enums.Role;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.Company;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.services.DonoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** A visão da rede (uma consulta para todas as filiais) bate com a soma das filiais. */
class NetworkAnalyticsIT extends IntegrationTestBase {

    @Autowired
    private DonoService donoService;
    @Autowired
    private TrainerClientRepository links;
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void networkTotalsMatchSumOfUnits() {
        Company network = data.company(null);
        Company unitA = data.company(network.getId());
        Company unitB = data.company(network.getId());
        User dono = data.user(Role.DONO, network.getId());

        User trainerA = data.user(Role.PERSONAL, unitA.getId());
        User trainerB = data.user(Role.PERSONAL, unitB.getId());
        data.user(Role.PERSONAL, unitB.getId());
        User studentA = data.user(Role.ALUNO);
        data.link(trainerA, studentA, unitA.getId());
        data.link(trainerB, data.user(Role.ALUNO), unitB.getId());
        data.link(trainerB, data.user(Role.ALUNO), unitB.getId());
        TrainerClient ended = data.link(trainerA, data.user(Role.ALUNO), unitA.getId());
        ended.setStatus(TrainerLinkStatus.ENCERRADO);
        links.save(ended);
        jdbc.update("INSERT INTO workout_sessions (id, user_id, session_date, duration_in_seconds) "
                + "VALUES (gen_random_uuid(), ?, current_date, 1800)", studentA.getId());

        EmpresaAnalyticsDTO net = donoService.networkAnalytics(dono.getEmail(), "month");
        EmpresaAnalyticsDTO a = donoService.unitAnalytics(dono.getEmail(), unitA.getId(), "month");
        EmpresaAnalyticsDTO b = donoService.unitAnalytics(dono.getEmail(), unitB.getId(), "month");

        assertEquals(3, net.personaisAtivos());
        assertEquals(a.personaisAtivos() + b.personaisAtivos(), net.personaisAtivos());
        assertEquals(3, net.alunosAtivos());
        assertEquals(a.alunosAtivos() + b.alunosAtivos(), net.alunosAtivos());
        assertEquals(4, net.alunosVinculadosNoPeriodo());
        assertEquals(0.75, net.retentionRate(), 1e-9);
        assertEquals(1, net.sessoesNoPeriodo());
        assertEquals(a.desempenhoPorInstrutor().size() + b.desempenhoPorInstrutor().size(),
                net.desempenhoPorInstrutor().size());
    }

    @Test
    void networkWithoutUnitsIsEmpty() {
        User dono = data.user(Role.DONO, data.company(null).getId());
        EmpresaAnalyticsDTO net = donoService.networkAnalytics(dono.getEmail(), "month");
        assertEquals(0, net.alunosAtivos());
        assertEquals(0, net.volumeSeries().size());
    }
}
