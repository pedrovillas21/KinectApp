package com.kinetic.controllers;

import com.kinetic.dtos.TrainerProfileDTOs;
import com.kinetic.services.TrainerProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Perfil profissional do PERSONAL logado (página "Meu perfil" do painel). */
@RestController
@RequestMapping("/api/trainer/profile")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PERSONAL')")
@Tag(
        name = "Perfil profissional (personal)",
        description = "O personal edita o perfil que os alunos vinculados veem no app: CREF, bio, especialidades, "
                + "formação e atendimento."
)
public class TrainerProfileController extends BaseController {

    private final TrainerProfileService trainerProfileService;

    @Operation(
            summary = "Ver o meu perfil profissional",
            description = "Retorna o perfil do personal logado. Se ele nunca salvou, vem com os textos nulos, as "
                    + "listas vazias e updatedAt nulo."
    )
    @GetMapping
    public ResponseEntity<TrainerProfileDTOs.Response> get() {
        return ResponseEntity.ok(trainerProfileService.getOwnProfile(currentUserEmail()));
    }

    @Operation(
            summary = "Salvar o meu perfil profissional",
            description = "Substitui o perfil inteiro. CREF no formato 000000-G/UF (ex.: 012345-G/SP); trocar o "
                    + "CREF zera a verificação. crefVerified é só leitura. 400 = validação (texto da mensagem)."
    )
    @PutMapping
    public ResponseEntity<TrainerProfileDTOs.Response> update(@Valid @RequestBody TrainerProfileDTOs.Request dto) {
        return ResponseEntity.ok(trainerProfileService.updateOwnProfile(currentUserEmail(), dto));
    }
}
