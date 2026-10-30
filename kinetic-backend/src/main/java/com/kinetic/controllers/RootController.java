package com.kinetic.controllers;

import com.kinetic.dtos.CompanyDTO;
import com.kinetic.dtos.CreateCompanyRequestDTO;
import com.kinetic.dtos.CreatePersonalRequestDTO;
import com.kinetic.dtos.ReasonDTO;
import com.kinetic.dtos.RootMetricsDTO;
import com.kinetic.dtos.UpdateUserStatusRequestDTO;
import com.kinetic.dtos.UserAdminDTO;
import com.kinetic.enums.Role;
import com.kinetic.enums.UserStatus;
import com.kinetic.services.AccountDeletionService;
import com.kinetic.services.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints do ROOT (admin global): provisionamento, métricas e compliance. As ações
 * destrutivas exigem motivo no corpo (inclusive nos DELETE), gravado na trilha de auditoria.
 */
@RestController
@RequestMapping("/api/root")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ROOT')")
@Tag(
        name = "ROOT (admin global)",
        description = "Só para o papel ROOT: criar empresas/personais, ver métricas macro e aplicar compliance."
)
public class RootController extends BaseController {

    private final CompanyService companyService;
    private final AccountDeletionService accountDeletionService;

    // ── Empresas ────────────────────────────────────────────────────────────

    @Operation(summary = "Criar uma rede de empresas e o acesso do dono",
            description = "A senha do dono é gerada pelo sistema e enviada ao e-mail dele. O slug vira o prefixo "
                    + "do usuário das filiais (slug.filial). No primeiro login o dono cadastra o app autenticador.")
    @PostMapping("/companies")
    public ResponseEntity<CompanyDTO> createCompany(@Valid @RequestBody CreateCompanyRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.createCompany(dto));
    }

    @Operation(summary = "Listar empresas (paginado)")
    @GetMapping("/companies")
    public ResponseEntity<Page<CompanyDTO>> listCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(companyService.listCompanies(PageRequest.of(page, size)));
    }

    // ── Personais ─────────────────────────────────────────────────────────────

    @Operation(summary = "Provisionar um personal (opcionalmente vinculado a uma empresa)")
    @PostMapping("/personais")
    public ResponseEntity<UserAdminDTO> createPersonal(@Valid @RequestBody CreatePersonalRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.createPersonal(dto));
    }

    @Operation(summary = "Listar personais (filtro opcional por status)")
    @GetMapping("/personais")
    public ResponseEntity<List<UserAdminDTO>> listPersonais(
            @RequestParam(required = false) UserStatus status) {
        return ResponseEntity.ok(companyService.listPersonais(status));
    }

    // ── Usuários & Compliance ─────────────────────────────────────────────────

    @Operation(summary = "Listar usuários (filtros opcionais por papel e status)")
    @GetMapping("/users")
    public ResponseEntity<List<UserAdminDTO>> listUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status) {
        return ResponseEntity.ok(companyService.listUsers(role, status));
    }

    @Operation(summary = "Bloquear/suspender/reativar uma conta")
    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserAdminDTO> setUserStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequestDTO dto) {
        return ResponseEntity.ok(companyService.setUserStatus(id, dto.status(), dto.reason()));
    }

    @Operation(summary = "Gerar nova senha para um dono ou filial",
            description = "A senha nova vai ao e-mail do dono (ou ao e-mail de contato da filial); as sessões abertas "
                    + "são encerradas.")
    @PostMapping("/users/{id}/nova-senha")
    public ResponseEntity<Void> regeneratePassword(@PathVariable UUID id, @Valid @RequestBody ReasonDTO dto) {
        companyService.regeneratePassword(id, dto.reason());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Redefinir o app autenticador de um dono ou filial",
            description = "Para celular perdido: o próximo login volta ao cadastro do app. Encerra as sessões.")
    @PostMapping("/users/{id}/reset-2fa")
    public ResponseEntity<Void> resetSecondFactor(@PathVariable UUID id, @Valid @RequestBody ReasonDTO dto) {
        companyService.resetSecondFactor(id, dto.reason());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Excluir (soft-delete) uma conta")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id, @Valid @RequestBody ReasonDTO dto) {
        companyService.softDeleteUser(id, dto.reason());
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Excluir uma conta definitivamente (pedido do titular, LGPD art. 18 VI)",
            description = "Mesma exclusão que o titular faz pelo app, para quem não consegue entrar (ex.: conta "
                    + "bloqueada). Conta bloqueada fica marcada: o mesmo e-mail/CPF não cria conta nova."
    )
    @DeleteMapping("/users/{id}/permanent")
    public ResponseEntity<Void> deleteUserPermanently(@PathVariable @NonNull UUID id, @Valid @RequestBody ReasonDTO dto) {
        accountDeletionService.deleteAccountByAdmin(id, dto.reason());
        return ResponseEntity.noContent().build();
    }

    // ── Métricas ────────────────────────────────────────────────────────────

    @Operation(summary = "KPIs macro reais (contagens + crescimento no período)")
    @GetMapping("/metrics")
    public ResponseEntity<RootMetricsDTO> metrics(
            @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(companyService.getMetrics(period));
    }
}
