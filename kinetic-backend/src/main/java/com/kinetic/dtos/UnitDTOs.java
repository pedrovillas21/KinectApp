package com.kinetic.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

/** Filiais da rede do dono (painel /dono). */
public final class UnitDTOs {

    private UnitDTOs() {}

    /**
     * Cadastro/edição de filial. O e-mail do responsável recebe o acesso e pode repetir entre
     * filiais; o login da filial é rede.usuario (usuario não muda depois de criado).
     */
    public record Request(
            @NotBlank(message = "O nome da filial é obrigatório.")
            @Size(max = 255, message = "Nome da filial longo demais.")
            String nome,
            @NotBlank(message = "O CNPJ da filial é obrigatório.")
            String cnpj,
            @Size(max = 500, message = "Endereço longo demais.")
            String address,
            @Size(max = 20, message = "Telefone longo demais.")
            String phone,
            @NotBlank(message = "O nome do responsável é obrigatório.")
            @Size(max = 255, message = "Nome do responsável longo demais.")
            String responsibleName,
            @NotBlank(message = "O e-mail do responsável é obrigatório.")
            @Email(message = "E-mail do responsável inválido.")
            String responsibleEmail,
            // Só na criação; ignorado na edição.
            @Pattern(regexp = "^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$",
                    message = "Usuário: letras minúsculas, números e hífen, até 40 caracteres.")
            String usuario
    ) {}

    public record StatusRequest(@NotNull(message = "Informe se a filial fica ativa.") Boolean active) {}

    public record Response(
            UUID id,
            String nome,
            String cnpj,
            String address,
            String phone,
            String responsibleName,
            String responsibleEmail,
            String username,
            UUID accountId,
            boolean active,
            boolean secondFactorEnabled,
            long personais,
            long alunosAtivos,
            LocalDateTime createdAt
    ) {}

    /** A rede do dono logado. */
    public record Network(UUID id, String nome, String cnpj, String slug) {}
}
