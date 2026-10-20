package com.kinetic.services;

import com.kinetic.utils.AppTime;

import com.kinetic.dtos.FinanceOverviewDTO.ChargeDTO;
import com.kinetic.dtos.StudentEngagementDTO;
import com.kinetic.dtos.TodayItemDTO;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.AiPlanGeneration;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.TrainerInviteCode;
import com.kinetic.models.User;
import com.kinetic.repositories.AiPlanGenerationRepository;
import com.kinetic.repositories.PhysicalAssessmentRepository;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.TrainerInviteCodeRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Caixa de entrada "Hoje" do personal: junta numa lista só o que pede ação —
 * cobranças atrasadas ou vencendo, alunos em risco de abandono, prévias de IA
 * esperando revisão, reavaliações e fichas antigas, convites vencendo.
 * Cada item aponta para a tela onde se resolve.
 */
@Service
@RequiredArgsConstructor
public class TrainerTodayService {

    /** Sem avaliação há mais que isso → sugerir reavaliação. */
    static final int REASSESS_AFTER_DAYS = 60;
    /** Ficha vigente mais nova com mais que isso → sugerir renovar. */
    static final int PLAN_STALE_AFTER_DAYS = 56;
    /** Cobranças vencendo nos próximos N dias também entram. */
    static final int CHARGE_LOOKAHEAD_DAYS = 3;

    private static final DateTimeFormatter DAY_MONTH = DateTimeFormatter.ofPattern("dd/MM");

    private final UserRepository userRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final StudentFinanceService financeService;
    private final TrainerEngagementService engagementService;
    private final AiPlanGenerationRepository aiPlanGenerationRepository;
    private final PhysicalAssessmentRepository assessmentRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final TrainerInviteCodeRepository inviteCodeRepository;

    @Transactional
    public List<TodayItemDTO> today(String trainerEmail) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        LocalDate today = AppTime.today();
        List<TrainerClient> links = trainerClientRepository
                .findByTrainerAndStatusFetchStudent(trainer.getId(), TrainerLinkStatus.ATIVO);
        Map<UUID, User> students = new HashMap<>();
        Map<UUID, LocalDate> linkedSince = new HashMap<>();
        for (TrainerClient l : links) {
            students.put(l.getStudent().getId(), l.getStudent());
            LocalDateTime since = l.getRespondedAt() != null ? l.getRespondedAt() : l.getCreatedAt();
            linkedSince.put(l.getStudent().getId(), since != null ? since.toLocalDate() : today);
        }

        List<TodayItemDTO> items = new ArrayList<>();
        addCharges(items, trainer, today);
        if (!students.isEmpty()) {
            addRisk(items, trainerEmail, students);
            addAiPreviews(items, trainer, students.keySet());
            addReassessments(items, students, linkedSince, today);
            addStalePlans(items, students, today);
        }
        addInvites(items, trainer);

