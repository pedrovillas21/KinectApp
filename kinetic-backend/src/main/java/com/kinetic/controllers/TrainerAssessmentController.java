package com.kinetic.controllers;

import com.kinetic.dtos.PhysicalAssessmentDTOs.Request;
import com.kinetic.dtos.PhysicalAssessmentDTOs.Response;
import com.kinetic.services.PhysicalAssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Avaliações físicas dos alunos (lado do personal). */
@RestController
@RequestMapping("/api/trainer/students/{studentId}/assessments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PERSONAL')")
@Tag(
        name = "Avaliação física",
        description = "Composição corporal e circunferências do aluno, base do gráfico e do relatório de evolução. "
                + "Exige vínculo ATIVO com o aluno (404 sem posse)."
)
public class TrainerAssessmentController extends BaseController {

    private final PhysicalAssessmentService assessmentService;

    @Operation(summary = "Listar avaliações do aluno", description = "Da mais antiga para a mais recente, com IMC e massas calculados.")
    @GetMapping
    public ResponseEntity<List<Response>> list(@PathVariable @NonNull UUID studentId) {
        return ResponseEntity.ok(assessmentService.list(currentUserEmail(), studentId));
    }

    @Operation(summary = "Registrar avaliação", description = "Todas as medidas são opcionais, mas ao menos uma é exigida.")
    @PostMapping
    public ResponseEntity<Response> create(@PathVariable @NonNull UUID studentId, @Valid @RequestBody Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assessmentService.create(currentUserEmail(), studentId, dto));
    }

    @Operation(summary = "Corrigir avaliação")
    @PutMapping("/{assessmentId}")
    public ResponseEntity<Response> update(@PathVariable @NonNull UUID studentId,
                                           @PathVariable @NonNull UUID assessmentId,
                                           @Valid @RequestBody Request dto) {
        return ResponseEntity.ok(assessmentService.update(currentUserEmail(), studentId, assessmentId, dto));
    }

    @Operation(summary = "Apagar avaliação")
    @DeleteMapping("/{assessmentId}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull UUID studentId, @PathVariable @NonNull UUID assessmentId) {
        assessmentService.delete(currentUserEmail(), studentId, assessmentId);
        return ResponseEntity.noContent().build();
    }
}
