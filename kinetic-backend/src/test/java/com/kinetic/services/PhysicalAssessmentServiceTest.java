package com.kinetic.services;

import com.kinetic.dtos.PhysicalAssessmentDTOs.Request;
import com.kinetic.models.PhysicalAssessment;
import com.kinetic.models.User;
import com.kinetic.models.WeightHistory;
import com.kinetic.repositories.PhysicalAssessmentRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WeightHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PhysicalAssessmentServiceTest {

    private final PhysicalAssessmentRepository assessments = mock(PhysicalAssessmentRepository.class);
    private final TrainerLinkService links = mock(TrainerLinkService.class);
    private final UserRepository users = mock(UserRepository.class);
    private final WeightHistoryRepository weights = mock(WeightHistoryRepository.class);
    private final PhysicalAssessmentService service = new PhysicalAssessmentService(assessments, links, users, weights,
            mock(AuditService.class));

    private final User trainer = user("personal@test.local");
    private final User student = user("aluno@test.local");
    private final LocalDate day = LocalDate.of(2026, 10, 19);

    @BeforeEach
    void setUp() {
        when(users.getByEmailOrThrow(trainer.getEmail())).thenReturn(trainer);
    }

    @Test
    void createWritesTheWeightToTheStudentHistoryAndProfile() {
        when(links.resolveOwnedStudentForWrite(trainer.getEmail(), student.getId())).thenReturn(student);
        when(users.getByEmailOrThrow(trainer.getEmail())).thenReturn(trainer);
        when(assessments.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(assessments.findByStudentIdOrderByAssessedOnAscCreatedAtAsc(student.getId()))
                .thenReturn(List.of(assessment(85.0, 195.0)));
        when(weights.findByUserAndLoggedAt(student, day)).thenReturn(Optional.empty());
        WeightHistory latest = new WeightHistory();
        latest.setWeight(85.0);
        when(weights.findFirstByUserOrderByLoggedAtDesc(student)).thenReturn(Optional.of(latest));

        service.create(trainer.getEmail(), student.getId(), request(85.0, 195.0));

        ArgumentCaptor<WeightHistory> saved = ArgumentCaptor.forClass(WeightHistory.class);
        verify(weights).save(saved.capture());
        assertEquals(85.0, saved.getValue().getWeight());
        assertEquals(day, saved.getValue().getLoggedAt());
        assertEquals(85.0, student.getWeight());
        assertEquals(195.0, student.getHeight());
    }

    @Test
    void deleteKeepsAWeightTheStudentLoggedThemselves() {
        PhysicalAssessment a = assessment(85.0, null);
        a.setId(UUID.randomUUID());
        when(links.resolveOwnedStudentForWrite(trainer.getEmail(), student.getId())).thenReturn(student);
        when(assessments.findById(a.getId())).thenReturn(Optional.of(a));
        when(assessments.findByStudentIdOrderByAssessedOnAscCreatedAtAsc(student.getId())).thenReturn(List.of());
        WeightHistory own = new WeightHistory();
        own.setWeight(80.0);
        when(weights.findByUserAndLoggedAt(student, day)).thenReturn(Optional.of(own));
        when(weights.findFirstByUserOrderByLoggedAtDesc(student)).thenReturn(Optional.of(own));

        service.delete(trainer.getEmail(), student.getId(), a.getId());

        verify(weights, never()).delete(any());
    }

    @Test
    void deleteRemovesTheWeightPointItCreated() {
        PhysicalAssessment a = assessment(85.0, null);
        a.setId(UUID.randomUUID());
        when(links.resolveOwnedStudentForWrite(trainer.getEmail(), student.getId())).thenReturn(student);
        when(assessments.findById(a.getId())).thenReturn(Optional.of(a));
        when(assessments.findByStudentIdOrderByAssessedOnAscCreatedAtAsc(student.getId())).thenReturn(List.of());
        WeightHistory fromAssessment = new WeightHistory();
        fromAssessment.setWeight(85.0);
        when(weights.findByUserAndLoggedAt(student, day)).thenReturn(Optional.of(fromAssessment));
        when(weights.findFirstByUserOrderByLoggedAtDesc(student)).thenReturn(Optional.empty());

        service.delete(trainer.getEmail(), student.getId(), a.getId());

        verify(weights).delete(fromAssessment);
    }

    @Test
    void currentTrainerCannotChangeAnAssessmentFromThePreviousOne() {
        User previous = user("anterior@test.local");
        PhysicalAssessment a = assessment(85.0, null);
        a.setId(UUID.randomUUID());
        a.setTrainer(previous);
        when(links.resolveOwnedStudentForWrite(trainer.getEmail(), student.getId())).thenReturn(student);
        when(assessments.findById(a.getId())).thenReturn(Optional.of(a));

        assertThrows(IllegalArgumentException.class,
                () -> service.update(trainer.getEmail(), student.getId(), a.getId(), request(90.0, null)));
        assertThrows(IllegalArgumentException.class,
                () -> service.delete(trainer.getEmail(), student.getId(), a.getId()));
        verify(assessments, never()).delete(any());
    }

    private PhysicalAssessment assessment(Double weightKg, Double heightCm) {
        PhysicalAssessment a = new PhysicalAssessment();
        a.setStudent(student);
        a.setTrainer(trainer);
        a.setAssessedOn(day);
        a.setWeightKg(weightKg);
        a.setHeightCm(heightCm);
        return a;
    }

    private Request request(Double weightKg, Double heightCm) {
        return new Request(day, weightKg, heightCm, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null);
    }

    private static User user(String email) {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail(email);
        return u;
    }
}
