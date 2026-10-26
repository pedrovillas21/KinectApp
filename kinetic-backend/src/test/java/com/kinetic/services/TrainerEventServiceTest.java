package com.kinetic.services;

import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class TrainerEventServiceTest {

    private final UserRepository users = mock(UserRepository.class);
    private final TrainerClientRepository links = mock(TrainerClientRepository.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final TrainerEventService service =
            new TrainerEventService(users, links, jdbc, mock(PlatformTransactionManager.class));

    private final User trainer = user("trainer@test.local");
    private final User student = user("aluno@test.local");

    @Test
    void studentChangedPublishesForTheActiveTrainerEvenWithNoPanelOnThisCopy() {
        when(users.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        TrainerClient link = new TrainerClient();
        link.setTrainer(trainer);
        link.setStudent(student);
        when(links.findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)).thenReturn(Optional.of(link));

        service.studentChanged(student.getEmail());

        verify(jdbc).update(anyString(), eq(trainer.getId()), eq("student"), eq(student.getId()));
    }

    @Test
    void studentWithoutTrainerPublishesNothing() {
        when(users.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(links.findByStudentIdAndStatus(any(), any())).thenReturn(Optional.empty());

        service.studentChanged(student.getEmail());

        verifyNoInteractions(jdbc);
    }

    private static User user(String email) {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail(email);
        return u;
    }
}
