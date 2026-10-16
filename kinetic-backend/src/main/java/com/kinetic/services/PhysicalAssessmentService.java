package com.kinetic.services;

import com.kinetic.dtos.PhysicalAssessmentDTOs.Request;
import com.kinetic.dtos.PhysicalAssessmentDTOs.Response;
import com.kinetic.models.PhysicalAssessment;
import com.kinetic.models.User;
import com.kinetic.repositories.PhysicalAssessmentRepository;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Avaliações físicas do aluno, registradas pelo personal com vínculo ATIVO.
 * O histórico é do aluno: continua lá mesmo se ele trocar de personal, e o
 * personal atual vê as avaliações anteriores (inclusive de outro personal).
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PhysicalAssessmentService {

    private final PhysicalAssessmentRepository repository;
    private final TrainerLinkService trainerLinkService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Response> list(String trainerEmail, @NonNull UUID studentId) {
        User student = trainerLinkService.resolveOwnedStudent(trainerEmail, studentId);
        return repository.findByStudentIdOrderByAssessedOnAscCreatedAtAsc(student.getId()).stream()
                .map(PhysicalAssessmentService::toResponse)
                .toList();
    }

    @Transactional
    public Response create(String trainerEmail, @NonNull UUID studentId, Request request) {
        requireMeasure(request);
        User student = trainerLinkService.resolveOwnedStudent(trainerEmail, studentId);
        PhysicalAssessment a = new PhysicalAssessment();
        a.setStudent(student);
        a.setTrainer(userRepository.getByEmailOrThrow(trainerEmail));
        apply(a, request);
        return toResponse(repository.save(a));
    }

    @Transactional
    public Response update(String trainerEmail, @NonNull UUID studentId, @NonNull UUID assessmentId, Request request) {
        requireMeasure(request);
        PhysicalAssessment a = owned(trainerEmail, studentId, assessmentId);
        apply(a, request);
        a.setUpdatedAt(Instant.now());
        return toResponse(repository.save(a));
    }

    @Transactional
    public void delete(String trainerEmail, @NonNull UUID studentId, @NonNull UUID assessmentId) {
        repository.delete(owned(trainerEmail, studentId, assessmentId));
    }

    // ── Internos ────────────────────────────────────────────────────────────

    private PhysicalAssessment owned(String trainerEmail, @NonNull UUID studentId, @NonNull UUID assessmentId) {
        User student = trainerLinkService.resolveOwnedStudent(trainerEmail, studentId);
        PhysicalAssessment a = repository.findById(assessmentId)
                .orElseThrow(() -> new EntityNotFoundException("Avaliação não encontrada."));
        if (!a.getStudent().getId().equals(student.getId())) {
            throw new EntityNotFoundException("Avaliação não encontrada.");
        }
        return a;
    }

    private static void requireMeasure(Request request) {
        if (!request.hasAnyMeasure()) {
            throw new IllegalArgumentException("Preencha ao menos uma medida da avaliação.");
        }
    }

    private static void apply(PhysicalAssessment a, Request r) {
        a.setAssessedOn(r.assessedOn());
        a.setWeightKg(r.weightKg());
        a.setHeightCm(r.heightCm());
        a.setBodyFatPct(r.bodyFatPct());
        a.setMuscleMassKg(r.muscleMassKg());
        a.setRestingHr(r.restingHr());
        a.setChestCm(r.chestCm());
        a.setWaistCm(r.waistCm());
        a.setAbdomenCm(r.abdomenCm());
        a.setHipCm(r.hipCm());
        a.setArmRightCm(r.armRightCm());
        a.setArmLeftCm(r.armLeftCm());
        a.setThighRightCm(r.thighRightCm());
        a.setThighLeftCm(r.thighLeftCm());
        a.setCalfRightCm(r.calfRightCm());
        a.setCalfLeftCm(r.calfLeftCm());
        String notes = r.notes() == null ? null : r.notes().trim();
        a.setNotes(notes == null || notes.isEmpty() ? null : notes);
    }

    static Response toResponse(PhysicalAssessment a) {
        Double bmi = a.getWeightKg() != null && a.getHeightCm() != null
                ? round1(a.getWeightKg() / Math.pow(a.getHeightCm() / 100.0, 2)) : null;
        Double fatMass = a.getWeightKg() != null && a.getBodyFatPct() != null
                ? round1(a.getWeightKg() * a.getBodyFatPct() / 100.0) : null;
        Double leanMass = fatMass != null ? round1(a.getWeightKg() - fatMass) : null;
        return new Response(a.getId(), a.getAssessedOn(), a.getWeightKg(), a.getHeightCm(), a.getBodyFatPct(),
                a.getMuscleMassKg(), a.getRestingHr(), a.getChestCm(), a.getWaistCm(), a.getAbdomenCm(),
                a.getHipCm(), a.getArmRightCm(), a.getArmLeftCm(), a.getThighRightCm(), a.getThighLeftCm(),
                a.getCalfRightCm(), a.getCalfLeftCm(), a.getNotes(), bmi, fatMass, leanMass,
                a.getTrainer() != null ? a.getTrainer().getNome() : null);
    }

    private static Double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
