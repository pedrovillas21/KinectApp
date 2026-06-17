package com.kinetic.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

/**
 * Sobe um arquivo de imagem para o Supabase Storage usando a service_role key
 * (que nunca sai do servidor) e devolve a URL pública. Reusa a autenticação JWT
 * existente do app; o segredo do Storage fica restrito ao backend.
 */
@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    /** Limite de tamanho do arquivo (alinhado ao multipart em application.properties). */
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10 MB

    private final RestClient restClient;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.storage.bucket}")
    private String bucket;

    public StorageService() {
        this.restClient = RestClient.builder().build();
    }

    /**
     * Sobe {@code file} para {@code {bucket}/{folder}/{uuid}.{ext}} e retorna a
     * URL pública. Lança {@link IllegalArgumentException} (→ 400) para arquivos
     * inválidos e {@link RuntimeException} (→ 500) em falha do Storage.
     */
    public String upload(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo de mídia vazio ou ausente.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Tipo de arquivo inválido: apenas imagens são aceitas.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Arquivo excede o limite de 10MB.");
        }

        String safeFolder = (folder == null || folder.isBlank()) ? "posts" : folder.trim();
        String key = safeFolder + "/" + UUID.randomUUID() + "." + extensionFor(contentType);

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Falha ao ler os bytes do arquivo.", e);
        }

        try {
            restClient.post()
                    .uri(supabaseUrl + "/storage/v1/object/" + bucket + "/" + key)
                    .header("apikey", serviceRoleKey)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("x-upsert", "true")
                    .header("Content-Type", contentType)
                    .body(bytes)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.error("Falha no upload ao Supabase Storage ({}): {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Falha ao subir a imagem para o Storage.", e);
        }

        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + key;
    }

    private static String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            default -> "jpg"; // image/jpeg e demais
        };
    }
}
