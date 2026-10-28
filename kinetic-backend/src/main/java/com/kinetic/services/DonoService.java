package com.kinetic.services;

import com.kinetic.utils.Strings;
import com.kinetic.dtos.EmpresaAnalyticsDTO;
import com.kinetic.dtos.EmpresaStudentLinkDTO;
import com.kinetic.dtos.FeedbackDTO;
import com.kinetic.dtos.UnitDTOs;
import com.kinetic.dtos.UserAdminDTO;
import com.kinetic.enums.Role;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.enums.UserStatus;
import com.kinetic.exceptions.EmailAlreadyInUseException;
import com.kinetic.models.Company;
import com.kinetic.models.User;
import com.kinetic.repositories.CompanyRepository;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Casos de uso do DONO de uma rede: cadastra as filiais (cada uma com CNPJ próprio e
 * um responsável), gera o acesso delas e acompanha todas. O dia a dia (personais e
 * alunos) fica com cada filial, que entra por usuário rede.filial.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class DonoService {

    /** Domínio interno das contas de filial: o e-mail delas nunca recebe mensagem. */
    static final String UNIT_EMAIL_DOMAIN = "@filial.kinetic.invalid";

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final CompanyService companyService;
    private final AccessService accessService;
    private final EmpresaService empresaService;
    private final FeedbackService feedbackService;
    private final TotpService totpService;
    private final RefreshTokenService refreshTokenService;

    @Transactional(readOnly = true)
    public UnitDTOs.Network getNetwork(String donoEmail) {
        Company network = network(donoEmail);
        return new UnitDTOs.Network(network.getId(), network.getNome(), network.getCnpj(), network.getSlug());
    }

    @Transactional(readOnly = true)
    public List<UnitDTOs.Response> listUnits(String donoEmail) {
        Company network = network(donoEmail);
        return companyRepository.findByParentIdOrderByNomeAsc(network.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Cria a filial e a conta dela; a senha gerada vai ao e-mail do responsável. */
    @Transactional
    public UnitDTOs.Response createUnit(String donoEmail, UnitDTOs.Request dto) {
        Company network = network(donoEmail);
        if (dto.usuario() == null || dto.usuario().isBlank()) {
            throw new IllegalArgumentException("Escolha o usuário da filial.");
        }
        String suffix = dto.usuario().trim();
        if (companyRepository.existsByParentIdAndSlug(network.getId(), suffix)) {
            throw new EmailAlreadyInUseException("Já existe uma filial com este usuário na rede.");
        }
        String username = network.getSlug() + "." + suffix;
        if (userRepository.existsByUsername(username)) {
            throw new EmailAlreadyInUseException("Este usuário já está em uso.");
        }

        Company unit = new Company();
        unit.setParentId(network.getId());
        unit.setSlug(suffix);
        apply(unit, dto);
        unit = companyRepository.save(unit);

        User account = new User();
        account.setNome(unit.getNome());
        account.setUsername(username);
        account.setEmail(username + UNIT_EMAIL_DOMAIN);
        account.setRole(Role.EMPRESA);
        account.setStatus(UserStatus.ATIVO);
        account.setCompanyId(unit.getId());
        // Conta criada pelo dono, que responde por ela; o segundo fator protege o acesso.
        account.setEmailVerified(true);
        String password = accessService.assignNewPassword(account);
        userRepository.save(account);

        accessService.sendAfterCommit(unit.getContactEmail(), unit.getResponsibleName(),
                "Acesso da filial " + unit.getNome() + " no Kinetic",
                "A filial " + unit.getNome() + " da rede " + network.getNome() + " foi cadastrada no Kinetic e você "
                        + "é o responsável por ela. Use o acesso abaixo no painel.",
                username, password);
        return toResponse(unit);
    }

    @Transactional
    public UnitDTOs.Response updateUnit(String donoEmail, UUID unitId, UnitDTOs.Request dto) {
        Company unit = ownedUnit(donoEmail, unitId);
        apply(unit, dto);
        Company saved = companyRepository.save(unit);
        account(saved).ifPresent(a -> {
            a.setNome(saved.getNome());
            userRepository.save(a);
        });
        return toResponse(saved);
    }

    /** Suspende ou reativa a filial: a conta dela deixa de entrar e as sessões caem. */
    @Transactional
    public UnitDTOs.Response setUnitActive(String donoEmail, UUID unitId, boolean active) {
        Company unit = ownedUnit(donoEmail, unitId);
        unit.setActive(active);
        companyRepository.save(unit);
        User account = requireAccount(unit);
        account.setStatus(active ? UserStatus.ATIVO : UserStatus.SUSPENSO);
        userRepository.save(account);
        if (!active) {
            refreshTokenService.revokeAllForUser(account);
        }
        return toResponse(unit);
    }

    @Transactional
    public void regenerateUnitPassword(String donoEmail, UUID unitId) {
        Company unit = ownedUnit(donoEmail, unitId);
        accessService.regenerate(requireAccount(unit), unit.getContactEmail(), requireAccount(unit).getUsername());
    }

    @Transactional
    public void resetUnitSecondFactor(String donoEmail, UUID unitId) {
        totpService.reset(requireAccount(ownedUnit(donoEmail, unitId)));
    }

    // ── Acompanhamento (somente leitura) ────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserAdminDTO> unitFuncionarios(String donoEmail, UUID unitId) {
        return empresaService.listFuncionariosOf(ownedUnit(donoEmail, unitId).getId());
    }

    @Transactional(readOnly = true)
    public List<EmpresaStudentLinkDTO> unitClientes(String donoEmail, UUID unitId) {
        return empresaService.listClientesOf(ownedUnit(donoEmail, unitId).getId());
    }

    @Transactional(readOnly = true)
    public List<FeedbackDTO> unitFeedbacks(String donoEmail, UUID unitId) {
        return feedbackService.listForCompany(ownedUnit(donoEmail, unitId).getId());
    }

    @Transactional(readOnly = true)
    public EmpresaAnalyticsDTO unitAnalytics(String donoEmail, UUID unitId, String period) {
        return empresaService.getAnalyticsOf(List.of(ownedUnit(donoEmail, unitId).getId()), period);
    }

    /** Soma das filiais da rede, numa consulta só (retenção = ativos / vinculados de todas). */
    @Transactional(readOnly = true)
    public EmpresaAnalyticsDTO networkAnalytics(String donoEmail, String period) {
        Company network = network(donoEmail);
        List<UUID> unitIds = companyRepository.findByParentIdOrderByNomeAsc(network.getId()).stream()
                .map(Company::getId)
                .toList();
        return empresaService.getAnalyticsOf(unitIds, period);
    }

    // ── Internos ────────────────────────────────────────────────────────────

    private Company network(String donoEmail) {
        User dono = userRepository.getByEmailOrThrow(donoEmail);
        if (dono.getCompanyId() == null) {
            throw new IllegalArgumentException("Sua conta não está vinculada a nenhuma rede.");
        }
        return companyRepository.findById(dono.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Rede não encontrada."));
    }

    /** Filial da rede do dono logado; 404 para filial de outra rede (não revela que existe). */
    private Company ownedUnit(String donoEmail, UUID unitId) {
        Company network = network(donoEmail);
        return companyRepository.findByIdAndParentId(unitId, network.getId())
                .orElseThrow(() -> new EntityNotFoundException("Filial não encontrada."));
    }

    private java.util.Optional<User> account(Company unit) {
        return userRepository.findByCompanyIdAndRole(unit.getId(), Role.EMPRESA).stream().findFirst();
    }

    private User requireAccount(Company unit) {
        return account(unit).orElseThrow(() -> new EntityNotFoundException("Conta da filial não encontrada."));
    }

    private void apply(Company unit, UnitDTOs.Request dto) {
        unit.setNome(dto.nome().trim());
        unit.setCnpj(companyService.requireValidCnpj(dto.cnpj(), unit.getId()));
        unit.setAddress(Strings.trimOrNull(dto.address()));
        unit.setPhone(Strings.trimOrNull(dto.phone()));
        unit.setResponsibleName(dto.responsibleName().trim());
        unit.setContactEmail(dto.responsibleEmail().trim());
    }

    private UnitDTOs.Response toResponse(Company unit) {
        User account = account(unit).orElse(null);
        long personais = userRepository.countByCompanyIdInAndRole(List.of(unit.getId()), Role.PERSONAL);
        long alunos = trainerClientRepository.countByCompanyIdInAndStatus(List.of(unit.getId()), TrainerLinkStatus.ATIVO);
        return new UnitDTOs.Response(unit.getId(), unit.getNome(), unit.getCnpj(), unit.getAddress(), unit.getPhone(),
                unit.getResponsibleName(), unit.getContactEmail(),
                account != null ? account.getUsername() : null,
                account != null ? account.getId() : null,
                unit.isActive(),
                account != null && account.getTotpEnabledAt() != null,
                personais, alunos, unit.getCreatedAt());
    }
}
