package com.kinetic.services;

import com.kinetic.dtos.FeedbackDTO;
import com.kinetic.enums.TrainerLinkSource;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.Feedback;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.FeedbackRepository;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Feedback aluno→empresa. A regra de negócio crítica vive no gate de
 * elegibilidade: um feedback só é válido/visível quando o vínculo ATIVO do
 * aluno com o personal é source=COMPANY da mesma empresa (cenário corporativo).
 * Vínculos particulares (source=INVITE) não geram feedback.
 */
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final UserRepository userRepository;

    /**
     * Predicado central: o aluno tem vínculo ATIVO com este personal, esse
     * vínculo é corporativo (source=COMPANY) e pertence à empresa informada.
     */
    @Transactional(readOnly = true)
    public boolean isEligible(UUID studentId, UUID personalId, UUID companyId) {
        TrainerClient active = trainerClientRepository
                .findByStudentIdAndStatus(studentId, TrainerLinkStatus.ATIVO)
                .orElse(null);
        return active != null
                && active.getSource() == TrainerLinkSource.COMPANY
                && companyId.equals(active.getCompanyId())
                && active.getTrainer().getId().equals(personalId);
    }

    /**
     * Escrita aluno→empresa (modelada para uma frente mobile posterior). Deriva
     * empresa/personal do vínculo corporativo ATIVO do aluno e aplica o gate.
     */
    @Transactional
    public FeedbackDTO createFromStudent(String studentEmail, String content, boolean anonymous) {
        User student = userRepository.getByEmailOrThrow(studentEmail);
        TrainerClient active = trainerClientRepository
                .findByStudentIdAndStatus(student.getId(), TrainerLinkStatus.ATIVO)
                .orElseThrow(() -> new EntityNotFoundException("Você não possui personal ativo."));

        if (active.getSource() != TrainerLinkSource.COMPANY || active.getCompanyId() == null) {
            throw new IllegalArgumentException(
                    "Feedback disponível apenas para vínculos corporativos (via empresa).");
        }

        Feedback feedback = new Feedback();
        feedback.setStudent(student);
        feedback.setPersonal(active.getTrainer());
        feedback.setCompanyId(active.getCompanyId());
        feedback.setContent(content);
        feedback.setAnonymous(anonymous);

        return toDto(feedbackRepository.save(feedback));
    }

    /** Feedbacks recebidos por uma empresa (respeita anônimo/nominal). */
    @Transactional(readOnly = true)
    public List<FeedbackDTO> listForCompany(UUID companyId) {
        return feedbackRepository.findByCompanyFetch(companyId).stream()
                .map(this::toDto)
                .toList();
    }

    private FeedbackDTO toDto(Feedback f) {
        return new FeedbackDTO(
                f.getId(),
                f.getContent(),
                f.isAnonymous(),
                f.getCreatedAt(),
                f.isAnonymous() ? null : f.getStudent().getNome(),
                f.getPersonal().getNome(),
                true
        );
    }
}
