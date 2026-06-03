package com.kinetic.controllers;

import com.kinetic.dtos.UpdateWeightRequestDTO;
import com.kinetic.dtos.UserProfileResponseDTO;
import com.kinetic.services.UserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            UserProfileResponseDTO profile = userService.getUserProfile(userEmail);
            return ResponseEntity.ok(profile);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/weight")
    public ResponseEntity<?> updateWeight(@Valid @RequestBody UpdateWeightRequestDTO request) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();

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
