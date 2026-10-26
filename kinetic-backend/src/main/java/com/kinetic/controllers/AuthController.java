package com.kinetic.controllers;

import com.kinetic.dtos.AuthResponseDTO;
import com.kinetic.dtos.ConfirmEmailDTO;
import com.kinetic.dtos.ForgotPasswordDTO;
import com.kinetic.dtos.LoginDTO;
import com.kinetic.dtos.RefreshResponseDTO;
import com.kinetic.dtos.RefreshTokenDTO;
import com.kinetic.dtos.RegisterDTO;
import com.kinetic.dtos.ResetPasswordDTO;
import com.kinetic.dtos.VerifyEmailDTO;
import com.kinetic.services.AuthService;
import com.kinetic.services.CompanyService;
import com.kinetic.services.EmailVerificationService;
import com.kinetic.services.InvalidRefreshTokenException;
import com.kinetic.services.PasswordResetService;
import com.kinetic.services.LegalRetentionService;
import com.kinetic.services.TermsService;
import com.kinetic.dtos.CompanyDTO;
import com.kinetic.dtos.CreateCompanyRequestDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(
        name = "Autenticação",
        description = "Cadastro, login e gestão de sessão. Não exige token — são as portas de entrada do app."
)
public class AuthController {

    // Path restrito a /api/auth: o cookie só precisa trafegar para cá.
    private static final String REFRESH_COOKIE = "kinetic_refresh_token";

