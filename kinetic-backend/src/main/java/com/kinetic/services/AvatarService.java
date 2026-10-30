package com.kinetic.services;

import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Foto de perfil: fica no bucket público de avatares e a URL pública em users.avatar_url.
 * Sem @Transactional: o upload (HTTP) não segura conexão do banco, e cada save é curto.
 */
@Service
@RequiredArgsConstructor
public class AvatarService {

    private final UserRepository userRepository;
    private final StorageService storageService;

    /** Troca a foto e devolve a URL nova. A antiga só é apagada depois que a nova está salva. */
    public String updateAvatar(String email, MultipartFile file) {
        User user = userRepository.getByEmailOrThrow(email);
        String previous = user.getAvatarUrl();
        String uploaded = storageService.uploadAvatar(file, user.getId());
        try {
            user.setAvatarUrl(uploaded);
            userRepository.save(user);
        } catch (RuntimeException e) {
            // Banco falhou: a foto nova não tem dono, sai do Storage (best-effort).
            storageService.deleteAvatar(uploaded);
            throw e;
        }
        storageService.deleteAvatar(previous);
        return uploaded;
    }

    /** Volta para as iniciais do nome. */
    public void removeAvatar(String email) {
        User user = userRepository.getByEmailOrThrow(email);
        String previous = user.getAvatarUrl();
        if (previous == null) return;
        user.setAvatarUrl(null);
        userRepository.save(user);
        storageService.deleteAvatar(previous);
    }
}
