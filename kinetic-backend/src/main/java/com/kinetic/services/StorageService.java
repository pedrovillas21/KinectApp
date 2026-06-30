package com.kinetic.services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.ClientHttpRequestFactorySettings;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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

    /** Pastas permitidas no bucket — evita path traversal a partir do {@code folder} do cliente. */
    private static final Set<String> ALLOWED_FOLDERS = Set.of("posts", "stories");

    private final RestClient restClient;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.storage.bucket}")
    private String bucket;

    public StorageService() {
        // Timeouts explícitos: sem eles o RestClient herda os defaults do client HTTP
        // subjacente, que podem esperar indefinidamente e travar a thread do servlet
        // caso o Supabase fique lento ou inacessível.
        ClientHttpRequestFactorySettings settings = ClientHttpRequestFactorySettings.defaults()
                .withConnectTimeout(Duration.ofSeconds(30))
                .withReadTimeout(Duration.ofSeconds(300));
        ClientHttpRequestFactory requestFactory = Objects.requireNonNull(
                ClientHttpRequestFactoryBuilder.detect().build(settings));
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
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
        if (!ALLOWED_FOLDERS.contains(safeFolder)) {
            throw new IllegalArgumentException("Pasta de destino inválida.");
        }
        // key = {folder}/{uuid}.{ext}: todos os componentes são controlados pelo servidor
        // (folder via whitelist, UUID e extensão de um switch fixo), então não há entrada
        // do usuário concatenada na URL do Storage.
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

    /**
     * Remove do Storage a mídia apontada por {@code publicUrl}. Usado como limpeza
     * compensatória quando o upload deu certo mas a criação do post/story falhou,
     * evitando objetos órfãos no bucket. É best-effort: falhas só são logadas.
     */
    public void delete(String publicUrl) {
        if (publicUrl == null || publicUrl.isBlank()) {
            return;
        }
        String key = keyFromPublicUrl(publicUrl);
        if (key == null) {
            return;
        }
        deleteByKey(key);
    }

    /** Remove o objeto identificado por {@code key} (ex: "posts/uuid.jpg"). Best-effort. */
    public void deleteByKey(String key) {
        try {
            restClient.delete()
                    .uri(supabaseUrl + "/storage/v1/object/" + bucket + "/" + key)
                    .header("apikey", serviceRoleKey)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.warn("Falha ao remover objeto '{}' do Storage ({}): {}",
                    key, e.getStatusCode(), e.getResponseBodyAsString());
        }
    }

    /**
     * Lista todos os objetos de {@code folder} no bucket, paginando automaticamente.
     * Restrito à whitelist {@code ALLOWED_FOLDERS}. Best-effort: erro de API retorna
     * o que foi coletado até o momento.
     */
    public List<RemoteObject> list(String folder) {
        if (!ALLOWED_FOLDERS.contains(folder)) {
            throw new IllegalArgumentException("Pasta inválida: " + folder);
        }
        List<RemoteObject> result = new ArrayList<>();
        int offset = 0;
        while (true) {
            Map<String, Object> body = Map.of(
                    "prefix", folder + "/",
                    "limit", LIST_PAGE_SIZE,
                    "offset", offset,
                    "sortBy", Map.of("column", "name", "order", "asc")
            );
            List<SupabaseListItem> page;
            try {
                page = restClient.post()
                        .uri(supabaseUrl + "/storage/v1/object/list/" + bucket)
                        .header("apikey", serviceRoleKey)
                        .header("Authorization", "Bearer " + serviceRoleKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(new ParameterizedTypeReference<>() {});
            } catch (RestClientResponseException e) {
                log.warn("Falha ao listar '{}'  (offset={}): {}", folder, offset,
                        e.getResponseBodyAsString());
                break;
            }
            if (page == null || page.isEmpty()) break;
            for (SupabaseListItem item : page) {
                if (item.createdAt() == null) continue;
                result.add(new RemoteObject(folder + "/" + item.name(), item.createdAt()));
            }
            if (page.size() < LIST_PAGE_SIZE) break;
            offset += LIST_PAGE_SIZE;
        }
        return result;
    }

    /** Extrai a storage key a partir de uma URL pública deste bucket. Retorna null se não pertencer. */
    String keyFromPublicUrl(String publicUrl) {
        if (publicUrl == null || publicUrl.isBlank()) return null;
        String marker = "/storage/v1/object/public/" + bucket + "/";
        int idx = publicUrl.indexOf(marker);
        if (idx < 0) return null;
        return publicUrl.substring(idx + marker.length());
    }

    /** Objeto listado no bucket com sua key completa e data de criação. */
    public record RemoteObject(String key, Instant createdAt) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record SupabaseListItem(
            String name,
            @JsonProperty("created_at") Instant createdAt
    ) {}

    private static final int LIST_PAGE_SIZE = 1000;

    private static String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            default -> "jpg"; // image/jpeg e demais
        };
    }
}