        items.sort(Comparator.comparingInt((TodayItemDTO i) -> severityRank(i.severity()))
                .thenComparing(i -> i.type()));
        return items;
    }

    private void addCharges(List<TodayItemDTO> items, User trainer, LocalDate today) {
        NumberFormat brl = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR"));
        for (ChargeDTO c : financeService.pendingDueUntil(trainer, today.plusDays(CHARGE_LOOKAHEAD_DAYS))) {
            String value = brl.format(c.amountCents() / 100.0);
            long days = ChronoUnit.DAYS.between(today, c.dueDate());
            if (days < 0) {
                items.add(new TodayItemDTO("PAGAMENTO", "ALTO", c.studentId(), c.studentName(),
                        "Mensalidade atrasada", value + " · venceu em " + DAY_MONTH.format(c.dueDate()), "/financeiro"));
            } else {
                items.add(new TodayItemDTO("PAGAMENTO", "MEDIO", c.studentId(), c.studentName(),
                        days == 0 ? "Mensalidade vence hoje" : "Mensalidade vence em " + days + (days == 1 ? " dia" : " dias"),
                        value + " · vencimento " + DAY_MONTH.format(c.dueDate()), "/financeiro"));
            }
        }
    }

    private void addRisk(List<TodayItemDTO> items, String trainerEmail, Map<UUID, User> students) {
        for (StudentEngagementDTO e : engagementService.engagement(trainerEmail)) {
            if (StudentRiskRules.OK.equals(e.risk()) || e.alerts().isEmpty()) continue;
            User s = students.get(e.studentId());
            items.add(new TodayItemDTO("RISCO", e.risk(), e.studentId(), s != null ? s.getNome() : null,
                    e.alerts().get(0).message(), "Risco de abandono · fale com o aluno", "/students/" + e.studentId()));
        }
    }

    private void addAiPreviews(List<TodayItemDTO> items, User trainer, Set<UUID> activeStudents) {
        LocalDateTime since = LocalDateTime.now().minus(TrainerAiPlanService.PREVIEW_TTL);
        Set<UUID> seen = new HashSet<>();
        for (AiPlanGeneration g : aiPlanGenerationRepository.findOpenPreviews(trainer.getId(), since)) {
            UUID studentId = g.getStudent().getId();
            // Só a prévia mais recente de cada aluno, e só de quem ainda está na carteira.
            if (!activeStudents.contains(studentId) || !seen.add(studentId)) continue;
            long hoursLeft = Math.max(0, Duration.between(LocalDateTime.now(),
                    g.getCreatedAt().plus(TrainerAiPlanService.PREVIEW_TTL)).toHours());
            items.add(new TodayItemDTO("PREVIA_IA", "MEDIO", studentId, g.getStudent().getNome(),
                    "Prévia de ficha por IA esperando sua revisão",
                    "Vale por mais " + hoursLeft + "h", "/students/" + studentId + "?aba=treinos"));
        }
    }

    private void addReassessments(List<TodayItemDTO> items, Map<UUID, User> students,
                                  Map<UUID, LocalDate> linkedSince, LocalDate today) {
        Map<UUID, LocalDate> latest = new HashMap<>();
        for (Object[] row : assessmentRepository.findLatestDatePerStudent(students.keySet())) {
            latest.put((UUID) row[0], (LocalDate) row[1]);
        }
        for (User s : students.values()) {
            LocalDate last = latest.get(s.getId());
            String path = "/students/" + s.getId() + "?aba=avaliacoes";
            if (last == null) {
                // Só cobra a 1ª avaliação de quem já está há 2 semanas na carteira.
                if (ChronoUnit.DAYS.between(linkedSince.get(s.getId()), today) >= 14) {
                    items.add(new TodayItemDTO("REAVALIACAO", "INFO", s.getId(), s.getNome(),
                            "Ainda sem avaliação física", "Registre a primeira para acompanhar a evolução", path));
                }
            } else {
                long days = ChronoUnit.DAYS.between(last, today);
                if (days >= REASSESS_AFTER_DAYS) {
                    items.add(new TodayItemDTO("REAVALIACAO", "INFO", s.getId(), s.getNome(),
                            "Hora de reavaliar", "Última avaliação há " + days + " dias", path));
                }
            }
        }
    }

    private void addStalePlans(List<TodayItemDTO> items, Map<UUID, User> students, LocalDate today) {
        for (Object[] row : workoutPlanRepository.findNewestActiveCreatedAtPerUser(students.keySet())) {
            UUID studentId = (UUID) row[0];
            LocalDateTime newest = (LocalDateTime) row[1];
            long days = ChronoUnit.DAYS.between(newest.toLocalDate(), today);
            if (days >= PLAN_STALE_AFTER_DAYS) {
                User s = students.get(studentId);
                items.add(new TodayItemDTO("FICHA_ANTIGA", "INFO", studentId, s != null ? s.getNome() : null,
                        "Ficha com " + (days / 7) + " semanas", "Hora de renovar o treino?",
                        "/students/" + studentId + "?aba=treinos"));
            }
        }
    }

    private void addInvites(List<TodayItemDTO> items, User trainer) {
        Instant now = Instant.now();
        Instant soon = now.plus(Duration.ofDays(2));
        for (TrainerInviteCode c : inviteCodeRepository.findOpenByTrainer(trainer.getId())) {
            String name = c.getLabel() != null ? "Convite \"" + c.getLabel() + "\"" : "Convite sem nome";
            if (!c.getExpiresAt().isAfter(now)) {
                items.add(new TodayItemDTO("CONVITE", "INFO", null, null, name + " venceu",
                        "Gere um novo link ou cancele o convite", "#convites-pendentes"));
            } else if (c.getExpiresAt().isBefore(soon)) {
                items.add(new TodayItemDTO("CONVITE", "INFO", null, null, name + " vence em breve",
                        "O aluno ainda não usou o código", "#convites-pendentes"));
            }
        }
    }

    private static int severityRank(String severity) {
        return switch (severity) {
            case "ALTO" -> 0;
            case "MEDIO" -> 1;
            default -> 2;
        };
    }
}