    private final AuthService authService;
    private final CompanyService companyService;
    private final PasswordResetService passwordResetService;
    private final EmailVerificationService emailVerificationService;
    private final TermsService termsService;
    private final LegalRetentionService retentionService;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    @Operation(
            summary = "Criar uma conta nova",
            description = "Recebe os dados de cadastro (nome, e-mail, senha etc.), cria o usuário no banco e envia "
                    + "um código de 6 dígitos para o e-mail. A conta só consegue fazer login depois de confirmar o "
                    + "e-mail em /api/auth/confirm-email."
    )
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO dto) {
        emailVerificationService.sendCode(authService.register(dto));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Usuário registrado. Enviamos um código de confirmação para o seu e-mail.");
    }

    @Operation(
            summary = "Cadastrar uma empresa (cria a empresa e o usuário dono)",
            description = "Endpoint público para auto-cadastro de empresas no painel. O dono recebe um código "
                    + "por e-mail e só consegue fazer login depois de confirmá-lo em /api/auth/confirm-email."
    )
    @PostMapping("/register-company")
    public ResponseEntity<?> registerCompany(@Valid @RequestBody CreateCompanyRequestDTO dto) {
        if (!Boolean.TRUE.equals(dto.termsAccepted())) {
            return ResponseEntity.badRequest().body("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.");
        }
        if (retentionService.isBlockedIdentity(dto.ownerEmail(), null)) {
            return ResponseEntity.badRequest().body("Não foi possível criar a conta com estes dados. Fale com o suporte.");
        }
        CompanyDTO company = companyService.createCompany(dto);
        termsService.accept(dto.ownerEmail());
        // Fora da transação do createCompany: o envio do e-mail é uma chamada HTTP externa.
        emailVerificationService.requestCode(dto.ownerEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(company);
    }

    @Operation(
            summary = "Confirmar o e-mail com o código recebido",
            description = "Recebe o e-mail e o código de 6 dígitos enviado no cadastro. O código vale 30 minutos e "
                    + "aceita no máximo 5 tentativas erradas. Depois de confirmar, o login é liberado."
    )
    @PostMapping("/confirm-email")
    public ResponseEntity<?> confirmEmail(@Valid @RequestBody ConfirmEmailDTO dto) {
        emailVerificationService.confirm(dto.getEmail(), dto.getCode());
        return ResponseEntity.ok("E-mail confirmado. Você já pode fazer login.");
    }

    @Operation(
            summary = "Reenviar o código de confirmação de e-mail",
            description = "Envia um novo código se a conta existir e ainda não tiver confirmado o e-mail. A resposta "
                    + "é sempre a mesma, para não revelar quem está cadastrado. Um novo envio para a mesma conta só "
                    + "sai depois de 60 segundos."
    )
    @PostMapping("/resend-confirmation")
    public ResponseEntity<?> resendConfirmation(@Valid @RequestBody VerifyEmailDTO dto) {
        emailVerificationService.requestCode(dto.getEmail());
        return ResponseEntity.ok("Se houver uma conta aguardando confirmação, enviaremos um novo código.");
    }

    @Operation(
            summary = "Entrar com e-mail e senha",
            description = "Confere e-mail e senha no banco e, se estiverem corretos, devolve um accessToken (JWT). "
                    + "O refreshToken também vem no corpo (para o app mobile) e, para o painel web, é gravado como "
                    + "cookie HttpOnly. Use o accessToken no cabeçalho \"Authorization: Bearer <token>\" em todas "
                    + "as demais chamadas da API."
    )
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginDTO dto, HttpServletRequest request,
                                                 HttpServletResponse response) {
        // getRemoteAddr já é o IP real do cliente (forward-headers-strategy=native atrás do balanceador).
        AuthResponseDTO authResponse = authService.login(dto, request.getRemoteAddr());
        response.addHeader(HttpHeaders.SET_COOKIE, buildRefreshCookie(authResponse.refreshToken()).toString());
        return ResponseEntity.ok(authResponse);
    }

    @Operation(
            summary = "Renovar o token de acesso",
            description = "O accessToken expira depois de um tempo. O app mobile envia o refreshToken no corpo; o "
                    + "painel web usa o cookie HttpOnly gravado no login/refresh anterior. Se o refreshToken também "
                    + "estiver vencido ou inválido, a resposta é 401 e o usuário precisa fazer login de novo."
    )
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @RequestBody(required = false) RefreshTokenDTO dto,
            @CookieValue(name = REFRESH_COOKIE, required = false) String cookieToken,
            HttpServletRequest request,
            HttpServletResponse response) {
        String rawToken = resolveRefreshToken(dto, cookieToken);
        if (rawToken == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Refresh token é obrigatório.");
        }

        try {
            RefreshResponseDTO refreshResponse = authService.refresh(rawToken, request.getRemoteAddr());
            response.addHeader(HttpHeaders.SET_COOKIE, buildRefreshCookie(refreshResponse.refreshToken()).toString());
            return ResponseEntity.ok(refreshResponse);
        } catch (InvalidRefreshTokenException e) {
            response.addHeader(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Sair (invalidar o refresh token)",
            description = "Revoga o refreshToken (do corpo, no mobile, ou do cookie, no painel web), para que não "
                    + "possa mais ser usado em /api/auth/refresh. O accessToken já emitido continua válido até "
                    + "expirar sozinho."
    )
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestBody(required = false) RefreshTokenDTO dto,
            @CookieValue(name = REFRESH_COOKIE, required = false) String cookieToken,
            HttpServletResponse response) {
        String rawToken = resolveRefreshToken(dto, cookieToken);
        if (rawToken != null) {
            authService.logout(rawToken);
        }
        response.addHeader(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString());
        return ResponseEntity.ok().build();
    }

    private String resolveRefreshToken(RefreshTokenDTO dto, String cookieToken) {
        if (cookieToken != null && !cookieToken.isBlank()) {
            return cookieToken;
        }
        if (dto != null && dto.getRefreshToken() != null && !dto.getRefreshToken().isBlank()) {
            return dto.getRefreshToken();
        }
        return null;
    }

    @SuppressWarnings("null")
    private ResponseCookie buildRefreshCookie(String value) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/api/auth")
                .maxAge(Duration.ofMillis(refreshExpirationMs))
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/api/auth")
                .maxAge(0)
                .build();
    }

    @Operation(
            summary = "Esqueci minha senha (envia código por e-mail)",
            description = "Se o e-mail pertencer a uma conta ativa, envia um código de 6 dígitos válido por 15 minutos. "
                    + "A resposta é sempre a mesma, exista a conta ou não, para não revelar quem está cadastrado. "
                    + "Um novo pedido para a mesma conta só gera outro código depois de 60 segundos."
    )
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
        passwordResetService.requestReset(dto.getEmail());
        return ResponseEntity.ok("Se o e-mail estiver cadastrado, enviaremos um código de verificação.");
    }

    @Operation(
            summary = "Redefinir a senha com o código recebido por e-mail",
            description = "Recebe e-mail, código de 6 dígitos (de /api/auth/forgot-password) e a nova senha. "
                    + "O código é de uso único e aceita no máximo 5 tentativas erradas. Ao trocar a senha, "
                    + "todas as sessões (refresh tokens) da conta são encerradas."
    )
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        passwordResetService.resetPassword(dto.getEmail(), dto.getCode(), dto.getNewPassword());
        return ResponseEntity.ok("Senha redefinida com sucesso.");
    }
}
