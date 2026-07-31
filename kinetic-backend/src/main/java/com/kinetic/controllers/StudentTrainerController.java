package com.kinetic.controllers;

import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.services.TrainerLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Lado do ALUNO no vínculo: convites recebidos e "quem é meu personal". */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ALUNO')")
@Tag(
        name = "Vínculo com personal (aluno)",
        description = "Endpoints só para usuários com o papel ALUNO: ver e responder convites de personal trainers."
)
public class StudentTrainerController extends BaseController {

    private final TrainerLinkService trainerLinkService;

    @Operation(
            summary = "Listar convites de personal recebidos",
            description = "Retorna os convites de vínculo que personais enviaram para o aluno logado e ainda não "
                    + "foram respondidos."
    )
    @GetMapping("/invites")
    public ResponseEntity<List<TrainerLinkDTO>> invites() {
        return ResponseEntity.ok(trainerLinkService.listPendingInvites(currentUserEmail()));
    }

    @Operation(
            summary = "Aceitar um convite de personal",
            description = "Confirma o vínculo entre o aluno logado e o personal que enviou o convite identificado "
                    + "pelo \"id\" na URL."
    )
    @PostMapping("/invites/{id}/accept")
    public ResponseEntity<TrainerLinkDTO> accept(@PathVariable @NonNull UUID id) {
        return ResponseEntity.ok(trainerLinkService.accept(currentUserEmail(), id));
    }

    @Operation(
            summary = "Recusar um convite de personal",
            description = "Descarta o convite identificado pelo \"id\" na URL, sem criar vínculo nenhum."
    )
    @PostMapping("/invites/{id}/decline")
    public ResponseEntity<Void> decline(@PathVariable @NonNull UUID id) {
        trainerLinkService.decline(currentUserEmail(), id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Ver quem é o meu personal",
            description = "Retorna os dados do personal atualmente vinculado ao aluno logado (se houver)."
    )
    @GetMapping("/trainer")
    public ResponseEntity<TrainerLinkDTO> myTrainer() {
        return ResponseEntity.ok(trainerLinkService.getMyTrainer(currentUserEmail()));
    }
}
