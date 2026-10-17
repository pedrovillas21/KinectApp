package com.kinetic.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Perfil de um usuário visto por outro. Cabeçalho e contadores vêm sempre; com
 * {@code locked=true} (quem vê não é amigo aceito) as listas de atividade vêm vazias.
 * {@code connectionState}: SELF | CONNECTED | PENDING_OUTGOING | PENDING_INCOMING | NONE.
 */
public record PublicProfileDTO(
        UUID id,
        String name,
        String avatarUrl,
        LocalDate memberSince,
        @JsonProperty("isMe") boolean isMe,
        String connectionState,
        boolean locked,
        long postsCount,
        long friendsCount,
        long workoutsCount,
        int streakDays,
        List<LocalDate> weekStarts,
        List<Integer> weeklyMinutes,
        List<PersonalRecordDTO> records,
        List<AchievementDTO> achievements
) {}
