package com.kinetic.controllers;

import com.kinetic.dtos.BillingOverviewDTO;
import com.kinetic.dtos.SubscribeRequestDTO;
import com.kinetic.services.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Assinatura do personal no Kinetic ("Meu plano"). */
@RestController
@RequestMapping("/api/trainer/billing")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PERSONAL')")
@Tag(
        name = "Assinatura do personal",
        description = "Plano do personal no Kinetic: teste grátis, escolha e troca de plano, cancelamento."
)
public class TrainerBillingController extends BaseController {

    private final BillingService billingService;

    @Operation(
            summary = "Ver meu plano",
            description = "Situação da assinatura (teste, pendente, ativa…), alunos ativos contra o limite do plano "
                    + "e o catálogo de planos. Na primeira chamada inicia o teste grátis."
    )
    @GetMapping
    public ResponseEntity<BillingOverviewDTO> overview() {
        return ResponseEntity.ok(billingService.overview(currentUserEmail()));
    }

    @Operation(
            summary = "Assinar ou trocar de plano",
            description = "Sem assinatura paga: cria a assinatura e devolve o checkoutUrl da 1ª cobrança (o plano "
                    + "vale depois do pagamento). Com assinatura paga: troca o plano na hora. 400 = plano inválido, "
                    + "indisponível ou menor que a carteira atual."
    )
    @PostMapping("/subscribe")
    public ResponseEntity<BillingOverviewDTO> subscribe(@Valid @RequestBody SubscribeRequestDTO dto) {
        return ResponseEntity.ok(billingService.subscribe(currentUserEmail(), dto.getPlan()));
    }

    @Operation(
            summary = "Cancelar a assinatura",
            description = "Para as próximas cobranças. O plano continua valendo até o fim do período já pago."
    )
    @PostMapping("/cancel")
    public ResponseEntity<BillingOverviewDTO> cancel() {
        return ResponseEntity.ok(billingService.cancel(currentUserEmail()));
    }

    @Operation(
            summary = "Simular pagamento (modo demo)",
            description = "Só existe com billing.gateway=demo: confirma a cobrança em aberto sem cobrar nada. "
                    + "404 no modo Asaas."
    )
    @PostMapping("/demo/confirm-payment")
    public ResponseEntity<BillingOverviewDTO> confirmDemoPayment() {
        return ResponseEntity.ok(billingService.confirmDemoPayment(currentUserEmail()));
    }

    @Operation(
            summary = "Comprar pacote extra de IA",
            description = "Cria a cobrança avulsa e devolve aiPackCheckoutUrl; os créditos entram quando o pagamento "
                    + "confirma, não expiram e só são usados depois da cota do plano. Com um pacote já aguardando "
                    + "pagamento, devolve o mesmo checkout."
    )
    @PostMapping("/ai-pack")
    public ResponseEntity<BillingOverviewDTO> buyAiPack() {
        return ResponseEntity.ok(billingService.buyAiPack(currentUserEmail()));
    }

    @Operation(
            summary = "Escolher os alunos ativos no plano Grátis",
            description = "Com a carteira acima do limite do Grátis, define quem continua editável; os demais ficam "
                    + "congelados (só leitura) até o personal assinar. Livre no prazo de escolha; depois, uma troca a "
                    + "cada 30 dias. 400 = mais alunos que o limite ou troca antes do prazo."
    )
    @PutMapping("/active-students")
    public ResponseEntity<BillingOverviewDTO> chooseActiveStudents(@RequestBody List<UUID> studentIds) {
        return ResponseEntity.ok(billingService.chooseActiveStudents(currentUserEmail(), studentIds));
    }

    @Operation(
            summary = "Simular pagamento do pacote de IA (modo demo)",
            description = "Só existe com billing.gateway=demo. 404 no modo Asaas."
    )
    @PostMapping("/demo/confirm-ai-pack")
    public ResponseEntity<BillingOverviewDTO> confirmDemoAiPack() {
        return ResponseEntity.ok(billingService.confirmDemoAiPack(currentUserEmail()));
    }
}
