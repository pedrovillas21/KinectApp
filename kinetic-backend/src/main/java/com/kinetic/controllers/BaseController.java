package com.kinetic.controllers;

import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Base para controllers autenticados: centraliza a extração do e-mail do
 * usuário logado a partir do SecurityContext. Evita repetir a mesma chamada
 * (e o mesmo risco de divergência de segurança) em cada endpoint.
 */
public abstract class BaseController {

    /** E-mail do usuário autenticado na requisição corrente. */
    protected String currentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
