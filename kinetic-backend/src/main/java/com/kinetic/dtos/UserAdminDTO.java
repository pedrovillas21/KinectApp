package com.kinetic.dtos;

import com.kinetic.models.User;

import java.time.LocalDateTime;
import java.util.UUID;

/** Visão administrativa de um usuário (listas e compliance do painel ROOT). */
public record UserAdminDTO(
        UUID id,
        String nome,
        String email,
        String role,
        String status,
        UUID companyId,
        LocalDateTime createdAt
) {
    public static UserAdminDTO fromEntity(User u) {
        return new UserAdminDTO(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getRole().name(),
                u.getStatus().name(),
                u.getCompanyId(),
                u.getCreatedAt()
        );
    }
}
