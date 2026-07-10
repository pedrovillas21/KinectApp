package com.kinetic.controllers;

import com.kinetic.dtos.AuthResponseDTO;
import com.kinetic.dtos.LoginDTO;
import com.kinetic.dtos.RefreshResponseDTO;
import com.kinetic.dtos.RefreshTokenDTO;
import com.kinetic.dtos.RegisterDTO;
import com.kinetic.dtos.ResetPasswordDTO;
import com.kinetic.dtos.VerifyEmailDTO;
import com.kinetic.services.AuthService;
import com.kinetic.services.CompanyService;
import com.kinetic.services.InvalidRefreshTokenException;
import com.kinetic.dtos.CompanyDTO;
import com.kinetic.dtos.CreateCompanyRequestDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    @Operation(
            summary = "Criar uma conta nova",
            description = "Recebe os dados de cadastro (nome, e-mail, senha etc.) e cria o usuário no banco. "
                    + "Não faz login automaticamente: depois de registrar, chame /api/auth/login para obter o token."
    )
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO dto) {
        authService.register(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body("Usuário registrado com sucesso.");
    }

    @Operation(
            summary = "Cadastrar uma empresa (cria a empresa e o usuário dono)",
            description = "Endpoint público para auto-cadastro de empresas no painel."
    )
    @PostMapping("/register-company")
    public ResponseEntity<CompanyDTO> registerCompany(@Valid @RequestBody CreateCompanyRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.createCompany(dto));
    }

    @Operation(
            summary = "Entrar com e-mail e senha",
            description = "Confere e-mail e senha no banco e, se estiverem corretos, devolve um accessToken (JWT). "
                    + "O refreshToken também vem no corpo (para o app mobile) e, para o painel web, é gravado como "
                    + "cookie HttpOnly. Use o accessToken no cabeçalho \"Authorization: Bearer <token>\" em todas "
                    + "as demais chamadas da API."
    )
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginDTO dto, HttpServletResponse response) {
        AuthResponseDTO authResponse = authService.login(dto);
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
            HttpServletResponse response) {
        String rawToken = resolveRefreshToken(dto, cookieToken);
        if (rawToken == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Refresh token é obrigatório.");
        }

        try {
            RefreshResponseDTO refreshResponse = authService.refresh(rawToken);
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
            summary = "Checar se um e-mail já existe",
            description = "Consulta no banco se já existe uma conta com esse e-mail. Útil na tela de cadastro para "
                    + "avisar o usuário antes de ele preencher o formulário inteiro."
    )
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailDTO dto) {
        boolean exists = authService.checkEmailExists(dto.getEmail());
        if (exists) {
            return ResponseEntity.ok("E-mail encontrado.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("E-mail não encontrado.");
        }
    }

    @Operation(
            summary = "Redefinir a senha",
            description = "Grava uma nova senha (já com hash) para o usuário no banco. Normalmente é chamado depois "
                    + "de um fluxo de \"esqueci minha senha\" que comprovou a identidade do usuário fora deste endpoint."
    )
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        authService.resetPassword(dto);
        return ResponseEntity.ok("Senha redefinida com sucesso.");
    }
}
