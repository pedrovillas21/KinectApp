package com.kinetic.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Perfil profissional do personal: edição pelo painel e visão do aluno vinculado. */
public final class TrainerProfileDTOs {

    private TrainerProfileDTOs() {}

    /** Item de formação: título e detalhe (ex.: "UFMG · 2018"). */
    public record Education(
            @NotBlank(message = "Informe o nome da formação")
            @Size(max = 120, message = "Formação com no máximo 120 caracteres") String title,
            @Size(max = 120, message = "Detalhe da formação com no máximo 120 caracteres") String detail
    ) {}

    /**
     * PUT do personal: substitui o perfil inteiro. Campos vazios ficam nulos;
     * {@code crefVerified} não entra aqui (só o Kinetic verifica).
     */
    public record Request(
            @Size(max = 24, message = "CREF inválido. Use o formato 000000-G/UF") String cref,
            @Size(max = 1500, message = "Bio com no máximo 1500 caracteres") String bio,
            @Size(max = 12, message = "No máximo 12 especialidades")
            List<@Size(max = 40, message = "Especialidade com no máximo 40 caracteres") String> specialties,
            @Size(max = 10, message = "No máximo 10 formações")
            List<@Valid Education> education,
            @Size(max = 80, message = "Modalidade com no máximo 80 caracteres") String modality,
            @Size(max = 80, message = "Horário com no máximo 80 caracteres") String schedule,
            @Size(max = 80, message = "Local com no máximo 80 caracteres") String location
    ) {}

    /**
     * Perfil público do personal. {@code updatedAt} nulo = o personal ainda não
     * preencheu nada (as listas vêm vazias e os textos nulos).
     */
    public record Response(
            UUID trainerId,
            String nome,
            String avatarUrl,
            String phone,
            String cref,
            boolean crefVerified,
            String bio,
            List<String> specialties,
            List<Education> education,
            String modality,
            String schedule,
            String location,
            Instant updatedAt
    ) {}

    /** Ficha vigente montada pelo personal para o aluno. */
    public record PlanItem(
            UUID id,
            String title,
            String subtitle,
            String tag,
            int exerciseCount,
            LocalDateTime createdAt
    ) {}

    /**
     * Tela "Seu personal" do app. {@code lastReviewAt} = ficha mais recente que o
     * personal montou para o aluno (vigente ou arquivada); nulo se nunca montou.
     * {@code canEndLink} é false para vínculo atribuído pela empresa.
     */
    public record StudentView(
            UUID linkId,
            String linkSource,
            boolean canEndLink,
            LocalDateTime linkedSince,
            Response trainer,
            int activePlanCount,
            LocalDateTime lastReviewAt,
            List<PlanItem> plans
    ) {}
}
