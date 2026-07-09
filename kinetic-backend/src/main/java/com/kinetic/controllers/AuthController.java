package com.kinetic.controllers;

import com.kinetic.dtos.AuthResponseDTO;
import com.kinetic.dtos.LoginDTO;
import com.kinetic.dtos.RefreshResponseDTO;
import com.kinetic.dtos.RefreshTokenDTO;
import com.kinetic.dtos.RegisterDTO;
import com.kinetic.dtos.ResetPasswordDTO;
import com.kinetic.dtos.VerifyEmailDTO;
import com.kinetic.services.AuthService;
import com.kinetic.services.InvalidRefreshTokenException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(
        name = "Autenticação",
        description = "Cadastro, login e gestão de sessão. Não exige token — são as portas de entrada do app."
)
public class AuthController {

    private final AuthService authService;

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
            summary = "Entrar com e-mail e senha",
            description = "Confere e-mail e senha no banco e, se estiverem corretos, devolve um accessToken (JWT) "
                    + "e um refreshToken. Use o accessToken no cabeçalho \"Authorization: Bearer <token>\" em todas "
                    + "as demais chamadas da API."
    )
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginDTO dto) {
        AuthResponseDTO response = authService.login(dto);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Renovar o token de acesso",
            description = "O accessToken expira depois de um tempo. Envie o refreshToken recebido no login para "
                    + "ganhar um accessToken novo sem pedir a senha de novo. Se o refreshToken também estiver "
                    + "vencido ou inválido, a resposta é 401 e o usuário precisa fazer login de novo."
    )
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshTokenDTO dto) {
        try {
            RefreshResponseDTO response = authService.refresh(dto.getRefreshToken());
            return ResponseEntity.ok(response);
        } catch (InvalidRefreshTokenException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Sair (invalidar o refresh token)",
            description = "Revoga o refreshToken enviado no corpo da requisição, para que não possa mais ser usado "
                    + "em /api/auth/refresh. O accessToken já emitido continua válido até expirar sozinho."
    )
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@Valid @RequestBody RefreshTokenDTO dto) {
        authService.logout(dto.getRefreshToken());
        return ResponseEntity.ok().build();
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
