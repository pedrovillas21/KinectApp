package com.kinetic.controllers;

import com.kinetic.dtos.InviteCodeRedeemRequestDTO;
import com.kinetic.dtos.PhysicalAssessmentDTOs;
import com.kinetic.dtos.StudentProtocolDTOs;
import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.dtos.TrainerProfileDTOs;
import com.kinetic.services.PhysicalAssessmentService;
import com.kinetic.services.StudentProtocolService;
import com.kinetic.services.TrainerInviteCodeService;
import com.kinetic.services.TrainerLinkService;
import com.kinetic.services.TrainerProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Lado do ALUNO no vínculo: convites recebidos e "quem é meu personal". */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ALUNO')")
@Tag(
        name = "Vínculo com personal (aluno)",
        description = "Endpoints só para usuários com o papel ALUNO: ver e responder convites de personal trainers."
)
public class StudentTrainerController extends BaseController {

    private final TrainerLinkService trainerLinkService;
    private final TrainerInviteCodeService trainerInviteCodeService;
    private final TrainerProfileService trainerProfileService;
    private final PhysicalAssessmentService physicalAssessmentService;
    private final StudentProtocolService studentProtocolService;

    @Operation(
            summary = "Listar convites de personal recebidos",
            description = "Retorna os convites de vínculo que personais enviaram para o aluno logado e ainda não "
                    + "foram respondidos."
    )
    @GetMapping("/invites")
    public ResponseEntity<List<TrainerLinkDTO>> invites() {
        return ResponseEntity.ok(trainerLinkService.listPendingInvites(currentUserEmail()));
    }

    @Operation(
            summary = "Aceitar um convite de personal",
            description = "Confirma o vínculo entre o aluno logado e o personal que enviou o convite identificado "
                    + "pelo \"id\" na URL."
    )
    @PostMapping("/invites/{id}/accept")
    public ResponseEntity<TrainerLinkDTO> accept(@PathVariable @NonNull UUID id) {
        return ResponseEntity.ok(trainerLinkService.accept(currentUserEmail(), id));
    }

    @Operation(
            summary = "Recusar um convite de personal",
            description = "Descarta o convite identificado pelo \"id\" na URL, sem criar vínculo nenhum."
    )
    @PostMapping("/invites/{id}/decline")
    public ResponseEntity<Void> decline(@PathVariable @NonNull UUID id) {
        trainerLinkService.decline(currentUserEmail(), id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Usar um código de convite de personal",
            description = "Resgata o código do link de convite enviado pelo personal. Digitar o código é o aceite: "
                    + "o vínculo já nasce ATIVO. 404 = código inválido, vencido ou já usado; 409 = o aluno já "
                    + "tem um personal ativo."
    )
    @PostMapping("/invite-codes/redeem")
    public ResponseEntity<TrainerLinkDTO> redeemInviteCode(@Valid @RequestBody InviteCodeRedeemRequestDTO dto) {
        return ResponseEntity.ok(trainerInviteCodeService.redeem(currentUserEmail(), dto.getCode()));
    }

    @Operation(
            summary = "Ver quem é o meu personal",
            description = "Retorna os dados do personal atualmente vinculado ao aluno logado (se houver)."
    )
    @GetMapping("/trainer")
    public ResponseEntity<TrainerLinkDTO> myTrainer() {
        return ResponseEntity.ok(trainerLinkService.getMyTrainer(currentUserEmail()));
    }

    @Operation(
            summary = "Ver o perfil profissional do meu personal",
            description = "Tela \"Seu personal\" do app: perfil público do personal vinculado (CREF, bio, "
                    + "especialidades, formação, atendimento, WhatsApp), desde quando é o personal do aluno, "
                    + "fichas vigentes que ele montou e a data da última ficha montada. 404 = sem personal ativo."
    )
    @GetMapping("/trainer/profile")
    public ResponseEntity<TrainerProfileDTOs.StudentView> myTrainerProfile() {
        return ResponseEntity.ok(trainerProfileService.getMyTrainerProfile(currentUserEmail()));
    }

    @Operation(
            summary = "Minhas avaliações físicas",
            description = "Avaliações registradas pelos personais do aluno (atual e anteriores), da mais antiga "
                    + "para a mais recente, com medidas, IMC/composição e o parecer de cada uma."
    )
    @GetMapping("/assessments")
    public ResponseEntity<List<PhysicalAssessmentDTOs.Response>> myAssessments() {
        return ResponseEntity.ok(physicalAssessmentService.listMine(currentUserEmail()));
    }

    @Operation(
            summary = "Encerrar o vínculo com o meu personal",
            description = "O aluno deixa de ser acompanhado pelo personal: o personal perde o acesso aos dados "
                    + "dele e o aluno volta a controlar as próprias fichas. O histórico de treinos não é apagado. "
                    + "Vale também para vínculo atribuído pela empresa. 404 = sem personal ativo."
    )
    @DeleteMapping("/trainer")
    public ResponseEntity<Void> endMyTrainerLink() {
        trainerLinkService.endLinkByStudent(currentUserEmail());
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Meu protocolo e anamnese",
            description = "Objetivo, nível, frequência e anamnese, com quem registrou. managedByName preenchido = "
                    + "o personal define o protocolo e o aluno só confere."
    )
    @GetMapping("/protocol")
    public ResponseEntity<StudentProtocolDTOs.Response> myProtocol() {
        return ResponseEntity.ok(studentProtocolService.getForStudent(currentUserEmail()));
    }

    @Operation(
            summary = "Confirmar que a anamnese está correta",
            description = "O aluno confere a anamnese registrada (pelo personal na consulta, por exemplo). "
                    + "400 = ainda não há anamnese."
    )
    @PostMapping("/protocol/anamnesis/confirm")
    public ResponseEntity<StudentProtocolDTOs.Response> confirmAnamnesis() {
        return ResponseEntity.ok(studentProtocolService.confirmAnamnesis(currentUserEmail()));
    }
}
