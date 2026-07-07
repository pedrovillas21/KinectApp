package com.kinetic.controllers;

import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.services.TrainerLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Lado do ALUNO no vínculo: convites recebidos e "quem é meu personal". */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ALUNO')")
public class StudentTrainerController extends BaseController {

    private final TrainerLinkService trainerLinkService;

    @GetMapping("/invites")
    public ResponseEntity<List<TrainerLinkDTO>> invites() {
        return ResponseEntity.ok(trainerLinkService.listPendingInvites(currentUserEmail()));
    }

    @PostMapping("/invites/{id}/accept")
    public ResponseEntity<TrainerLinkDTO> accept(@PathVariable UUID id) {
        return ResponseEntity.ok(trainerLinkService.accept(currentUserEmail(), id));
    }

    @PostMapping("/invites/{id}/decline")
    public ResponseEntity<Void> decline(@PathVariable UUID id) {
        trainerLinkService.decline(currentUserEmail(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trainer")
    public ResponseEntity<TrainerLinkDTO> myTrainer() {
        return ResponseEntity.ok(trainerLinkService.getMyTrainer(currentUserEmail()));
    }
}
