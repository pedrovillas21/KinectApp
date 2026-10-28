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
    private final AccessService accessService;
    private final TotpService totpService;

    // ── Empresas ────────────────────────────────────────────────────────────

    /**
     * Cria a rede de empresas e o acesso do dono (papel DONO). Só o ROOT chama: não existe
     * mais cadastro público de empresa. A senha é gerada e vai por e-mail depois do commit;
     * o dono nasce confirmado e no primeiro login cadastra o app autenticador.
     */
    @Transactional
    public CompanyDTO createCompany(CreateCompanyRequestDTO dto) {
        if (userRepository.existsByEmail(dto.ownerEmail())) {
            throw new EmailAlreadyInUseException("Já existe um usuário com este e-mail.");
        }
        String cleanCnpj = requireValidCnpj(dto.companyCnpj(), null);
        if (companyRepository.existsBySlugAndParentIdIsNull(dto.slug())) {
            throw new EmailAlreadyInUseException("Este apelido de rede já está em uso.");
        }

        Company company = new Company();
        company.setNome(dto.companyName().trim());
        company.setCnpj(cleanCnpj);
        company.setSlug(dto.slug());
        company.setResponsibleName(dto.ownerName().trim());
        company.setContactEmail(dto.ownerEmail().trim());
        company = companyRepository.save(company);

        User owner = new User();
        owner.setNome(dto.ownerName().trim());
        owner.setEmail(dto.ownerEmail().trim());
        owner.setRole(Role.DONO);
        owner.setStatus(UserStatus.ATIVO);
        owner.setCompanyId(company.getId());
        // E-mail informado pelo ROOT, não por cadastro público.
        owner.setEmailVerified(true);
        String password = accessService.assignNewPassword(owner);
        owner = userRepository.save(owner);

        accessService.sendAfterCommit(owner.getEmail(), owner.getNome(), "Seu acesso ao Kinetic",
                "Sua rede " + company.getNome() + " foi cadastrada no Kinetic. Com este acesso você cadastra as "
                        + "filiais e acompanha todas elas pelo painel.",
                owner.getEmail(), password);
        return toCompanyDto(company, owner);
    }

    /** CNPJ obrigatório, válido e único (ignorando a própria empresa na edição); devolve só os dígitos. */
    String requireValidCnpj(String cnpj, UUID selfId) {
        if (cnpj == null || cnpj.isBlank()) {
            throw new IllegalArgumentException("O CNPJ é obrigatório.");
        }
        if (!DocumentValidator.isValidCNPJ(cnpj)) {
            throw new IllegalArgumentException("CNPJ informado é inválido.");
        }
        String clean = cnpj.replaceAll("\\D", "");
        boolean taken = selfId == null ? companyRepository.existsByCnpj(clean)
                : companyRepository.existsByCnpjAndIdNot(clean, selfId);
        if (taken) {
            throw new EmailAlreadyInUseException("Este CNPJ já está cadastrado.");
        }
        return clean;
    }

    @Transactional(readOnly = true)
    public Page<CompanyDTO> listCompanies(Pageable pageable) {
        return companyRepository.findByParentIdIsNullOrderByCreatedAtDesc(pageable)
                .map(company -> toCompanyDto(company, findOwner(company.getId())));
    }

    /** Dono (usuário DONO) de uma rede; null se ainda não houver. */
    private User findOwner(UUID companyId) {
        return userRepository.findByCompanyIdAndRole(companyId, Role.DONO)
                .stream()
                .findFirst()
                .orElse(null);
    }

    private CompanyDTO toCompanyDto(Company company, User owner) {
        return new CompanyDTO(
                company.getId(),
                company.getNome(),
                company.getCnpj(),
                company.getSlug(),
                company.getCreatedAt(),
                companyRepository.countByParentId(company.getId()),
                owner != null ? owner.getId() : null,
                owner != null ? owner.getNome() : null,
                owner != null ? owner.getEmail() : null,
                owner != null ? owner.getStatus().name() : null
        );
    }

    // ── Acesso das contas de gestão (dono e filial) ─────────────────────────

    /** ROOT gera outra senha para um dono ou uma filial e envia por e-mail. */
    @Transactional
    public void regeneratePassword(UUID userId) {
        User user = getManagedAccount(userId);
        if (user.getRole() == Role.EMPRESA) {
            Company unit = companyRepository.findById(user.getCompanyId())
                    .orElseThrow(() -> new EntityNotFoundException("Filial não encontrada."));
            accessService.regenerate(user, unit.getContactEmail(), user.getUsername());
        } else {
            accessService.regenerate(user, user.getEmail(), user.getEmail());
        }
    }

    /** ROOT apaga o app autenticador de um dono ou filial (celular perdido). */
    @Transactional
    public void resetSecondFactor(UUID userId) {
        totpService.reset(getManagedAccount(userId));
    }

    private User getManagedAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        if (user.getRole() != Role.DONO && user.getRole() != Role.EMPRESA) {
            throw new IllegalArgumentException("Só contas de dono ou de filial têm acesso gerenciado pelo ROOT.");
        }
        return user;
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
        String phone = DocumentValidator.normalizeCellPhone(dto.phone());
        if (phone == null) {
            throw new IllegalArgumentException("Celular inválido. Informe DDD + número, ex.: (11) 98765-4321.");
        }
        userRepository.ensurePhoneAvailable(phone, null);

        User personal = new User();
        personal.setNome(dto.nome());
        personal.setEmail(dto.email());
        personal.setSenha(passwordEncoder.encode(dto.senha()));
        personal.setPhone(phone);
        personal.setRole(Role.PERSONAL);
        personal.setStatus(UserStatus.ATIVO);
        personal.setCompanyId(dto.companyId());

        return UserAdminDTO.fromEntity(userRepository.saveCheckingPhone(personal));
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
        LocalDateTime start = LocalDateTime.now().minusDays(periodDays(period));

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

    /** Tamanho em dias da janela de um id de período do painel ("week"/"month"/"q"/"year"). */
    static int periodDays(String period) {
        return switch (period == null ? "month" : period) {
            case "week" -> 7;
            case "q" -> 90;
            case "year" -> 365;
            default -> 30;
        };
    }
}
