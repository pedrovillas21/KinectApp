package com.kinetic.dtos;

import lombok.Data;

/**
 * Corpo opcional em /refresh e /logout: o app mobile (SecureStore) manda o
 * refreshToken aqui; o painel web manda o cookie HttpOnly e este corpo pode
 * vir vazio. O AuthController valida manualmente qual dos dois veio.
 */
@Data
public class RefreshTokenDTO {
    private String refreshToken;
}
