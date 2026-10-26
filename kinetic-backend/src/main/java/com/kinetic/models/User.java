package com.kinetic.models;

import com.kinetic.enums.Role;
import com.kinetic.enums.UserStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.lang.NonNull;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(nullable = false)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(16) DEFAULT 'ALUNO'")
    private Role role = Role.ALUNO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(16) DEFAULT 'ATIVO'")
    private UserStatus status = UserStatus.ATIVO;

    // Só vira true quando o dono digita o código enviado ao e-mail (ou troca a
    // senha por código, que também prova a posse da caixa). Sem isso, não loga.
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(unique = true)
    private String cpf;

    /** Celular (DDD + número, só dígitos) — alimenta o atalho de WhatsApp. */
    @Column(length = 11)
    private String phone;

    /** Chave Pix do personal, usada no lembrete de cobrança enviado ao aluno. */
    @Column(name = "pix_key", length = 140)
    private String pixKey;

    @Column(nullable = true)
    private String level;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    private Double weight;

    private Double height;

    private String goal;

    private Integer frequency;

    @Column(columnDefinition = "TEXT")
    private String medicalConditions;

    /** Última mudança de objetivo, nível ou frequência, e quem fez (o aluno ou o personal). */
    @Column(name = "protocol_updated_at")
    private LocalDateTime protocolUpdatedAt;

    @Column(name = "protocol_updated_by_id")
    private UUID protocolUpdatedById;

    @Column(name = "anamnesis_updated_at")
    private LocalDateTime anamnesisUpdatedAt;

    @Column(name = "anamnesis_updated_by_id")
    private UUID anamnesisUpdatedById;

    /** Quando o aluno conferiu a anamnese no app; zera quando o personal a altera. */
    @Column(name = "anamnesis_confirmed_at")
    private LocalDateTime anamnesisConfirmedAt;

    @Column(name = "workout_onboarding_completed", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean workoutOnboardingCompleted = false;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "last_active")
    private LocalDateTime lastActive;

    @Column(name = "active_session_id")
    private UUID activeSessionId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Versão dos Termos/Política aceita (legal.terms-version) e quando; nulo = nunca aceitou. */
    @Column(name = "terms_version", length = 32)
    private String termsVersion;

    @Column(name = "terms_accepted_at")
    private Instant termsAcceptedAt;

    /** Última troca/redefinição de senha: access tokens emitidos antes deixam de valer. */
    @Column(name = "credentials_changed_at")
    private Instant credentialsChangedAt;

    /** Empresa que convidou este personal e aguarda o aceite dele. */
    @Column(name = "pending_company_id")
    private UUID pendingCompanyId;

    /** Login da filial (rede.filial); nulo nas demais contas, que entram pelo e-mail. */
    @Column(unique = true, length = 81)
    private String username;

    /** Segredo TOTP cifrado (TotpService); nulo enquanto o app autenticador não foi cadastrado. */
    @Column(name = "totp_secret")
    private String totpSecret;

    @Column(name = "totp_enabled_at")
    private Instant totpEnabledAt;

    /** Última janela TOTP aceita: o mesmo código não entra duas vezes. */
    @Column(name = "totp_last_step")
    private Long totpLastStep;

    /** E-mail é NOT NULL/unique no schema; getter explícito só para expor essa garantia ao null-analysis. */
    @SuppressWarnings("null")
    public @NonNull String getEmail() {
        return email;
    }
}
