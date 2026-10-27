package com.kinetic.it;

import com.kinetic.dtos.AccountExportDTO;
import com.kinetic.enums.Role;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.PhysicalAssessment;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.services.DataExportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Dado de saúde de ex-aluno não sai na exportação do personal: é do aluno. */
class DataExportIT extends IntegrationTestBase {

    @Autowired
    private DataExportService exportService;
    @Autowired
    private TrainerClientRepository links;

    @Test
    void trainerExportHasOnlyActiveStudentsAssessments() {
        User trainer = data.user(Role.PERSONAL);
        User current = data.user(Role.ALUNO);
        User former = data.user(Role.ALUNO);
        data.link(trainer, current, null);
        TrainerClient ended = data.link(trainer, former, null);
        ended.setStatus(TrainerLinkStatus.ENCERRADO);
        links.save(ended);
        PhysicalAssessment currentAssessment = data.assessment(trainer, current);
        data.assessment(trainer, former);

        AccountExportDTO export = exportService.export(trainer.getEmail());

        assertEquals(List.of(currentAssessment.getId()),
                export.physicalAssessments().stream().map(AccountExportDTO.Assessment::id).toList());
    }
}
