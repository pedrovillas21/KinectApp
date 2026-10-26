package com.kinetic.controllers;

import com.kinetic.dtos.TrainerCompanyDTO;
import com.kinetic.services.EmpresaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Empresa do PERSONAL logado: aceitar/recusar o convite de uma empresa e sair dela. */
@RestController
@RequestMapping("/api/trainer/company")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PERSONAL')")
@Tag(
        name = "Empresa do personal",
        description = "O personal só vira funcionário de uma empresa depois de aceitar o convite dela, e pode "
                + "sair quando quiser. Ao sair, os alunos que a empresa atribuiu a ele são desvinculados."
)
public class TrainerCompanyController extends BaseController {

    private final EmpresaService empresaService;

    @Operation(summary = "Ver a empresa atual e o convite pendente",
            description = "current = empresa da qual o personal é funcionário; pending = convite aguardando aceite. "
                    + "Cada um pode ser nulo.")
    @GetMapping
    public ResponseEntity<TrainerCompanyDTO> get() {
        return ResponseEntity.ok(empresaService.getTrainerCompany(currentUserEmail()));
    }

    @Operation(summary = "Aceitar o convite da empresa",
            description = "404 sem convite pendente; 409 se o personal já for de outra empresa.")
    @PostMapping("/accept")
    public ResponseEntity<TrainerCompanyDTO> accept() {
        return ResponseEntity.ok(empresaService.acceptCompanyInvite(currentUserEmail()));
    }

    @Operation(summary = "Recusar o convite da empresa")
    @PostMapping("/decline")
    public ResponseEntity<Void> decline() {
        empresaService.declineCompanyInvite(currentUserEmail());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Sair da empresa",
            description = "Volta à cobrança individual e encerra os vínculos com alunos atribuídos pela empresa.")
    @DeleteMapping
    public ResponseEntity<Void> leave() {
        empresaService.leaveCompanyByTrainer(currentUserEmail());
        return ResponseEntity.noContent().build();
    }
}
