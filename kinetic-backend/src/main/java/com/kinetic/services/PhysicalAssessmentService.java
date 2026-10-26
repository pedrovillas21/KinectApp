package com.kinetic.services;

import com.kinetic.dtos.PhysicalAssessmentDTOs.Request;
import com.kinetic.dtos.PhysicalAssessmentDTOs.Response;
import com.kinetic.models.PhysicalAssessment;
import com.kinetic.models.User;
import com.kinetic.models.WeightHistory;
import com.kinetic.repositories.PhysicalAssessmentRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WeightHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Avaliações físicas do aluno, registradas pelo personal com vínculo ATIVO.
 * O histórico é do aluno: continua lá mesmo se ele trocar de personal, e o
 * personal atual vê as avaliações anteriores (inclusive de outro personal).
 * Com vínculo ATIVO as medidas do aluno são do personal: o peso de cada avaliação
 * vira o ponto do dia no histórico de peso (gráfico do app) e o peso/altura atuais.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PhysicalAssessmentService {

    private final PhysicalAssessmentRepository repository;
    private final TrainerLinkService trainerLinkService;
    private final UserRepository userRepository;
    private final WeightHistoryRepository weightHistoryRepository;

    /** Lado do aluno: as próprias avaliações, com os pareceres do personal. */
    @Transactional(readOnly = true)
    public List<Response> listMine(String studentEmail) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        return repository.findByStudentIdOrderByAssessedOnAscCreatedAtAsc(student.getId()).stream()
                .map(PhysicalAssessmentService::toResponse)
                .toList();
    }

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
        User student = trainerLinkService.resolveOwnedStudentForWrite(trainerEmail, studentId);
        PhysicalAssessment a = new PhysicalAssessment();
        a.setStudent(student);
        a.setTrainer(userRepository.getByEmailOrThrow(trainerEmail));
        apply(a, request);
        PhysicalAssessment saved = repository.save(a);
        syncBodyMetrics(student, saved.getAssessedOn(), null);
        return toResponse(saved);
    }

    @Transactional
    public Response update(String trainerEmail, @NonNull UUID studentId, @NonNull UUID assessmentId, Request request) {
        requireMeasure(request);
        PhysicalAssessment a = owned(trainerEmail, studentId, assessmentId);
        LocalDate oldDate = a.getAssessedOn();
        Double oldWeight = a.getWeightKg();
        apply(a, request);
        a.setUpdatedAt(Instant.now());
        PhysicalAssessment saved = repository.save(a);
        boolean moved = !oldDate.equals(saved.getAssessedOn());
        if (moved) {
            syncBodyMetrics(saved.getStudent(), oldDate, oldWeight);
        }
        syncBodyMetrics(saved.getStudent(), saved.getAssessedOn(), moved ? null : oldWeight);
        return toResponse(saved);
    }

    @Transactional
    public void delete(String trainerEmail, @NonNull UUID studentId, @NonNull UUID assessmentId) {
        PhysicalAssessment a = owned(trainerEmail, studentId, assessmentId);
        repository.delete(a);
        syncBodyMetrics(a.getStudent(), a.getAssessedOn(), a.getWeightKg());
    }

    // ── Internos ────────────────────────────────────────────────────────────

    private PhysicalAssessment owned(String trainerEmail, @NonNull UUID studentId, @NonNull UUID assessmentId) {
        User student = trainerLinkService.resolveOwnedStudentForWrite(trainerEmail, studentId);
        PhysicalAssessment a = repository.findById(assessmentId)
                .orElseThrow(() -> new EntityNotFoundException("Avaliação não encontrada."));
        if (!a.getStudent().getId().equals(student.getId())) {
            throw new EntityNotFoundException("Avaliação não encontrada.");
        }
        // Avaliação é registro profissional de quem a fez: o personal atual vê o histórico
        // do aluno, mas não altera nem apaga o que outro personal assinou.
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        if (a.getTrainer() == null || !a.getTrainer().getId().equals(trainer.getId())) {
            throw new IllegalArgumentException("Só o personal que fez esta avaliação pode alterá-la ou excluí-la.");
        }
        return a;
    }

    /**
     * Reflete as avaliações no histórico de peso do dia {@code date} e no peso/altura
     * atuais do aluno. Sem peso avaliado no dia, só apaga o ponto se ele veio da
     * avaliação removida ({@code previousWeight}): um registro do próprio aluno fica.
     */
    private void syncBodyMetrics(User student, LocalDate date, Double previousWeight) {
        List<PhysicalAssessment> all = repository.findByStudentIdOrderByAssessedOnAscCreatedAtAsc(student.getId());
        Double dayWeight = null;
        for (PhysicalAssessment a : all) {
            if (a.getAssessedOn().equals(date) && a.getWeightKg() != null) dayWeight = a.getWeightKg();
        }
        var row = weightHistoryRepository.findByUserAndLoggedAt(student, date);
        if (dayWeight != null) {
            WeightHistory h = row.orElseGet(WeightHistory::new);
            h.setUser(student);
            h.setLoggedAt(date);
            h.setWeight(dayWeight);
            weightHistoryRepository.save(h);
        } else if (row.isPresent() && Objects.equals(row.get().getWeight(), previousWeight)) {
            weightHistoryRepository.delete(row.get());
        }

        weightHistoryRepository.findFirstByUserOrderByLoggedAtDesc(student)
                .ifPresent(h -> student.setWeight(h.getWeight()));
        for (PhysicalAssessment a : all) {
            if (a.getHeightCm() != null) student.setHeight(a.getHeightCm());
        }
        userRepository.save(student);
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
