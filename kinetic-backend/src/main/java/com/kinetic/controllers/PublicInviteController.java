package com.kinetic.controllers;

import com.kinetic.dtos.InviteCodePreviewDTO;
import com.kinetic.services.TrainerInviteCodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Rotas sem login usadas pela página pública do link de convite. */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(
        name = "Público",
        description = "Endpoints abertos (sem login): hoje só a prévia do link de convite do personal."
)
public class PublicInviteController {

    private final TrainerInviteCodeService trainerInviteCodeService;

    @Operation(
            summary = "Ver de quem é um link de convite",
            description = "Mostra nome e foto do personal dono do código, para a página do link. 404 quando o "
                    + "código é inválido, venceu ou já foi usado."
    )
    @GetMapping("/invite-codes/{code}")
    public ResponseEntity<InviteCodePreviewDTO> preview(@PathVariable String code) {
        return ResponseEntity.ok(trainerInviteCodeService.preview(code));
    }
}
