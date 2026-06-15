package com.kinetic.services;

import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import com.kinetic.dtos.RegisterDTO;
import com.kinetic.dtos.LoginDTO;
import com.kinetic.dtos.AuthResponseDTO;
import com.kinetic.dtos.RefreshResponseDTO;
import com.kinetic.dtos.ResetPasswordDTO;
import com.kinetic.exceptions.EmailAlreadyInUseException;
import com.kinetic.security.JwtUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final UserService userService;

    public User register(RegisterDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new EmailAlreadyInUseException("Email já está em uso.");
        }

        User user = new User();
        user.setNome(dto.getNome());
        user.setEmail(dto.getEmail());
        user.setSenha(passwordEncoder.encode(dto.getSenha()));

        return userRepository.save(user);
    }

    public AuthResponseDTO login(LoginDTO dto) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getSenha())
        );

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        // Registro de streak é best-effort: uma falha aqui (ex.: corrida no
        // insert diário) jamais deve impedir um login com credenciais válidas.
        recordDailyLoginSafely(user);

        String token = jwtUtil.generateToken(user.getEmail());
        String refreshToken = refreshTokenService.createForUser(user);
        return new AuthResponseDTO(
                token,
                refreshToken,
                user.getId(),
                user.getNome(),
                user.getEmail(),
                user.getLevel(),
                user.getBirthDate(),
                user.getWeight(),
                user.getHeight(),
                user.getGoal(),
                user.getFrequency(),
                user.getMedicalConditions()
        );
    }

    public RefreshResponseDTO refresh(String rawRefreshToken) {
        RefreshTokenService.RotationResult result = refreshTokenService.rotate(rawRefreshToken);
        userRepository.findByEmail(result.userEmail()).ifPresent(this::recordDailyLoginSafely);
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

    public boolean checkEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public void resetPassword(ResetPasswordDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        refreshTokenService.revokeAllForUser(user);
        user.setSenha(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }
}
