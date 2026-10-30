package com.kinetic.controllers;

import com.kinetic.dtos.EmpresaAnalyticsDTO;
import com.kinetic.dtos.EmpresaStudentLinkDTO;
import com.kinetic.dtos.FeedbackDTO;
import com.kinetic.dtos.UnitDTOs;
import com.kinetic.dtos.UserAdminDTO;
import com.kinetic.services.DonoService;
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

/** Dono de uma rede: cadastra e acompanha as filiais. */
@RestController
@RequestMapping("/api/dono")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DONO')")
@Tag(
        name = "Dono da rede",
        description = "O dono cadastra as filiais (CNPJ e responsável), gera o acesso delas (usuário rede.filial "
                + "e senha enviada ao responsável) e acompanha personais, alunos, feedbacks e analytics de cada uma."
)
public class DonoController extends BaseController {

    private final DonoService donoService;

    @Operation(summary = "Ver a minha rede")
    @GetMapping("/rede")
    public ResponseEntity<UnitDTOs.Network> network() {
        return ResponseEntity.ok(donoService.getNetwork(currentUserEmail()));
    }

    @Operation(summary = "Analytics somados de todas as filiais")
    @GetMapping("/analytics")
    public ResponseEntity<EmpresaAnalyticsDTO> networkAnalytics(@RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(donoService.networkAnalytics(currentUserEmail(), period));
    }

    @Operation(summary = "Listar as filiais")
    @GetMapping("/unidades")
    public ResponseEntity<List<UnitDTOs.Response>> list() {
        return ResponseEntity.ok(donoService.listUnits(currentUserEmail()));
    }

    @Operation(summary = "Cadastrar uma filial",
            description = "Cria a filial e a conta dela (usuário rede.usuario). A senha é gerada e enviada ao "
                    + "e-mail do responsável; no primeiro login a filial cadastra o app autenticador.")
    @PostMapping("/unidades")
    public ResponseEntity<UnitDTOs.Response> create(@Valid @RequestBody UnitDTOs.Request dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(donoService.createUnit(currentUserEmail(), dto));
    }

    @Operation(summary = "Editar os dados de uma filial (o usuário não muda)")
    @PutMapping("/unidades/{id}")
    public ResponseEntity<UnitDTOs.Response> update(@PathVariable UUID id, @Valid @RequestBody UnitDTOs.Request dto) {
        return ResponseEntity.ok(donoService.updateUnit(currentUserEmail(), id, dto));
    }

    @Operation(summary = "Suspender ou reativar uma filial")
    @PatchMapping("/unidades/{id}/status")
    public ResponseEntity<UnitDTOs.Response> status(@PathVariable UUID id,
                                                    @Valid @RequestBody UnitDTOs.StatusRequest dto) {
        return ResponseEntity.ok(donoService.setUnitActive(currentUserEmail(), id, dto.active()));
    }

    @Operation(summary = "Gerar nova senha para a filial",
            description = "A senha nova vai ao e-mail do responsável; as sessões abertas da filial são encerradas.")
    @PostMapping("/unidades/{id}/nova-senha")
    public ResponseEntity<Void> regeneratePassword(@PathVariable UUID id) {
        donoService.regenerateUnitPassword(currentUserEmail(), id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Redefinir o app autenticador da filial (celular perdido)")
    @PostMapping("/unidades/{id}/reset-2fa")
    public ResponseEntity<Void> resetSecondFactor(@PathVariable UUID id) {
        donoService.resetUnitSecondFactor(currentUserEmail(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/unidades/{id}/funcionarios")
    public ResponseEntity<List<UserAdminDTO>> funcionarios(@PathVariable UUID id) {
        return ResponseEntity.ok(donoService.unitFuncionarios(currentUserEmail(), id));
    }

    @GetMapping("/unidades/{id}/clientes")
    public ResponseEntity<List<EmpresaStudentLinkDTO>> clientes(@PathVariable UUID id) {
        return ResponseEntity.ok(donoService.unitClientes(currentUserEmail(), id));
    }

    @GetMapping("/unidades/{id}/feedbacks")
    public ResponseEntity<List<FeedbackDTO>> feedbacks(@PathVariable UUID id) {
        return ResponseEntity.ok(donoService.unitFeedbacks(currentUserEmail(), id));
    }

    @GetMapping("/unidades/{id}/analytics")
    public ResponseEntity<EmpresaAnalyticsDTO> analytics(@PathVariable UUID id,
                                                         @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(donoService.unitAnalytics(currentUserEmail(), id, period));
    }
}
