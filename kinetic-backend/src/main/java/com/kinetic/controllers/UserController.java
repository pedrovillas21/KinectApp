package com.kinetic.controllers;

import com.kinetic.utils.AppTime;

import com.kinetic.dtos.AccountExportDTO;
import com.kinetic.dtos.ChangePasswordDTO;
import com.kinetic.dtos.DeleteAccountRequestDTO;
import com.kinetic.dtos.UpdatePhoneRequestDTO;
import com.kinetic.dtos.UpdateWeightRequestDTO;
import com.kinetic.dtos.UserProfileResponseDTO;
import com.kinetic.services.AccountDeletionService;
import com.kinetic.services.DataExportService;
import com.kinetic.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@Tag(
        name = "Usuário",
        description = "Dados de perfil, senha, celular e peso do usuário logado (dados pessoais, não de treino)."
)
public class UserController extends BaseController {

    private final UserService userService;
    private final DataExportService dataExportService;
    private final AccountDeletionService accountDeletionService;

    public UserController(UserService userService,
                          DataExportService dataExportService,
                          AccountDeletionService accountDeletionService) {
        this.userService = userService;
        this.dataExportService = dataExportService;
        this.accountDeletionService = accountDeletionService;
    }

    @Operation(
            summary = "Ver os dados de perfil do usuário logado",
            description = "Busca no banco os dados cadastrais do usuário (nome, e-mail, dados físicos etc.) a "
                    + "partir do token enviado — não é preciso informar nenhum ID."
    )
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String userEmail = currentUserEmail();
        try {
            UserProfileResponseDTO profile = userService.getUserProfile(userEmail);
            return ResponseEntity.ok(profile);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Trocar a senha",
            description = "Confere a senha atual informada e, se estiver correta, grava a nova senha (com hash) no "
                    + "banco. Exige a senha atual por segurança, mesmo com o usuário já logado."
    )
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordDTO request) {
        String userEmail = currentUserEmail();
        try {
            userService.changePassword(userEmail, request);
            return ResponseEntity.ok("Senha alterada com sucesso.");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Atualizar o peso atual do usuário",
            description = "Salva um novo registro de peso corporal para o usuário logado, usado depois nos "
                    + "gráficos de evolução."
    )
    @PostMapping("/weight")
    public ResponseEntity<?> updateWeight(@Valid @RequestBody UpdateWeightRequestDTO request) {
        String userEmail = currentUserEmail();

        try {
            userService.updateUserWeight(userEmail, request);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Cadastrar ou trocar o celular do usuário logado",
            description = "Aceita o celular com ou sem máscara e +55; grava só DDD + número. É o número usado "
                    + "no atalho de WhatsApp entre aluno e personal (só exposto com vínculo ativo)."
    )
    @PutMapping("/phone")
    public ResponseEntity<?> updatePhone(@Valid @RequestBody UpdatePhoneRequestDTO request) {
        String userEmail = currentUserEmail();
        try {
            return ResponseEntity.ok(Map.of("phone", userService.updatePhone(userEmail, request)));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Exportar todos os meus dados (LGPD)",
            description = "Devolve em JSON tudo o que o Kinetic guarda sobre o usuário logado: perfil, peso, "
                    + "fichas, sessões e séries, avaliações, posts/comentários/curtidas/amizades e, para personal "
                    + "e aluno, vínculos, cobranças, assinatura, convites e feedbacks. Sem hashes de senha ou tokens."
    )
    @GetMapping("/me/export")
    public ResponseEntity<AccountExportDTO> exportMyData() {
        AccountExportDTO export = dataExportService.export(currentUserEmail());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"kinetic-dados-" + AppTime.today() + ".json\"")
                .body(export);
    }

    @Operation(
            summary = "Excluir a própria conta (imediato, irreversível)",
            description = "Confere a senha e apaga na hora a conta e todos os dados dela. Vínculos com personal "
                    + "ou alunos são encerrados e as fichas que o personal montou continuam com os alunos, sem "
                    + "autor. Das gerações de treino por IA fica só o registro (sem pedido nem resposta). "
                    + "Senha errada → 400 e nada é apagado."
    )
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyAccount(@Valid @RequestBody DeleteAccountRequestDTO request) {
        accountDeletionService.deleteAccount(currentUserEmail(), request.password());
        return ResponseEntity.noContent().build();
    }
}
