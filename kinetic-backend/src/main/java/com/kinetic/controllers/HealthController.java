package com.kinetic.controllers;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * O balanceador só manda tráfego para a cópia que responde aqui, e o deploy espera
 * a cópia nova responder antes de atualizar a outra. O Tomcat só abre a porta depois
 * que a aplicação terminou de subir (Flyway incluso), então responder já basta.
 */
@Hidden
@RestController
public class HealthController {

    @GetMapping("/health")
    public String health() {
        return "ok";
    }
}
