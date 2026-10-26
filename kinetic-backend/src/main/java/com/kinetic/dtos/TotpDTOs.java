package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Etapa do app autenticador no login das contas de gestão (DONO, EMPRESA, ROOT). */
public final class TotpDTOs {

    private TotpDTOs() {}

    public record ChallengeRequest(@NotBlank(message = "Entre com a senha de novo.") String challengeToken) {}

    public record CodeRequest(
            @NotBlank(message = "Entre com a senha de novo.") String challengeToken,
            @NotBlank(message = "Digite o código.") @Size(max = 20, message = "Código inválido.") String code) {}

    /** otpauthUri vira o QR code; secret é para digitar à mão no app. */
    public record SetupResponse(String otpauthUri, String secret) {}

    /** recoveryCodes só vem preenchido no primeiro acesso (guardar fora do celular). */
    public record LoginResponse(AuthResponseDTO session, List<String> recoveryCodes) {}
}
