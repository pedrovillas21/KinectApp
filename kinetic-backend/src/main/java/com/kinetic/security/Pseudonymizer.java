package com.kinetic.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Pseudônimo estável de um e-mail ou CPF (HMAC-SHA256 com chave só do servidor), para
 * os registros que sobrevivem à exclusão da conta. Um SHA-256 puro não serviria: e-mails
 * e CPFs são adivinháveis e o hash seria revertido por tentativa. Com a chave, só o
 * próprio backend refaz a conta e encontra o registro (ex.: numa ordem judicial).
 *
 * Trocar a chave quebra a ligação com o que já foi gravado: guarde-a junto dos
 * segredos de produção e nunca a regenere.
 */
@Component
public class Pseudonymizer {

    private final SecretKeySpec key;

    public Pseudonymizer(@Value("${legal.pseudonym-key}") String key) {
        if (key == null || key.length() < 32) {
            throw new IllegalStateException("PSEUDONYM_KEY ausente ou curta (mínimo 32 caracteres). "
                    + "Gere com: openssl rand -base64 48");
        }
        this.key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    /** E-mail sem diferença de maiúsculas/espaços; CPF só com dígitos. Nulo/vazio → nulo. */
    public String email(String email) {
        return email == null || email.isBlank() ? null : hash(email.trim().toLowerCase(Locale.ROOT));
    }

    public String cpf(String cpf) {
        String digits = cpf == null ? "" : cpf.replaceAll("\\D", "");
        return digits.isEmpty() ? null : hash(digits);
    }

    private String hash(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(key);
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC-SHA256 indisponível", e);
        }
    }
}
