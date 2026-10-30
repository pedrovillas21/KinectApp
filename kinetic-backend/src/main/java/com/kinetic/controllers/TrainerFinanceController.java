package com.kinetic.controllers;

import com.kinetic.dtos.FinanceOverviewDTO;
import com.kinetic.dtos.FinanceRequestDTOs.PaymentRequest;
import com.kinetic.dtos.FinanceRequestDTOs.SettingsRequest;
import com.kinetic.dtos.FinanceRequestDTOs.StudentPlanRequest;
import com.kinetic.services.StudentFinanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.UUID;

/** Financeiro do personal: mensalidades dos alunos e cobranças. */
@RestController
@RequestMapping("/api/trainer/finance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PERSONAL')")
@Tag(
        name = "Financeiro do personal",
        description = "Mensalidade de cada aluno, cobranças do mês, baixa de pagamento e atrasos. O dinheiro não "
                + "passa pelo Kinetic: o personal recebe por fora e registra aqui."
)
public class TrainerFinanceController extends BaseController {

    private final StudentFinanceService financeService;

    @Operation(
            summary = "Ver o financeiro do mês",
            description = "Totais (previsto, recebido, em aberto, atrasado), cobranças do mês + atrasadas de meses "
                    + "anteriores, mensalidades ativas e alunos sem mensalidade. month = AAAA-MM (padrão: mês atual)."
    )
    @GetMapping
    public ResponseEntity<FinanceOverviewDTO> overview(@RequestParam(required = false) String month) {
        YearMonth ym;
        try {
            ym = month == null || month.isBlank() ? YearMonth.now() : YearMonth.parse(month);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Mês inválido. Use o formato AAAA-MM.");
        }
        return ResponseEntity.ok(financeService.overview(currentUserEmail(), ym));
    }

    @Operation(summary = "Salvar a chave Pix", description = "Vai na mensagem de lembrete de cobrança.")
    @PutMapping("/settings")
    public ResponseEntity<Void> settings(@Valid @RequestBody SettingsRequest dto) {
        financeService.updatePixKey(currentUserEmail(), dto.pixKey());
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Definir a mensalidade do aluno",
            description = "Cria, reativa ou altera valor/dia de vencimento. Alterar ajusta as cobranças em aberto "
                    + "a partir do mês atual. Exige vínculo ATIVO (404 sem posse)."
    )
    @PutMapping("/students/{studentId}/plan")
    public ResponseEntity<Void> setPlan(@PathVariable @NonNull UUID studentId,
                                        @Valid @RequestBody StudentPlanRequest dto) {
        financeService.setPlan(currentUserEmail(), studentId, dto.amountCents(), dto.dueDay());
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Encerrar a mensalidade do aluno",
            description = "Cancela as cobranças que ainda não venceram; as atrasadas continuam devidas."
    )
    @DeleteMapping("/students/{studentId}/plan")
    public ResponseEntity<Void> removePlan(@PathVariable @NonNull UUID studentId) {
        financeService.removePlan(currentUserEmail(), studentId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Registrar pagamento", description = "Forma: PIX, DINHEIRO, CARTAO, TRANSFERENCIA ou OUTRO.")
    @PostMapping("/charges/{chargeId}/pay")
    public ResponseEntity<Void> pay(@PathVariable @NonNull UUID chargeId, @Valid @RequestBody PaymentRequest dto) {
        financeService.markPaid(currentUserEmail(), chargeId, dto.method(), dto.paidAt());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Dispensar a cobrança do mês", description = "Ex.: aluno viajou ou mês de cortesia.")
    @PostMapping("/charges/{chargeId}/waive")
    public ResponseEntity<Void> waive(@PathVariable @NonNull UUID chargeId) {
        financeService.waive(currentUserEmail(), chargeId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Reabrir a cobrança", description = "Desfaz o pagamento registrado ou a dispensa.")
    @PostMapping("/charges/{chargeId}/reopen")
    public ResponseEntity<Void> reopen(@PathVariable @NonNull UUID chargeId) {
        financeService.reopen(currentUserEmail(), chargeId);
        return ResponseEntity.noContent().build();
    }
}
