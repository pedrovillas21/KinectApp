package com.kinetic.services;

import lombok.RequiredArgsConstructor;
import com.kinetic.utils.AppTime;

import com.kinetic.dtos.BestSetDTO;
import com.kinetic.dtos.CompareProgressDTO;
import com.kinetic.dtos.CompareSideDTO;
import com.kinetic.dtos.PersonalRecordDTO;
import com.kinetic.dtos.PublicProfileDTO;
import com.kinetic.dtos.SharedPrDTO;
import com.kinetic.dtos.WorkoutSummaryDTO;
import com.kinetic.exceptions.ForbiddenException;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutSession;
import com.kinetic.repositories.SocialPostRepository;
import com.kinetic.repositories.UserConnectionRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Perfil de outro usuário (estilo Instagram/Hevy) e "Comparar progresso" entre amigos.
 * Regra de acesso única: a atividade (gráfico, recordes, conquistas, posts, treinos) só
 * aparece para o próprio usuário ou amigos com conexão ACCEPTED. O comparar usa só
 * dados de treino — peso corporal nunca sai daqui.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicProfileService {

    private final SocialService socialService;
    private final TrainingSummaryService trainingSummaryService;
    private final SocialPostRepository postRepository;
    private final UserConnectionRepository connectionRepository;
    private final WorkoutSessionRepository workoutSessionRepository;

    public PublicProfileDTO getProfile(String email, UUID userId) {
        User me = socialService.findByEmail(email);
        User target = socialService.findById(userId);
        boolean isMe = me.getId().equals(target.getId());
        boolean locked = !socialService.canSeeActivity(me, target);
        UUID id = target.getId();

        List<LocalDate> weekStarts = trainingSummaryService.lastWeekStarts();
        return new PublicProfileDTO(
                id,
                target.getNome(),
                target.getAvatarUrl(),
                target.getCreatedAt() != null ? target.getCreatedAt().toLocalDate() : null,
                isMe,
                isMe ? "SELF" : socialService.connectionState(me, target),
                locked,
                postRepository.countByAuthorIdAndKind(id, "POST"),
                connectionRepository.countAcceptedFor(id),
                trainingSummaryService.totalSessions(id),
                locked ? 0 : trainingSummaryService.streakDays(id),
                weekStarts,
                locked ? List.of() : trainingSummaryService.weeklyMinutes(id, weekStarts),
                locked ? List.of() : trainingSummaryService.personalRecords(id),
                locked ? List.of() : trainingSummaryService.achievements(id)
        );
    }

    /** Aba "Treinos" do perfil: sessões registradas, mais recentes primeiro (amigo ou eu; senão 403). */
    public Page<WorkoutSummaryDTO> getUserWorkouts(String email, UUID userId, Pageable pageable) {
        User me = socialService.findByEmail(email);
        User target = socialService.findById(userId);
        socialService.ensureCanSeeActivity(me, target);

        Page<WorkoutSession> page = workoutSessionRepository
                .findByUserIdOrderBySessionDateDescIdDesc(target.getId(), pageable);
        Map<UUID, WorkoutSummaryDTO> summaries = trainingSummaryService.summarize(page.getContent());
        return page.map(s -> summaries.get(s.getId()));
    }

    /**
     * Compara o usuário logado com um amigo: minutos por semana (12), sessões no mês,
     * sequência, total, volume 30 dias e recordes dos exercícios que os dois fazem.
     * 400 se for o próprio usuário; 403 se a amizade não estiver aceita.
     */
    public CompareProgressDTO compare(String email, UUID friendId) {
        User me = socialService.findByEmail(email);
        if (me.getId().equals(friendId)) {
            throw new IllegalArgumentException("Não dá para comparar com você mesmo.");
        }
        User friend = socialService.findById(friendId);
        if (!socialService.canSeeActivity(me, friend)) {
            throw new ForbiddenException("Só dá para comparar progresso com amigos.");
        }

        List<LocalDate> weekStarts = trainingSummaryService.lastWeekStarts();
        Map<String, PersonalRecordDTO> myPrs = trainingSummaryService.personalRecordsByKey(me.getId());
        Map<String, PersonalRecordDTO> friendPrs = trainingSummaryService.personalRecordsByKey(friend.getId());

        List<SharedPrDTO> shared = new ArrayList<>();
        for (Map.Entry<String, PersonalRecordDTO> e : myPrs.entrySet()) {
            PersonalRecordDTO theirs = friendPrs.get(e.getKey());
            if (theirs == null) continue;
            PersonalRecordDTO mine = e.getValue();
            shared.add(new SharedPrDTO(mine.exercise(),
                    new BestSetDTO(mine.weightKg(), mine.reps()),
                    new BestSetDTO(theirs.weightKg(), theirs.reps())));
        }
        shared.sort(Comparator.comparing((SharedPrDTO p) -> p.exercise(), String.CASE_INSENSITIVE_ORDER));

        return new CompareProgressDTO(weekStarts, side(me, weekStarts), side(friend, weekStarts), shared);
    }

    private CompareSideDTO side(User u, List<LocalDate> weekStarts) {
        LocalDate today = AppTime.today();
        return new CompareSideDTO(
                u.getId(),
                u.getNome(),
                u.getAvatarUrl(),
                trainingSummaryService.weeklyMinutes(u.getId(), weekStarts),
                trainingSummaryService.sessionsThisMonth(u.getId()),
                trainingSummaryService.streakDays(u.getId()),
                trainingSummaryService.totalSessions(u.getId()),
                trainingSummaryService.volumeBetween(u.getId(), today.minusDays(29), today)
        );
    }
}
