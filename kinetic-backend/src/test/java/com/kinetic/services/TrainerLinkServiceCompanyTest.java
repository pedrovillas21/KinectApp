package com.kinetic.services;

import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.enums.Role;
import com.kinetic.enums.TrainerLinkSource;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Vínculo atribuído pela empresa: nasce PENDENTE e o aluno pode encerrá-lo. */
class TrainerLinkServiceCompanyTest {

    private final TrainerClientRepository links = mock(TrainerClientRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final TrainerLinkService service = new TrainerLinkService(
            links, users, mock(BillingService.class), mock(TrainerEventService.class));

    private final UUID companyId = UUID.randomUUID();
    private final User trainer = user("personal@test.local", Role.PERSONAL, companyId);
    private final User student = user("aluno@test.local", Role.ALUNO, null);

    @Test
    void companyAssignmentCreatesPendingInviteInsteadOfActiveLink() {
        when(users.findById(trainer.getId())).thenReturn(Optional.of(trainer));
        when(users.findById(student.getId())).thenReturn(Optional.of(student));
        when(links.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        TrainerLinkDTO dto = service.assignStudentToTrainer(companyId, trainer.getId(), student.getId());

        assertEquals(TrainerLinkStatus.PENDENTE.name(), dto.status());
        assertEquals(TrainerLinkSource.COMPANY.name(), dto.source());
    }

    @Test
    void trainerOfAnotherCompanyIsNotFound() {
        when(users.findById(trainer.getId())).thenReturn(Optional.of(trainer));

        assertThrows(EntityNotFoundException.class,
                () -> service.assignStudentToTrainer(UUID.randomUUID(), trainer.getId(), student.getId()));
        verify(links, never()).saveAndFlush(any());
    }

    @Test
    void studentCanEndCompanyLink() {
        TrainerClient link = new TrainerClient();
        link.setTrainer(trainer);
        link.setStudent(student);
        link.setStatus(TrainerLinkStatus.ATIVO);
        link.setSource(TrainerLinkSource.COMPANY);
        link.setCompanyId(companyId);
        when(users.getByEmailOrThrow(student.getEmail())).thenReturn(student);
        when(links.findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)).thenReturn(Optional.of(link));

        service.endLinkByStudent(student.getEmail());

        assertEquals(TrainerLinkStatus.ENCERRADO, link.getStatus());
        verify(links).save(link);
    }

    /** Item 15: o convite não revela se o e-mail tem conta, o papel dele ou se já tem personal. */
    @Test
    void inviteGivesTheSameAnswerForEveryUnavailableEmail() {
        User own = user("eu@test.local", Role.PERSONAL, null);
        User otherTrainer = user("outro@test.local", Role.PERSONAL, null);
        User taken = user("comPersonal@test.local", Role.ALUNO, null);
        when(users.getByEmailOrThrow(own.getEmail())).thenReturn(own);
        when(users.findByEmail("ninguem@test.local")).thenReturn(Optional.empty());
        when(users.findByEmail(otherTrainer.getEmail())).thenReturn(Optional.of(otherTrainer));
        when(users.findByEmail(own.getEmail())).thenReturn(Optional.of(own));
        when(users.findByEmail(taken.getEmail())).thenReturn(Optional.of(taken));
        when(links.existsByStudentIdAndStatus(taken.getId(), TrainerLinkStatus.ATIVO)).thenReturn(true);

        for (String email : new String[]{"ninguem@test.local", otherTrainer.getEmail(), own.getEmail(), taken.getEmail()}) {
            IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                    () -> service.invite(own.getEmail(), email));
            assertEquals(TrainerLinkService.INVITE_NOT_POSSIBLE, e.getMessage());
        }
        verify(links, never()).saveAndFlush(any());
    }

    private static User user(String email, Role role, UUID companyId) {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail(email);
        u.setRole(role);
        u.setCompanyId(companyId);
        return u;
    }
}
