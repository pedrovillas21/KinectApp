package com.kinetic.it;

import com.kinetic.enums.Role;
import com.kinetic.enums.TrainerLinkSource;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.Company;
import com.kinetic.models.Exercise;
import com.kinetic.models.PhysicalAssessment;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.repositories.CompanyRepository;
import com.kinetic.repositories.PhysicalAssessmentRepository;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import com.kinetic.security.JwtUtil;
import com.kinetic.services.TermsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/** Cria dados prontos para uso. E-mails, celulares e CNPJs aleatórios: nada é limpo entre testes. */
@TestComponent
public class TestData {

    public static final String PASSWORD = "Senha-de-teste-1";

    @Autowired private UserRepository users;
    @Autowired private CompanyRepository companies;
    @Autowired private TrainerClientRepository links;
    @Autowired private WorkoutPlanRepository plans;
    @Autowired private PhysicalAssessmentRepository assessments;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TermsService termsService;

    private String passwordHash;

    /** Conta ativa, com e-mail confirmado, termos aceitos e celular (aluno e personal). */
    public User user(Role role) {
        return user(role, null);
    }

    public User user(Role role, UUID companyId) {
        if (passwordHash == null) {
            passwordHash = passwordEncoder.encode(PASSWORD);
        }
        User u = new User();
        u.setNome(role.name().toLowerCase() + " " + digits(6));
        u.setEmail(UUID.randomUUID() + "@teste.kinetic.invalid");
        u.setSenha(passwordHash);
        u.setRole(role);
        u.setEmailVerified(true);
        u.setCompanyId(companyId);
        if (role == Role.ALUNO || role == Role.PERSONAL) {
            u.setPhone("119" + digits(8));
        }
        termsService.markAccepted(u);
        return users.save(u);
    }

    /** Valor do header Authorization para a conta. */
    public String bearer(User u) {
        return "Bearer " + jwtUtil.generateToken(u.getEmail(), u.getRole());
    }

    /** Rede (parentId nulo) ou filial de uma rede. */
    public Company company(UUID parentId) {
        Company c = new Company();
        c.setNome("Empresa " + digits(6));
        c.setCnpj(digits(14));
        c.setSlug("rede" + digits(8));
        c.setParentId(parentId);
        return companies.save(c);
    }

    /** Vínculo ATIVO; com companyId é atribuído pela empresa. */
    public TrainerClient link(User trainer, User student, UUID companyId) {
        TrainerClient l = new TrainerClient();
        l.setTrainer(trainer);
        l.setStudent(student);
        l.setStatus(TrainerLinkStatus.ATIVO);
        l.setSource(companyId != null ? TrainerLinkSource.COMPANY : TrainerLinkSource.INVITE);
        l.setCompanyId(companyId);
        return links.save(l);
    }

    /** Ficha ativa do aluno com um exercício; devolve o exercício. */
    public Exercise exerciseOf(User student) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setTitle("Treino A");
        plan.setLevel("Iniciante");
        plan.setUser(student);
        Exercise e = new Exercise();
        e.setName("Supino");
        e.setWorkoutPlan(plan);
        plan.getExercises().add(e);
        return plans.save(plan).getExercises().get(0);
    }

    public PhysicalAssessment assessment(User trainer, User student) {
        PhysicalAssessment a = new PhysicalAssessment();
        a.setTrainer(trainer);
        a.setStudent(student);
        a.setAssessedOn(LocalDate.now());
        a.setWeightKg(80.0);
        return assessments.save(a);
    }

    private static String digits(int n) {
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) {
            sb.append(ThreadLocalRandom.current().nextInt(10));
        }
        return sb.toString();
    }
}
