package com.kinetic.dtos;

import com.kinetic.dtos.TrainerLinkDTO.PeerDTO;

import java.time.LocalDateTime;
import java.util.UUID;

/** Vínculo corporativo visto pela empresa: aluno + o personal responsável. */
public record EmpresaStudentLinkDTO(
        UUID linkId,
        PeerDTO student,
        PeerDTO trainer,
        LocalDateTime createdAt
) {
}
