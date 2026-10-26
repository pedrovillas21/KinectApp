package com.kinetic.services;

import com.kinetic.enums.Role;
import com.kinetic.exceptions.ActiveTrainerConflictException;
import com.kinetic.models.User;
import com.kinetic.repositories.CompanyRepository;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Vincular funcionário: uma empresa não pode tomar o personal de outra. */
class EmpresaServiceFuncionarioTest {

    private final UserRepository users = mock(UserRepository.class);
    private final TrainerLinkService links = mock(TrainerLinkService.class);
    private final EmpresaService service = new EmpresaService(
            users, mock(TrainerClientRepository.class), mock(WorkoutSessionRepository.class),
            links, mock(FeedbackService.class), mock(CompanyRepository.class), mock(TrainerEventService.class));

    private final UUID companyId = UUID.randomUUID();
    private final User empresa = user("empresa@test.local", Role.EMPRESA, companyId);

    @Test
    void personalOfAnotherCompanyIsConflict() {
        User personal = user("personal@test.local", Role.PERSONAL, UUID.randomUUID());
        stub(personal);

        assertThrows(ActiveTrainerConflictException.class,
                () -> service.vincularFuncionario(empresa.getEmail(), personal.getEmail()));
        verify(users, never()).save(any());
    }

    @Test
    void relinkingToTheSameCompanyIsIdempotent() {
        User personal = user("personal@test.local", Role.PERSONAL, companyId);
        stub(personal);
        when(users.save(personal)).thenReturn(personal);

        service.vincularFuncionario(empresa.getEmail(), personal.getEmail());

        assertEquals(companyId, personal.getCompanyId());
    }

    @Test
    void nonPersonalEmailGetsTheSameNotFound() {
        User aluno = user("aluno@test.local", Role.ALUNO, null);
        stub(aluno);

        assertThrows(EntityNotFoundException.class,
                () -> service.vincularFuncionario(empresa.getEmail(), aluno.getEmail()));
    }

    @Test
    void invitingDoesNotJoinUntilThePersonalAccepts() {
        User personal = user("personal@test.local", Role.PERSONAL, null);
        stub(personal);
        when(users.save(personal)).thenReturn(personal);

        service.vincularFuncionario(empresa.getEmail(), personal.getEmail());

        assertNull(personal.getCompanyId());
        assertEquals(companyId, personal.getPendingCompanyId());

        when(users.getByEmailOrThrow(personal.getEmail())).thenReturn(personal);
        service.acceptCompanyInvite(personal.getEmail());

        assertEquals(companyId, personal.getCompanyId());
        assertNull(personal.getPendingCompanyId());
    }

    @Test
    void leavingTheCompanyEndsTheStudentsItAssigned() {
        User personal = user("personal@test.local", Role.PERSONAL, companyId);
        when(users.getByEmailOrThrow(personal.getEmail())).thenReturn(personal);

        service.leaveCompanyByTrainer(personal.getEmail());

        assertNull(personal.getCompanyId());
        verify(links).endCompanyLinksOfTrainer(companyId, personal.getId());
    }

    @Test
    void removedByTheCompanyAlsoEndsTheStudentsItAssigned() {
        User personal = user("personal@test.local", Role.PERSONAL, companyId);
        when(users.getByEmailOrThrow(empresa.getEmail())).thenReturn(empresa);
        when(users.findById(personal.getId())).thenReturn(Optional.of(personal));

        service.desvincularFuncionario(empresa.getEmail(), personal.getId());

        assertNull(personal.getCompanyId());
        verify(links).endCompanyLinksOfTrainer(companyId, personal.getId());
    }

    private void stub(User target) {
        when(users.getByEmailOrThrow(empresa.getEmail())).thenReturn(empresa);
        when(users.findByEmail(target.getEmail())).thenReturn(Optional.of(target));
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
