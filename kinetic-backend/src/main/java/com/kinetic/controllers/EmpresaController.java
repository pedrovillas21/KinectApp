package com.kinetic.controllers;

import com.kinetic.dtos.EmpresaAnalyticsDTO;
import com.kinetic.dtos.EmpresaStudentLinkDTO;
import com.kinetic.dtos.FeedbackDTO;
import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.dtos.UserAdminDTO;
import com.kinetic.dtos.VincularAlunoRequestDTO;
import com.kinetic.dtos.VincularFuncionarioRequestDTO;
import com.kinetic.services.EmpresaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints da EMPRESA (papel garantido via @PreAuthorize), sempre escopados
 * pela company_id do usuário logado (resolvida no EmpresaService).
 */
@RestController
@RequestMapping("/api/empresa")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EMPRESA')")
@Tag(
        name = "Empresa (academia/estúdio)",
        description = "Só para o papel EMPRESA: gerir funcionários e clientes, ver analytics e feedbacks."
)
public class EmpresaController extends BaseController {

    private final EmpresaService empresaService;

    // ── Funcionários (personais) ──────────────────────────────────────────────

    @Operation(summary = "Listar funcionários (personais) da empresa")
    @GetMapping("/personais")
    public ResponseEntity<List<UserAdminDTO>> personais() {
        return ResponseEntity.ok(empresaService.listFuncionarios(currentUserEmail()));
    }

    @Operation(summary = "Vincular um personal já cadastrado à empresa")
    @PostMapping("/personais")
    public ResponseEntity<UserAdminDTO> vincularPersonal(@Valid @RequestBody VincularFuncionarioRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(empresaService.vincularFuncionario(currentUserEmail(), dto.email()));
    }

    @Operation(summary = "Desvincular um personal da empresa")
    @DeleteMapping("/personais/{personalId}")
    public ResponseEntity<Void> desvincularPersonal(@PathVariable UUID personalId) {
        empresaService.desvincularFuncionario(currentUserEmail(), personalId);
        return ResponseEntity.noContent().build();
    }

    // ── Clientes (alunos) ─────────────────────────────────────────────────────

    @Operation(summary = "Listar clientes (alunos com vínculo corporativo ATIVO)")
    @GetMapping("/alunos")
    public ResponseEntity<List<EmpresaStudentLinkDTO>> alunos() {
        return ResponseEntity.ok(empresaService.listClientes(currentUserEmail()));
    }

    @Operation(summary = "Vincular um aluno a um personal da empresa (vínculo source=COMPANY)")
    @PostMapping("/alunos")
    public ResponseEntity<TrainerLinkDTO> vincularAluno(@Valid @RequestBody VincularAlunoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(empresaService.vincularAluno(currentUserEmail(), dto.studentEmail(), dto.trainerEmail()));
    }

    @Operation(summary = "Desvincular (encerrar) um vínculo corporativo de aluno")
    @DeleteMapping("/alunos/{linkId}")
    public ResponseEntity<Void> desvincularAluno(@PathVariable UUID linkId) {
        empresaService.desvincularAluno(currentUserEmail(), linkId);
        return ResponseEntity.noContent().build();
    }

    // ── Feedbacks & Analytics ─────────────────────────────────────────────────

    @Operation(summary = "Feedbacks recebidos (só vínculos corporativos geram feedback)")
    @GetMapping("/feedbacks")
    public ResponseEntity<List<FeedbackDTO>> feedbacks() {
        return ResponseEntity.ok(empresaService.listFeedbacks(currentUserEmail()));
    }

    @Operation(summary = "Analytics da unidade: retenção, volume e desempenho por instrutor")
    @GetMapping("/analytics")
    public ResponseEntity<EmpresaAnalyticsDTO> analytics(
            @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(empresaService.getAnalytics(currentUserEmail(), period));
    }
}
