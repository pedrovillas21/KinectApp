package com.kinetic.services;

import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class TrainerEventServiceTest {

    private final UserRepository users = mock(UserRepository.class);
    private final TrainerClientRepository links = mock(TrainerClientRepository.class);
    private final TrainerEventService service = new TrainerEventService(users, links);

    private final User trainer = user("trainer@test.local");
    private final User student = user("aluno@test.local");

    @Test
    void studentChangedWithNoPanelOpenSkipsTheDatabase() {
        service.studentChanged(student.getEmail());
        verifyNoInteractions(users, links);
    }

    @Test
    void studentChangedLooksUpTheActiveTrainerWhenSomeoneIsListening() {
        when(users.getByEmailOrThrow(trainer.getEmail())).thenReturn(trainer);
        when(users.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        TrainerClient link = new TrainerClient();
        link.setTrainer(trainer);
        link.setStudent(student);
        when(links.findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)).thenReturn(Optional.of(link));

        service.subscribe(trainer.getEmail());
        assertDoesNotThrow(() -> service.studentChanged(student.getEmail()));

        verify(links).findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO);
    }

    @Test
    void studentWithoutTrainerIsIgnored() {
        when(users.getByEmailOrThrow(trainer.getEmail())).thenReturn(trainer);
        when(users.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(links.findByStudentIdAndStatus(any(), any())).thenReturn(Optional.empty());

        service.subscribe(trainer.getEmail());
        assertDoesNotThrow(() -> service.studentChanged(student.getEmail()));
        verify(users, never()).findById(any());
    }

    private static User user(String email) {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail(email);
        return u;
    }
}
