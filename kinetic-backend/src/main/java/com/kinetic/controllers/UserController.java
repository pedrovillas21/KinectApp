package com.kinetic.controllers;

import com.kinetic.utils.AppTime;

import com.kinetic.dtos.AccountExportDTO;
import com.kinetic.dtos.ChangePasswordDTO;
import com.kinetic.dtos.DeleteAccountRequestDTO;
import com.kinetic.dtos.UpdatePhoneRequestDTO;
import com.kinetic.dtos.UpdateWeightRequestDTO;
import com.kinetic.dtos.UserProfileResponseDTO;
import com.kinetic.services.AccountDeletionService;
import com.kinetic.services.AvatarService;
import com.kinetic.services.DataExportService;
import com.kinetic.services.TermsService;
import com.kinetic.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(
        name = "Usuário",
        description = "Dados de perfil, senha, celular e peso do usuário logado (dados pessoais, não de treino)."
)
public class UserController extends BaseController {

    private final UserService userService;
    private final DataExportService dataExportService;
    private final AccountDeletionService accountDeletionService;
    private final AvatarService avatarService;
    private final TermsService termsService;

    @Operation(
            summary = "Ver os dados de perfil do usuário logado",
            description = "Busca no banco os dados cadastrais do usuário (nome, e-mail, dados físicos etc.) a "
                    + "partir do token enviado — não é preciso informar nenhum ID."
    )
    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponseDTO> getProfile() {
        return ResponseEntity.ok(userService.getUserProfile(currentUserEmail()));
    }

    @Operation(
            summary = "Trocar a senha",
            description = "Confere a senha atual informada e, se estiver correta, grava a nova senha (com hash) no "
                    + "banco. Exige a senha atual por segurança, mesmo com o usuário já logado."
    )
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordDTO request) {
        userService.changePassword(currentUserEmail(), request);
        return ResponseEntity.ok("Senha alterada com sucesso.");
    }

    @Operation(
            summary = "Atualizar o peso atual do usuário",
            description = "Salva um novo registro de peso corporal para o usuário logado, usado depois nos "
                    + "gráficos de evolução."
    )
    @PostMapping("/weight")
    public ResponseEntity<Void> updateWeight(@Valid @RequestBody UpdateWeightRequestDTO request) {
        userService.updateUserWeight(currentUserEmail(), request);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Cadastrar ou trocar o celular do usuário logado",
            description = "Aceita o celular com ou sem máscara e +55; grava só DDD + número. É o número usado "
                    + "no atalho de WhatsApp entre aluno e personal (só exposto com vínculo ativo)."
    )
    @PutMapping("/phone")
    public ResponseEntity<Map<String, String>> updatePhone(@Valid @RequestBody UpdatePhoneRequestDTO request) {
        return ResponseEntity.ok(Map.of("phone", userService.updatePhone(currentUserEmail(), request)));
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
            summary = "Aceitar a versão vigente dos Termos de Uso e da Política de Privacidade",
            description = "Grava a versão e a data do aceite. Os clientes chamam quando /users/profile ou o login "
                    + "devolvem termsAccepted=false (conta criada por terceiros ou termos atualizados)."
    )
    @PostMapping("/me/terms-acceptance")
    public ResponseEntity<Void> acceptTerms() {
        termsService.accept(currentUserEmail());
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Excluir a própria conta (imediato, irreversível)",
            description = "Confere a senha e apaga na hora a conta e os dados dela. Vínculos com personal ou alunos "
                    + "são encerrados e as fichas que o personal montou continuam com os alunos, sem autor. Fica só "
                    + "o que a lei exige, com prazo para sumir (RETENCAO-DE-DADOS.md): cobranças pagas no financeiro "
                    + "do personal, a prova das fichas aprovadas por IA, os registros de acesso (6 meses) e o "
                    + "registro da conta excluída. Senha errada → 400 e nada é apagado."
    )
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyAccount(@Valid @RequestBody DeleteAccountRequestDTO request) {
        accountDeletionService.deleteAccount(currentUserEmail(), request.password());
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Trocar a foto de perfil",
            description = "Recebe a imagem (campo \"file\", formulário multipart, até 3 MB), grava como foto de perfil "
                    + "do usuário logado e devolve o endereço público dela em \"avatarUrl\". A foto anterior é "
                    + "apagada. A foto de perfil é pública (qualquer pessoa com o endereço consegue ver)."
    )
    @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> updateAvatar(@RequestPart("file") MultipartFile file) {
        String url = avatarService.updateAvatar(currentUserEmail(), file);
        return ResponseEntity.ok(Map.of("avatarUrl", url));
    }

    @Operation(
            summary = "Remover a foto de perfil",
            description = "Apaga a foto de perfil do usuário logado; o app volta a mostrar as iniciais do nome."
    )
    @DeleteMapping("/me/avatar")
    public ResponseEntity<Void> removeAvatar() {
        avatarService.removeAvatar(currentUserEmail());
        return ResponseEntity.noContent().build();
    }
}
