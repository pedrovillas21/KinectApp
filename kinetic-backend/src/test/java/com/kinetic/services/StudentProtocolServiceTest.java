package com.kinetic.services;

import com.kinetic.dtos.StudentProtocolDTOs;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Personal define protocolo/anamnese; mudar a anamnese pede nova conferência do aluno. */
class StudentProtocolServiceTest {

    private final TrainerLinkService links = mock(TrainerLinkService.class);
    private final TrainerClientRepository trainerClients = mock(TrainerClientRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final StudentProtocolService service = new StudentProtocolService(links, trainerClients, users,
            mock(AuditService.class));

    private final User trainer = new User();
    private final User student = new User();

    @BeforeEach
    void setUp() {
        trainer.setId(UUID.randomUUID());
        trainer.setEmail("personal@test.local");
        trainer.setNome("Marina");
        student.setId(UUID.randomUUID());
        student.setEmail("aluno@test.local");
        student.setGoal("Ganho de Massa");
        student.setLevel("PRO");
        student.setFrequency(5);
        student.setMedicalConditions("Dor no joelho");
        student.setAnamnesisConfirmedAt(LocalDateTime.now().minusDays(1));

        when(links.resolveOwnedStudentForWrite(trainer.getEmail(), student.getId())).thenReturn(student);
        when(users.getByEmailOrThrow(trainer.getEmail())).thenReturn(trainer);
        when(users.getByEmailOrThrow(student.getEmail())).thenReturn(student);
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(users.findById(trainer.getId())).thenReturn(Optional.of(trainer));
        when(trainerClients.findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)).thenReturn(Optional.empty());
    }

    @Test
    void changingAnamnesisResetsTheStudentConfirmation() {
        StudentProtocolDTOs.Response res = service.updateByTrainer(trainer.getEmail(), student.getId(),
                new StudentProtocolDTOs.UpdateRequest("Perda de Gordura", "PRO", 5, "Dor no joelho direito"));

        assertEquals("Perda de Gordura", res.goal());
        assertEquals("Marina", res.protocolUpdatedByName());
        assertFalse(res.protocolUpdatedByStudent());
        assertEquals("Marina", res.anamnesisUpdatedByName());
        assertNull(res.anamnesisConfirmedAt());
    }

    @Test
    void keepingAnamnesisKeepsTheConfirmation() {
        StudentProtocolDTOs.Response res = service.updateByTrainer(trainer.getEmail(), student.getId(),
                new StudentProtocolDTOs.UpdateRequest("Performance", "PRO", 4, "  Dor no joelho "));

        assertNotNull(res.anamnesisConfirmedAt());
        assertNull(res.anamnesisUpdatedAt());
    }

    @Test
    void rejectsUnknownGoal() {
        assertThrows(IllegalArgumentException.class, () -> service.updateByTrainer(trainer.getEmail(), student.getId(),
                new StudentProtocolDTOs.UpdateRequest("Emagrecer", "PRO", 4, null)));
    }

    @Test
    void studentConfirmsAnamnesis() {
        student.setAnamnesisConfirmedAt(null);
        assertNotNull(service.confirmAnamnesis(student.getEmail()).anamnesisConfirmedAt());
    }

    @Test
    void cannotConfirmEmptyAnamnesis() {
        student.setMedicalConditions(" ");
        assertThrows(IllegalArgumentException.class, () -> service.confirmAnamnesis(student.getEmail()));
    }
}
