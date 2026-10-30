package com.kinetic.services;

import com.kinetic.enums.AuditAction;
import com.kinetic.enums.Role;
import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import com.kinetic.utils.DocumentValidator;
import com.kinetic.dtos.RegisterDTO;
import com.kinetic.dtos.LoginDTO;
import com.kinetic.dtos.AuthResponseDTO;
import com.kinetic.dtos.RefreshResponseDTO;
import com.kinetic.exceptions.EmailAlreadyInUseException;
import com.kinetic.exceptions.EmailNotVerifiedException;
import com.kinetic.exceptions.SecondFactorRequiredException;
import com.kinetic.exceptions.TooManyAttemptsException;
import com.kinetic.security.JwtUtil;
import com.kinetic.security.Pseudonymizer;
import com.kinetic.security.RateLimiter;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    static final int LOGIN_ATTEMPTS_PER_MINUTE = 5;
    static final long LOGIN_WINDOW_MS = 60_000;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final UserService userService;
    private final EmailVerificationService emailVerificationService;
    private final TermsService termsService;
    private final LegalRetentionService retentionService;
    private final RateLimiter rateLimiter;
    private final AuditService auditService;
    private final Pseudonymizer pseudonymizer;

    public User register(RegisterDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new EmailAlreadyInUseException("Email já está em uso.");
        }
        // Conta excluída enquanto bloqueada por abuso não volta com o mesmo e-mail/CPF.
        if (retentionService.isBlockedIdentity(dto.getEmail(), dto.getCpf())) {
            throw new IllegalArgumentException("Não foi possível criar a conta com estes dados. Fale com o suporte.");
        }

        String phone = DocumentValidator.normalizeCellPhone(dto.getPhone());
        if (phone == null) {
            throw new IllegalArgumentException("Celular inválido. Informe DDD + número, ex.: (11) 98765-4321.");
        }
        userRepository.ensurePhoneAvailable(phone, null);

        User user = new User();
        user.setNome(dto.getNome());
        user.setEmail(dto.getEmail());
        user.setSenha(passwordEncoder.encode(dto.getSenha()));
        user.setPhone(phone);
        // Auto-cadastro só produz ALUNO ou PERSONAL (whitelist no DTO);
        // EMPRESA e ROOT nascem por outros caminhos (ROOT: seed no boot).
        boolean isPersonal = "PERSONAL".equals(dto.getRole());
        user.setRole(isPersonal ? Role.PERSONAL : Role.ALUNO);

        if (isPersonal) {
            if (dto.getCpf() == null || dto.getCpf().isBlank()) {
                throw new IllegalArgumentException("CPF é obrigatório para personal trainers.");
            }
            if (!DocumentValidator.isValidCPF(dto.getCpf())) {
                throw new IllegalArgumentException("CPF informado é inválido.");
            }
            String cleanCpf = dto.getCpf().replaceAll("\\D", "");
            if (userRepository.existsByCpf(cleanCpf)) {
                throw new EmailAlreadyInUseException("CPF já está em uso.");
            }
            user.setCpf(cleanCpf);
        }
        termsService.markAccepted(user);

        return userRepository.saveCheckingPhone(user);
    }

    public AuthResponseDTO login(LoginDTO dto, String ip) {
        String identifier = dto.getEmail().trim().toLowerCase(Locale.ROOT);
        // Por IP + identificador: freia tentar senhas numa conta sem bloquear quem divide o IP
        // (alunos no Wi-Fi da academia). Conta antes do bcrypt, que é a parte cara.
        String key = "login:" + ip + " " + identifier;
        if (rateLimiter.acquire(key, LOGIN_ATTEMPTS_PER_MINUTE, LOGIN_WINDOW_MS) > 0) {
            recordLoginFailure(AuditAction.LOGIN_RATE_LIMITED,
                    identifier.contains("@") ? dto.getEmail().trim() : identifier, null);
            throw new TooManyAttemptsException("Muitas tentativas. Aguarde um minuto e tente novamente.");
        }

        // Filial entra pelo usuário (rede.filial); internamente a conta segue identificada
        // pelo e-mail interno dela, como todas as outras. Usuário inexistente cai no mesmo
        // "credenciais inválidas" de uma senha errada.
        String email = identifier.contains("@")
                ? dto.getEmail().trim()
                : userRepository.findByUsername(identifier).map(User::getEmail).orElse(identifier);

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, dto.getSenha()));
        } catch (AuthenticationException e) {
            recordLoginFailure(AuditAction.LOGIN_FAILED, email, e.getClass().getSimpleName());
            throw e;
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        // Só depois da senha conferir: não revela a ninguém quais contas existem.
        // Já reenvia o código (respeitando o intervalo mínimo entre envios).
        if (!user.isEmailVerified()) {
            emailVerificationService.sendCode(user);
            throw new EmailNotVerifiedException(
                    "Confirme seu e-mail para entrar. Enviamos um código para " + user.getEmail() + ".");
        }

        // Contas de gestão (dono, filial, ROOT): a senha sozinha não entra; falta o código
        // do app autenticador (TotpService).
        if (TotpService.requiresSecondFactor(user)) {
            throw new SecondFactorRequiredException(user.getTotpEnabledAt() == null,
                    jwtUtil.generateChallengeToken(user.getEmail()));
        }
        return issueSession(user, ip);
    }

    /**
     * Conta existente: ela é o alvo. Inexistente: só o pseudônimo do que foi digitado
     * (nunca o e-mail em claro), para ligar tentativas repetidas sem guardar quem tentou.
     */
    private void recordLoginFailure(AuditAction action, String identifier, String cause) {
        User target = identifier.contains("@")
                ? userRepository.findByEmail(identifier).orElse(null)
                : userRepository.findByUsername(identifier).orElse(null);
        Map<String, Object> details = new HashMap<>();
        if (target == null) {
            details.put("emailHash", pseudonymizer.email(identifier));
        }
        if (cause != null) {
            details.put("cause", cause);
        }
        auditService.record(action, target == null ? null : target.getId(),
                target == null ? null : target.getCompanyId(), null, details);
    }

    /** Abre a sessão (access + refresh) de quem já passou por todas as etapas do login. */
    public AuthResponseDTO issueSession(User user, String ip) {
        // Registro de streak é best-effort: uma falha aqui (ex.: corrida no
        // insert diário) jamais deve impedir um login com credenciais válidas.
        recordDailyLoginSafely(user);
        retentionService.recordAccess(user.getId(), ip, "LOGIN");

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        String refreshToken = refreshTokenService.createForUser(user);
        return new AuthResponseDTO(
                token,
                refreshToken,
                user.getId(),
                user.getNome(),
                user.getEmail(),
                user.getPhone(),
                user.getLevel(),
                user.getBirthDate(),
                user.getWeight(),
                user.getHeight(),
                user.getGoal(),
                user.getFrequency(),
                user.getMedicalConditions(),
                user.getRole().name(),
                termsService.isAccepted(user)
        );
    }

    public RefreshResponseDTO refresh(String rawRefreshToken, String ip) {
        RefreshTokenService.RotationResult result = refreshTokenService.rotate(rawRefreshToken);
        userRepository.findByEmail(result.userEmail()).ifPresent(user -> {
            recordDailyLoginSafely(user);
            retentionService.recordAccess(user.getId(), ip, "REFRESH");
        });
        return new RefreshResponseDTO(result.accessToken(), result.refreshToken());
    }

    // Isola o registro de streak: por ser @Transactional, qualquer falha só
    // aflora no commit (quando o método do UserService retorna). Capturamos
    // aqui para que login/refresh sigam mesmo se o registro do dia falhar.
    private void recordDailyLoginSafely(User user) {
        try {
            userService.recordDailyLogin(user);
        } catch (Exception ignored) {
            // best-effort: não bloqueia autenticação por falha no registro de login
        }
    }

    public void logout(String rawRefreshToken) {
        refreshTokenService.revoke(rawRefreshToken);
    }
}
