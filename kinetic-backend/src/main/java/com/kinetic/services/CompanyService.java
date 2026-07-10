package com.kinetic.services;

import com.kinetic.dtos.CompanyDTO;
import com.kinetic.dtos.CreateCompanyRequestDTO;
import com.kinetic.dtos.CreatePersonalRequestDTO;
import com.kinetic.dtos.RootMetricsDTO;
import com.kinetic.dtos.UserAdminDTO;
import com.kinetic.enums.Role;
import com.kinetic.enums.UserStatus;
import com.kinetic.exceptions.EmailAlreadyInUseException;
import com.kinetic.models.Company;
import com.kinetic.models.User;
import com.kinetic.repositories.CompanyRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.utils.DocumentValidator;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Casos de uso do ROOT: provisionamento de empresas e personais, métricas
 * macro e compliance (status das contas). Reusa o encoder de senha do
 * AuthService e o RefreshTokenService para invalidar sessões ao suspender.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    // ── Empresas ────────────────────────────────────────────────────────────

    @Transactional
    public CompanyDTO createCompany(CreateCompanyRequestDTO dto) {
        if (userRepository.existsByEmail(dto.ownerEmail())) {
            throw new EmailAlreadyInUseException("Já existe um usuário com este e-mail.");
        }

        if (dto.companyCnpj() == null || dto.companyCnpj().isBlank()) {
            throw new IllegalArgumentException("O CNPJ da empresa é obrigatório.");
        }

        if (!DocumentValidator.isValidCNPJ(dto.companyCnpj())) {
            throw new IllegalArgumentException("CNPJ informado é inválido.");
        }

        String cleanCnpj = dto.companyCnpj().replaceAll("\\D", "");
        if (companyRepository.existsByCnpj(cleanCnpj)) {
            throw new EmailAlreadyInUseException("Este CNPJ já está cadastrado.");
        }

        Company company = new Company();
        company.setNome(dto.companyName());
        company.setCnpj(cleanCnpj);
        company = companyRepository.save(company);

        User owner = new User();
        owner.setNome(dto.ownerName());
        owner.setEmail(dto.ownerEmail());
        owner.setSenha(passwordEncoder.encode(dto.ownerPassword()));
        owner.setRole(Role.EMPRESA);
        owner.setStatus(UserStatus.ATIVO);
        owner.setCompanyId(company.getId());
        owner = userRepository.save(owner);

        return toCompanyDto(company, owner);
    }

    @Transactional(readOnly = true)
    public Page<CompanyDTO> listCompanies(Pageable pageable) {
        return companyRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(company -> toCompanyDto(company, findOwner(company.getId())));
    }

    /** Dono (usuário EMPRESA) de uma empresa; null se ainda não houver. */
    private User findOwner(UUID companyId) {
        return userRepository.findByCompanyIdAndRole(companyId, Role.EMPRESA)
                .stream()
                .findFirst()
                .orElse(null);
    }

    private CompanyDTO toCompanyDto(Company company, User owner) {
        return new CompanyDTO(
                company.getId(),
                company.getNome(),
                company.getCreatedAt(),
                owner != null ? owner.getId() : null,
                owner != null ? owner.getNome() : null,
                owner != null ? owner.getEmail() : null,
                owner != null ? owner.getStatus().name() : null
        );
    }

    // ── Personais ─────────────────────────────────────────────────────────────

    @Transactional
    public UserAdminDTO createPersonal(CreatePersonalRequestDTO dto) {
        if (userRepository.existsByEmail(dto.email())) {
            throw new EmailAlreadyInUseException("Já existe um usuário com este e-mail.");
        }
        if (dto.companyId() != null && !companyRepository.existsById(dto.companyId())) {
            throw new EntityNotFoundException("Empresa não encontrada.");
        }

        User personal = new User();
        personal.setNome(dto.nome());
        personal.setEmail(dto.email());
        personal.setSenha(passwordEncoder.encode(dto.senha()));
        personal.setRole(Role.PERSONAL);
        personal.setStatus(UserStatus.ATIVO);
        personal.setCompanyId(dto.companyId());

        return UserAdminDTO.fromEntity(userRepository.save(personal));
    }

    @Transactional(readOnly = true)
    public List<UserAdminDTO> listPersonais(UserStatus status) {
        List<User> users = status != null
                ? userRepository.findByRoleAndStatusOrderByCreatedAtDesc(Role.PERSONAL, status)
                : userRepository.findByRoleOrderByCreatedAtDesc(Role.PERSONAL);
        return users.stream().map(UserAdminDTO::fromEntity).toList();
    }

    // ── Usuários (listagem geral com filtros) ─────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserAdminDTO> listUsers(Role role, UserStatus status) {
        final List<User> users;
        if (role != null && status != null) {
            users = userRepository.findByRoleAndStatusOrderByCreatedAtDesc(role, status);
        } else if (role != null) {
            users = userRepository.findByRoleOrderByCreatedAtDesc(role);
        } else if (status != null) {
            users = userRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            users = userRepository.findAllByOrderByCreatedAtDesc();
        }
        return users.stream().map(UserAdminDTO::fromEntity).toList();
    }

    // ── Compliance ────────────────────────────────────────────────────────────

    @Transactional
    public UserAdminDTO setUserStatus(UUID userId, UserStatus status) {
        User user = getComplianceTarget(userId);
        user.setStatus(status);
        userRepository.save(user);
        // Suspender/bloquear derruba as sessões vivas (o access token de curta
        // duração ainda é barrado no filtro por isEnabled).
        if (status != UserStatus.ATIVO) {
            refreshTokenService.revokeAllForUser(user);
        }
        return UserAdminDTO.fromEntity(user);
    }

    /** Soft-delete: bloqueia a conta e revoga as sessões (evita cascata destrutiva de FKs). */
    @Transactional
    public void softDeleteUser(UUID userId) {
        User user = getComplianceTarget(userId);
        user.setStatus(UserStatus.BLOQUEADO);
        userRepository.save(user);
        refreshTokenService.revokeAllForUser(user);
    }

    /** Resolve o alvo de compliance, protegendo contas ROOT de alteração/exclusão. */
    private User getComplianceTarget(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        if (user.getRole() == Role.ROOT) {
            throw new IllegalArgumentException("Contas ROOT não podem ser alteradas por compliance.");
        }
        return user;
    }

    // ── Métricas ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RootMetricsDTO getMetrics(String period) {
        LocalDateTime start = periodStart(period);

        long totalCompanies = companyRepository.count();
        long totalPersonais = userRepository.countByRole(Role.PERSONAL);
        long totalAlunos = userRepository.countByRole(Role.ALUNO);
        long newUsers = userRepository.countByCreatedAtAfter(start);

        // Série de crescimento: contas novas por dia no período (agregação barata).
        Map<LocalDate, Long> byDay = new LinkedHashMap<>();
        for (User u : userRepository.findByCreatedAtGreaterThanEqualOrderByCreatedAtAsc(start)) {
            LocalDate day = u.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
            byDay.merge(day, 1L, Long::sum);
        }
        List<RootMetricsDTO.GrowthPoint> growth = byDay.entrySet().stream()
                .map(e -> new RootMetricsDTO.GrowthPoint(e.getKey().toString(), e.getValue()))
                .toList();

        return new RootMetricsDTO(totalCompanies, totalPersonais, totalAlunos, newUsers, growth);
    }

    /** Mapeia o id de período do painel ("week"/"month"/"q"/"year") no início da janela. */
    private LocalDateTime periodStart(String period) {
        LocalDateTime now = LocalDateTime.now();
        return switch (period == null ? "month" : period) {
            case "week" -> now.minusDays(7);
            case "q" -> now.minusDays(90);
            case "year" -> now.minusDays(365);
            default -> now.minusDays(30);
        };
    }
}
