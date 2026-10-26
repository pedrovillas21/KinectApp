package com.kinetic.dtos;

import java.time.LocalDate;
import java.util.UUID;

public record AuthResponseDTO(
        String token,
        String refreshToken,
        UUID id,
        String nome,
        String email,
        /** DDD + número; null em contas antigas — os clientes pedem o cadastro antes de liberar o uso. */
        String phone,
        String level,
        LocalDate birthDate,
        Double weight,
        Double height,
        String goal,
        Integer frequency,
        String medicalConditions,
        String role,
        /** false: aceite dos Termos/Política pendente (conta criada por terceiros ou versão nova). */
        boolean termsAccepted
) {
}
