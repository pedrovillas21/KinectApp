package com.kinetic.services;

import com.kinetic.dtos.InviteCodePreviewDTO;
import com.kinetic.dtos.TrainerInviteCodeDTO;
import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.enums.Role;
import com.kinetic.enums.TrainerLinkSource;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.enums.UserStatus;
import com.kinetic.exceptions.ActiveTrainerConflictException;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.TrainerInviteCode;
import com.kinetic.models.User;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.TrainerInviteCodeRepository;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Convite por link: o personal gera um código de uso único, manda o link (ex.:
 * pelo WhatsApp) e o aluno — com conta nova ou antiga — resgata o código no app.
 * O resgate cria o vínculo já ATIVO: digitar o código é o aceite do aluno.
 *
 * <p>O código tem 10 símbolos de um alfabeto de 31 (sem 0/O/1/I/L, que se
 * confundem ao digitar), ~50 bits de entropia: inviável de adivinhar mesmo
 * sem limite de tentativas. No banco fica só o SHA-256.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TrainerInviteCodeService {

    private static final Logger log = LoggerFactory.getLogger(TrainerInviteCodeService.class);

    static final Duration CODE_TTL = Duration.ofDays(7);
    static final int CODE_LENGTH = 10;
    /** Teto de convites abertos por personal, contra geração em massa. */
    static final int MAX_ACTIVE_CODES = 50;

    private static final char[] ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".toCharArray();
    private static final String INVALID_CODE = "Código de convite inválido ou expirado. Peça um novo link ao seu personal.";

    private final TrainerInviteCodeRepository codeRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final UserRepository userRepository;
    private final TrainerLinkService trainerLinkService;
    private final BillingService billingService;

    private final SecureRandom secureRandom = new SecureRandom();

    // ── Lado do PERSONAL ────────────────────────────────────────────────────

    @Transactional
    public TrainerInviteCodeDTO create(String trainerEmail, String label) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        billingService.assertCanAddStudent(trainer, false);
        Instant now = Instant.now();
        if (codeRepository.countActiveByTrainer(trainer.getId(), now) >= MAX_ACTIVE_CODES) {
            throw new IllegalArgumentException("Você já tem " + MAX_ACTIVE_CODES
                    + " convites em aberto. Cancele os que não vai usar antes de gerar outro.");
        }

        TrainerInviteCode invite = new TrainerInviteCode();
        invite.setTrainer(trainer);
        invite.setLabel(normalizeLabel(label));
        invite.setCreatedAt(now);
        String code = assignFreshCode(invite, now);
        return toDto(codeRepository.save(invite), code, now);
    }

    @Transactional(readOnly = true)
    public List<TrainerInviteCodeDTO> listOpen(String trainerEmail) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        Instant now = Instant.now();
        return codeRepository.findOpenByTrainer(trainer.getId()).stream()
                .map(invite -> toDto(invite, null, now))
                .toList();
    }

    /** Troca o código por um novo (o link antigo para de funcionar) e renova a validade. */
    @Transactional
    public TrainerInviteCodeDTO regenerate(String trainerEmail, @NonNull UUID inviteId) {
        TrainerInviteCode invite = getOwnedOpenInvite(trainerEmail, inviteId);
        Instant now = Instant.now();
        String code = assignFreshCode(invite, now);
        return toDto(codeRepository.save(invite), code, now);
    }

    @Transactional
    public void revoke(String trainerEmail, @NonNull UUID inviteId) {
        codeRepository.delete(getOwnedOpenInvite(trainerEmail, inviteId));
    }

    // ── Página pública do link ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InviteCodePreviewDTO preview(String rawCode) {
        TrainerInviteCode invite = findUsable(rawCode);
        User trainer = invite.getTrainer();
        return new InviteCodePreviewDTO(trainer.getNome(), trainer.getAvatarUrl(), invite.getExpiresAt());
    }

    // ── Lado do ALUNO ───────────────────────────────────────────────────────

    @Transactional
    public TrainerLinkDTO redeem(String studentEmail, String rawCode) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        if (student.getRole() != Role.ALUNO) {
            throw new IllegalArgumentException("Só contas de aluno podem usar um código de convite.");
        }

        TrainerInviteCode invite = findUsable(rawCode);
        User trainer = invite.getTrainer();

        trainerClientRepository.findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)
                .ifPresent(active -> {
                    throw new ActiveTrainerConflictException(active.getTrainer().getId().equals(trainer.getId())
                            ? "Você já é aluno deste personal."
                            : "Você já possui um personal ativo.");
                });
        // Antes de consumir o código: com o plano cheio, o link continua valendo para depois.
        billingService.assertCanAddStudent(trainer, true);

        Instant now = Instant.now();
        if (codeRepository.markRedeemed(invite.getId(), student.getId(), now) == 0) {
            // Outro resgate (ou o vencimento) chegou primeiro.
            throw new EntityNotFoundException(INVALID_CODE);
        }

        // Se o mesmo personal já tinha convidado por e-mail, aproveita o vínculo
        // PENDENTE em vez de criar outro (e deixar um convite órfão no app).
        TrainerClient link = trainerClientRepository
                .findByTrainerIdAndStudentIdAndStatus(trainer.getId(), student.getId(), TrainerLinkStatus.PENDENTE)
                .orElseGet(() -> {
                    TrainerClient fresh = new TrainerClient();
                    fresh.setTrainer(trainer);
                    fresh.setStudent(student);
                    fresh.setSource(TrainerLinkSource.INVITE_CODE);
                    return fresh;
                });
        link.setStatus(TrainerLinkStatus.ATIVO);
        link.setRespondedAt(LocalDateTime.now());

        try {
            return trainerLinkService.toDto(trainerClientRepository.saveAndFlush(link), trainer);
        } catch (DataIntegrityViolationException e) {
            // Corrida com outro aceite: o índice único parcial deixou passar só um.
            // A exceção desfaz a transação inteira, inclusive o consumo do código.
            throw new ActiveTrainerConflictException("Você já possui um personal ativo.");
        }
    }

    /** Remove diariamente às 04:45 convites vencidos há mais de 30 dias e nunca usados. */
    @Scheduled(cron = "0 45 4 * * *")
    @Transactional
    public void purgeStaleCodes() {
        int deleted = codeRepository.deleteExpiredBefore(Instant.now().minus(Duration.ofDays(30)));
        if (deleted > 0) {
            log.info("TrainerInviteCodeService: {} convite(s) vencido(s) removido(s).", deleted);
        }
    }

    // ── Internos ────────────────────────────────────────────────────────────

    /** Convite existente, não resgatado, não vencido e de um personal ainda ativo. */
    private TrainerInviteCode findUsable(String rawCode) {
        String normalized = normalizeCode(rawCode);
        if (normalized.length() != CODE_LENGTH) {
            throw new EntityNotFoundException(INVALID_CODE);
        }
        TrainerInviteCode invite = codeRepository.findByCodeHashFetchTrainer(sha256(normalized))
                .orElseThrow(() -> new EntityNotFoundException(INVALID_CODE));
        User trainer = invite.getTrainer();
        if (invite.getRedeemedAt() != null
                || !invite.getExpiresAt().isAfter(Instant.now())
                || trainer.getRole() != Role.PERSONAL
                || trainer.getStatus() != UserStatus.ATIVO) {
            throw new EntityNotFoundException(INVALID_CODE);
        }
        return invite;
    }

    private TrainerInviteCode getOwnedOpenInvite(String trainerEmail, @NonNull UUID inviteId) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        TrainerInviteCode invite = codeRepository.findById(inviteId)
                .orElseThrow(() -> new EntityNotFoundException("Convite não encontrado."));
        if (!invite.getTrainer().getId().equals(trainer.getId())) {
            // 404 (e não 403) para não revelar convites de outro personal.
            throw new EntityNotFoundException("Convite não encontrado.");
        }
        if (invite.getRedeemedAt() != null) {
            throw new IllegalArgumentException("Este convite já foi usado pelo aluno.");
        }
        return invite;
    }

    /** Gera um código novo, grava o hash e a validade no convite e devolve o código em claro. */
    private String assignFreshCode(TrainerInviteCode invite, Instant now) {
        char[] chars = new char[CODE_LENGTH];
        for (int i = 0; i < CODE_LENGTH; i++) {
            chars[i] = ALPHABET[secureRandom.nextInt(ALPHABET.length)];
        }
        String code = new String(chars);
        invite.setCodeHash(sha256(code));
        invite.setExpiresAt(now.plus(CODE_TTL));
        return code;
    }

    /** Aceita o código como o aluno digitar: minúsculas, hífen, espaços. */
    static String normalizeCode(String raw) {
        if (raw == null) return "";
        return raw.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
    }

    private static String normalizeLabel(String label) {
        if (label == null) return null;
        String trimmed = label.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível na JVM", e);
        }
    }

    private static TrainerInviteCodeDTO toDto(TrainerInviteCode invite, String code, Instant now) {
        return new TrainerInviteCodeDTO(
                invite.getId(),
                code,
                invite.getLabel(),
                invite.getExpiresAt(),
                invite.getCreatedAt(),
                !invite.getExpiresAt().isAfter(now));
    }
}
