package com.kinetic.it;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinetic.enums.Role;
import com.kinetic.enums.UserStatus;
import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import com.kinetic.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Quando um token deixa de valer: troca de senha, suspensão, desafio do 2FA, adulteração, refresh e logout. */
class AuthTokenIT extends IntegrationTestBase {

    @Autowired
    private UserRepository users;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void tokenIssuedBeforePasswordChangeStopsWorking() throws Exception {
        User user = data.user(Role.ALUNO);
        String oldToken = data.bearer(user);

        mvc.perform(post("/api/users/change-password").header(AUTHORIZATION, oldToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword": "%s", "newPassword": "Nova-Senha-2"}""".formatted(TestData.PASSWORD)))
                .andExpect(status().isOk());

        mvc.perform(get("/api/users/profile").header(AUTHORIZATION, oldToken))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/profile").header(AUTHORIZATION, data.bearer(user)))
                .andExpect(status().isOk());
    }

    @Test
    void suspendedAccountIsBlockedEvenWithValidToken() throws Exception {
        User user = data.user(Role.ALUNO);
        String token = data.bearer(user);
        user.setStatus(UserStatus.SUSPENSO);
        users.save(user);

        mvc.perform(get("/api/users/profile").header(AUTHORIZATION, token))
                .andExpect(status().isForbidden());
    }

    @Test
    void totpChallengeTokenIsNotAnAccessToken() throws Exception {
        User user = data.user(Role.EMPRESA);
        mvc.perform(get("/api/users/profile")
                        .header(AUTHORIZATION, "Bearer " + jwtUtil.generateChallengeToken(user.getEmail())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tamperedTokenGetsFixedMessage() throws Exception {
        String token = data.bearer(data.user(Role.ALUNO));
        mvc.perform(get("/api/users/profile").header(AUTHORIZATION, token.substring(0, token.length() - 2) + "xx"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Unauthorized: token inválido."));
    }

    @Test
    void refreshTokenIsSingleUseAndLogoutRevokesIt() throws Exception {
        User user = data.user(Role.ALUNO);
        String login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "senha": "%s"}""".formatted(user.getEmail(), TestData.PASSWORD)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String first = objectMapper.readTree(login).get("refreshToken").asText();

        String refreshed = mvc.perform(refresh(first)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String second = objectMapper.readTree(refreshed).get("refreshToken").asText();
        mvc.perform(refresh(first)).andExpect(status().isUnauthorized());

        mvc.perform(post("/api/auth/logout").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\": \"%s\"}".formatted(second)))
                .andExpect(status().is2xxSuccessful());
        mvc.perform(refresh(second)).andExpect(status().isUnauthorized());
    }

    private static org.springframework.test.web.servlet.RequestBuilder refresh(String refreshToken) {
        return post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\": \"%s\"}".formatted(refreshToken));
    }
}
