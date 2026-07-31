package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.lang.NonNull;

import java.util.UUID;

@Data
public class SendChatMessageDTO {
    @NotNull(message = "Destinatário é obrigatório")
    private @NonNull UUID recipientId;

    @NotBlank(message = "Mensagem não pode ser vazia")
    @Size(max = 4000, message = "Mensagem excede o limite de 4000 caracteres")
    private String content;
}
