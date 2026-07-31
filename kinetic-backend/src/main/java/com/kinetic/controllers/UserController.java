package com.kinetic.controllers;

import com.kinetic.dtos.ChangePasswordDTO;
import com.kinetic.dtos.UpdateWeightRequestDTO;
import com.kinetic.dtos.UserProfileResponseDTO;
import com.kinetic.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(
        name = "Usuário",
        description = "Dados de perfil, senha e peso do usuário logado (dados pessoais, não de treino)."
)
public class UserController extends BaseController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(
            summary = "Ver os dados de perfil do usuário logado",
            description = "Busca no banco os dados cadastrais do usuário (nome, e-mail, dados físicos etc.) a "
                    + "partir do token enviado — não é preciso informar nenhum ID."
    )
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String userEmail = currentUserEmail();
        try {
            UserProfileResponseDTO profile = userService.getUserProfile(userEmail);
            return ResponseEntity.ok(profile);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Trocar a senha",
            description = "Confere a senha atual informada e, se estiver correta, grava a nova senha (com hash) no "
                    + "banco. Exige a senha atual por segurança, mesmo com o usuário já logado."
    )
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordDTO request) {
        String userEmail = currentUserEmail();
        try {
            userService.changePassword(userEmail, request);
            return ResponseEntity.ok("Senha alterada com sucesso.");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Atualizar o peso atual do usuário",
            description = "Salva um novo registro de peso corporal para o usuário logado, usado depois nos "
                    + "gráficos de evolução."
    )
    @PostMapping("/weight")
    public ResponseEntity<?> updateWeight(@Valid @RequestBody UpdateWeightRequestDTO request) {
        String userEmail = currentUserEmail();

        try {
            userService.updateUserWeight(userEmail, request);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
