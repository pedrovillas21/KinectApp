package com.kinetic.controllers;

import com.kinetic.dtos.TrainerInviteRequestDTO;
import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.services.TrainerLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Endpoints do PERSONAL (papel garantido via @PreAuthorize + claim do JWT). */
@RestController
@RequestMapping("/api/trainer")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PERSONAL')")
@Tag(
        name = "Personal trainer",
        description = "Endpoints só para usuários com o papel PERSONAL: convidar alunos e ver a carteira de alunos."
)
public class TrainerController extends BaseController {

    private final TrainerLinkService trainerLinkService;

    @Operation(
            summary = "Convidar um aluno pelo e-mail",
            description = "Cria um convite de vínculo personal-aluno no banco, para o e-mail informado. O aluno "
                    + "precisa aceitar o convite pelo app dele (ver TrainerLinkService/StudentTrainerController) "
                    + "para o vínculo passar a valer."
    )
    @PostMapping("/invites")
    public ResponseEntity<TrainerLinkDTO> invite(@Valid @RequestBody TrainerInviteRequestDTO dto) {
        TrainerLinkDTO link = trainerLinkService.invite(currentUserEmail(), dto.getStudentEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(link);
    }

    @Operation(
            summary = "Listar os alunos vinculados",
            description = "Retorna todos os alunos já vinculados ao personal logado (convites aceitos), com o "
                    + "status do vínculo."
    )
    @GetMapping("/students")
    public ResponseEntity<List<TrainerLinkDTO>> students() {
        return ResponseEntity.ok(trainerLinkService.listStudents(currentUserEmail()));
    }
}
