package com.kinetic.controllers;

import com.kinetic.dtos.AuditDTOs;
import com.kinetic.enums.AuditAction;
import com.kinetic.enums.AuditCategory;
import com.kinetic.services.AuditQueryService;
import com.kinetic.services.DataSubjectRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/** Auditoria do painel ROOT: trilha de eventos, registros de acesso, LGPD e fichas por IA. */
@RestController
@RequestMapping("/api/root/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ROOT')")
@Tag(name = "ROOT – Auditoria", description = "Trilha de auditoria (só leitura) e pedidos de titulares.")
public class AuditController extends BaseController {

    private static final int MAX_PAGE_SIZE = 50;

    private final AuditQueryService auditQueryService;
    private final DataSubjectRequestService dataSubjectRequestService;

    @Operation(summary = "Eventos da trilha (paginado, mais recentes primeiro)",
            description = "Nomes resolvidos na leitura; conta que não existe mais vem com deleted=true. "
                    + "O IP só aparece na categoria SECURITY.")
    @GetMapping("/events")
    public ResponseEntity<Page<AuditDTOs.Event>> events(
            @RequestParam(required = false) AuditCategory category,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) UUID targetId,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        AuditQueryService.EventFilter filter =
                new AuditQueryService.EventFilter(category, action, actorId, targetId, companyId, from, to);
        return ResponseEntity.ok(auditQueryService.events(filter, pageOf(page, size)));
    }

    @Operation(summary = "Registros de acesso de uma conta (Marco Civil art. 15)",
            description = "E-mail no corpo, nunca na URL. O motivo é obrigatório e a própria consulta vira evento. "
                    + "Conta excluída é achada pelo pseudônimo do e-mail.")
    @PostMapping("/access-logs/search")
    public ResponseEntity<AuditDTOs.AccessLogResult> searchAccessLogs(@Valid @RequestBody AuditDTOs.AccessLogSearch body) {
        return ResponseEntity.ok(auditQueryService.searchAccessLogs(body));
    }

    @Operation(summary = "Resumo LGPD: exclusões, termos, última limpeza e pedidos de titulares")
    @GetMapping("/lgpd")
    public ResponseEntity<AuditDTOs.Lgpd> lgpd(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditQueryService.lgpd(from, to, pageOf(page, size)));
    }

    @Operation(summary = "Pedidos de titulares (abertos primeiro, pelo prazo)")
    @GetMapping("/requests")
    public ResponseEntity<Page<AuditDTOs.DataRequest>> listRequests(
            @RequestParam(required = false) AuditDTOs.DataRequestStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(dataSubjectRequestService.list(status, pageOf(page, size)));
    }

    @Operation(summary = "Registrar um pedido de titular", description = "Prazo de resposta: 15 dias (LGPD art. 19, II).")
    @PostMapping("/requests")
    public ResponseEntity<AuditDTOs.DataRequest> openRequest(@Valid @RequestBody AuditDTOs.DataRequestCreate body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dataSubjectRequestService.open(currentUserEmail(), body));
    }

    @Operation(summary = "Concluir um pedido de titular")
    @PatchMapping("/requests/{id}")
    public ResponseEntity<AuditDTOs.DataRequest> completeRequest(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) AuditDTOs.DataRequestComplete body) {
        return ResponseEntity.ok(dataSubjectRequestService.complete(id, body));
    }

    @Operation(summary = "Fichas aprovadas por IA (sem prompt nem resposta da IA)")
    @GetMapping("/ai")
    public ResponseEntity<AuditDTOs.Ai> ai(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditQueryService.ai(from, to, pageOf(page, size)));
    }

    @Operation(summary = "Gateway de pagamento ativo (para alertar DEMO em produção)")
    @GetMapping("/billing-gateway")
    public ResponseEntity<AuditDTOs.BillingGateway> billingGateway() {
        return ResponseEntity.ok(auditQueryService.billingGateway());
    }

    private static PageRequest pageOf(int page, int size) {
        return PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), MAX_PAGE_SIZE));
    }
}
