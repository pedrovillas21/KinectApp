package com.kinetic.services;

import com.kinetic.dtos.TrainerProfileDTOs;
import com.kinetic.enums.TrainerLinkSource;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.TrainerProfile;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.TrainerProfileRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Perfil profissional do personal: o personal edita pelo painel e o aluno com
 * vínculo ATIVO vê na tela "Seu personal" do app, junto com o resumo do vínculo
 * e das fichas que o personal montou para ele.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TrainerProfileService {

    /** 6 dígitos, categoria (G = graduado, P = provisionado) e UF: "012345-G/SP". */
    private static final Pattern CREF_PATTERN = Pattern.compile("^(\\d{6})-?([GP])/?([A-Z]{2})$");

    private static final Set<String> UFS = Set.of(
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
            "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO");

    /** Separador entre título e detalhe de cada item de formação no text[]. */
    private static final String EDUCATION_SEPARATOR = "\n";

    private final TrainerProfileRepository trainerProfileRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final UserRepository userRepository;
    private final WorkoutPlanRepository workoutPlanRepository;

    @Transactional(readOnly = true)
    public TrainerProfileDTOs.Response getOwnProfile(String trainerEmail) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        return toResponse(trainer, trainerProfileRepository.findById(trainer.getId()).orElse(null));
    }

    @Transactional
    public TrainerProfileDTOs.Response updateOwnProfile(String trainerEmail, TrainerProfileDTOs.Request dto) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        TrainerProfile profile = trainerProfileRepository.findById(trainer.getId()).orElseGet(() -> {
            TrainerProfile created = new TrainerProfile();
            created.setUserId(trainer.getId());
            return created;
        });

        String cref = normalizeCref(dto.cref());
        // Verificação vale para um número específico: trocou o CREF, volta a "não verificado".
        if (!Objects.equals(cref, profile.getCref())) {
            profile.setCrefVerified(false);
        }
        profile.setCref(cref);
        profile.setBio(clean(dto.bio()));
        profile.setSpecialties(normalizeSpecialties(dto.specialties()));
        profile.setEducation(encodeEducation(dto.education()));
        profile.setModality(clean(dto.modality()));
        profile.setSchedule(clean(dto.schedule()));
        profile.setLocation(clean(dto.location()));
        profile.setUpdatedAt(Instant.now());

        return toResponse(trainer, trainerProfileRepository.save(profile));
    }

    /** Tela "Seu personal" do aluno. 404 sem vínculo ATIVO (mesma regra de GET /api/me/trainer). */
    @Transactional(readOnly = true)
    public TrainerProfileDTOs.StudentView getMyTrainerProfile(String studentEmail) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        TrainerClient link = trainerClientRepository
                .findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)
                .orElseThrow(() -> new EntityNotFoundException("Você não possui personal ativo."));
        User trainer = link.getTrainer();

        List<TrainerProfileDTOs.PlanItem> plans = workoutPlanRepository
                .findByUserIdAndCreatedByIdAndStatusOrderByCreatedAtAsc(student.getId(), trainer.getId(), "active")
                .stream()
                .map(this::toPlanItem)
                .toList();

        return new TrainerProfileDTOs.StudentView(
                link.getId(),
                link.getSource().name(),
                link.getSource() != TrainerLinkSource.COMPANY,
                // Convite aceito: vale o aceite; código/empresa já nascem ATIVOS.
                link.getRespondedAt() != null ? link.getRespondedAt() : link.getCreatedAt(),
                toResponse(trainer, trainerProfileRepository.findById(trainer.getId()).orElse(null)),
                plans.size(),
                workoutPlanRepository.findLatestCreatedAtByTrainer(student.getId(), trainer.getId()).orElse(null),
                plans
        );
    }

    /**
     * Aceita "012345-G/SP", "012345G/SP", "CREF 012345-g/sp"… e grava sempre
     * como "012345-G/SP". Vazio = sem CREF.
     */
    static String normalizeCref(String raw) {
        String value = clean(raw);
        if (value == null) return null;
        value = value.toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
        if (value.startsWith("CREF")) value = value.substring(4);
        Matcher m = CREF_PATTERN.matcher(value);
        if (!m.matches() || !UFS.contains(m.group(3))) {
            throw new IllegalArgumentException("CREF inválido. Use o formato 000000-G/UF (ex.: 012345-G/SP).");
        }
        return m.group(1) + "-" + m.group(2) + "/" + m.group(3);
    }

    /** Remove vazios e repetidas (sem diferenciar maiúsculas), mantendo a ordem. */
    private static List<String> normalizeSpecialties(List<String> raw) {
        if (raw == null) return new ArrayList<>();
        Map<String, String> unique = new LinkedHashMap<>();
        for (String item : raw) {
            String value = clean(item);
            if (value != null) unique.putIfAbsent(value.toLowerCase(Locale.ROOT), value);
        }
        return new ArrayList<>(unique.values());
    }

    private static List<String> encodeEducation(List<TrainerProfileDTOs.Education> raw) {
        List<String> encoded = new ArrayList<>();
        if (raw == null) return encoded;
        for (TrainerProfileDTOs.Education item : raw) {
            if (item == null) continue;
            String title = singleLine(item.title());
            if (title == null) continue;
            String detail = singleLine(item.detail());
            encoded.add(detail == null ? title : title + EDUCATION_SEPARATOR + detail);
        }
        return encoded;
    }

    private static List<TrainerProfileDTOs.Education> decodeEducation(List<String> stored) {
        if (stored == null) return List.of();
        return stored.stream()
                .map(item -> {
                    int sep = item.indexOf(EDUCATION_SEPARATOR);
                    return sep < 0
                            ? new TrainerProfileDTOs.Education(item, null)
                            : new TrainerProfileDTOs.Education(item.substring(0, sep), item.substring(sep + 1));
                })
                .toList();
    }

    private TrainerProfileDTOs.PlanItem toPlanItem(WorkoutPlan plan) {
        // A coleção já vem sem os exercícios arquivados (@SQLRestriction no model).
        return new TrainerProfileDTOs.PlanItem(
                plan.getId(),
                plan.getTitle(),
                plan.getSubtitle(),
                plan.getTag(),
                plan.getExercises().size(),
                plan.getCreatedAt()
        );
    }

    private static TrainerProfileDTOs.Response toResponse(User trainer, TrainerProfile profile) {
        if (profile == null) {
            return new TrainerProfileDTOs.Response(
                    trainer.getId(), trainer.getNome(), trainer.getAvatarUrl(), trainer.getPhone(),
                    null, false, null, List.of(), List.of(), null, null, null, null);
        }
        return new TrainerProfileDTOs.Response(
                trainer.getId(),
                trainer.getNome(),
                trainer.getAvatarUrl(),
                trainer.getPhone(),
                profile.getCref(),
                profile.isCrefVerified(),
                profile.getBio(),
                profile.getSpecialties() == null ? List.of() : List.copyOf(profile.getSpecialties()),
                decodeEducation(profile.getEducation()),
                profile.getModality(),
                profile.getSchedule(),
                profile.getLocation(),
                profile.getUpdatedAt()
        );
    }

    private static String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Quebra de linha é o separador do text[] de formação: não pode aparecer dentro do texto. */
    private static String singleLine(String value) {
        return clean(value == null ? null : value.replaceAll("[\\r\\n]+", " "));
    }
}
