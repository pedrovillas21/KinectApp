package com.kinetic.services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.kinetic.exceptions.ForbiddenException;
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
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Sobe arquivos de imagem para o Supabase Storage usando a service_role key (que
 * nunca sai do servidor) e gera URLs assinadas de curta duração para leitura.
 *
 * <p>O bucket é <b>privado</b>: nenhum objeto é acessível sem uma assinatura. O que
 * fica guardado em {@code social_posts.image_url} é apenas a <i>storage key</i>
 * (ex.: {@code posts/<uuid>.jpg}); a URL assinada é gerada a cada leitura, depois
 * que a camada de serviço já decidiu que o usuário pode ver aquele post. Assim a
 * regra de amizade continua sendo a única fonte de verdade e nenhum link
 * permanente escapa do servidor.
 */
@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    /** Limite de tamanho do arquivo (alinhado ao multipart em application.properties). */
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10 MB

    /** Pastas permitidas no bucket — evita path traversal a partir do {@code folder} do cliente. */
    private static final Set<String> ALLOWED_FOLDERS = Set.of("posts", "stories");

    /**
     * Formato exato das keys geradas por {@link #upload}: {@code {pasta}/{dono}_{uuid}.{ext}}.
     * Plano (sem subpasta por usuário) para a listagem de um nível do
     * OrphanMediaCleanupService continuar enxergando os objetos.
     */
    private static final Pattern MEDIA_KEY = Pattern.compile(
            "^(posts|stories)/([0-9a-f-]{36})_[0-9a-f-]{36}\\.(jpg|png|webp|gif)$");

    private final RestClient restClient;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.storage.bucket}")
    private String bucket;

    /**
     * Bucket PÚBLICO só para fotos de perfil (visíveis a qualquer pessoa, como no
     * Instagram). A URL pública não expira, então é ela que fica em users.avatar_url.
     */
    @Value("${supabase.storage.avatars-bucket:avatars}")
    private String avatarsBucket;

    /**
     * Validade da URL assinada. Curta de propósito: é a janela em que um link
     * copiado ainda funcionaria depois de a amizade ser desfeita. Precisa ser
     * maior que o tempo de rolagem de uma sessão de feed para as imagens não
     * "quebrarem" no meio do uso.
     */
    @Value("${supabase.storage.signed-url-ttl-seconds:900}")
    private int signedUrlTtlSeconds;

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
     * Sobe {@code file} para {@code {bucket}/{folder}/{ownerId}_{uuid}.{ext}} e retorna a
     * <b>storage key</b> (ex.: {@code posts/<ownerId>_<uuid>.jpg}) — não uma URL. É esse
     * valor que deve ser persistido no post/story; a URL de leitura é gerada
     * depois por {@link #signUrls(Collection)}. Lança
     * {@link IllegalArgumentException} (→ 400) para arquivos inválidos e
     * {@link RuntimeException} (→ 500) em falha do Storage.
     */
    public String upload(MultipartFile file, String folder, UUID ownerId) {
        String contentType = validatedImageType(file);

        String safeFolder = (folder == null || folder.isBlank()) ? "posts" : folder.trim();
        if (!ALLOWED_FOLDERS.contains(safeFolder)) {
            throw new IllegalArgumentException("Pasta de destino inválida.");
        }
        // key = {folder}/{ownerId}_{uuid}.{ext}: todos os componentes são controlados pelo
        // servidor (folder via whitelist, ids e extensão de um switch fixo), então não há
        // entrada do usuário concatenada na URL do Storage. O ownerId no nome é o que
        // permite a requireOwnMediaKey checar o dono depois.
        String key = safeFolder + "/" + ownerId + "_" + UUID.randomUUID() + "." + extensionFor(contentType);
        putObject(bucket, key, contentType, file);
        return key;
    }

    /**
     * Sobe a foto de perfil de {@code userId} ao bucket público de avatares e devolve a
     * URL pública. Nome novo a cada upload ({userId}/{uuid}.ext): a URL muda quando a
     * foto muda, então nenhum cache mostra a foto antiga.
     */
    public String uploadAvatar(MultipartFile file, UUID userId) {
        String contentType = validatedImageType(file);
        String key = userId + "/" + UUID.randomUUID() + "." + extensionFor(contentType);
        putObject(avatarsBucket, key, contentType, file);
        return supabaseUrl + "/storage/v1/object/public/" + avatarsBucket + "/" + key;
    }

    /** Apaga a foto de perfil da URL pública informada; ignora URL que não seja do bucket de avatares. Best-effort. */
    public void deleteAvatar(String publicUrl) {
        if (publicUrl == null) return;
        String marker = "/storage/v1/object/public/" + avatarsBucket + "/";
        int idx = publicUrl.indexOf(marker);
        if (idx < 0) return;
        deleteObject(avatarsBucket, publicUrl.substring(idx + marker.length()));
    }

    /** Valida tipo e tamanho; devolve o content-type. Inválido → {@link IllegalArgumentException} (400). */
    private static String validatedImageType(MultipartFile file) {
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
        return contentType;
    }

    private void putObject(String targetBucket, String key, String contentType, MultipartFile file) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Falha ao ler os bytes do arquivo.", e);
        }

        try {
            restClient.post()
                    .uri(supabaseUrl + "/storage/v1/object/" + targetBucket + "/" + key)
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
    }

    /**
     * Gera URLs assinadas para as {@code keys} informadas, em uma única chamada ao
     * Storage (o endpoint de assinatura aceita lote), e devolve um mapa
     * {@code key → URL assinada}. Keys que o Storage rejeitar ficam de fora do
     * mapa — o chamador trata a ausência como "post sem imagem" em vez de
     * devolver um link quebrado.
     *
     * <p>Chamar isto <b>depois</b> de ter validado o acesso: assinar é conceder
     * acesso.
     */
    // Mesmo motivo do @SuppressWarnings em list(): MediaType/Map são constantes
    // sem nulidade declarada, o que gera unchecked conversion sem risco real.
    @SuppressWarnings("null")
    public Map<String, String> signUrls(Collection<String> keys) {
        if (keys == null || keys.isEmpty()) {
            return Map.of();
        }
        List<String> paths = keys.stream().filter(Objects::nonNull).distinct().toList();
        if (paths.isEmpty()) {
            return Map.of();
        }

        List<SignedItem> items;
        try {
            items = restClient.post()
                    .uri(supabaseUrl + "/storage/v1/object/sign/" + bucket)
                    .header("apikey", serviceRoleKey)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("expiresIn", signedUrlTtlSeconds, "paths", paths))
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (RestClientResponseException e) {
            log.error("Falha ao assinar {} objeto(s) no Storage ({}): {}",
                    paths.size(), e.getStatusCode(), e.getResponseBodyAsString());
            return Map.of();
        } catch (RestClientException e) {
            log.error("Falha ao assinar {} objeto(s) no Storage: {}", paths.size(), e.getMessage());
            return Map.of();
        }
        if (items == null) {
            return Map.of();
        }

        Map<String, String> result = new HashMap<>();
        for (SignedItem item : items) {
            if (item.signedUrl() == null || item.path() == null) {
                // O Storage reporta o erro por item (ex.: objeto removido do bucket)
                // sem falhar o lote inteiro.
                log.warn("Storage nao assinou '{}': {}", item.path(), item.error());
                continue;
            }
            result.put(item.path(), absolutize(item.signedUrl()));
        }
        return result;
    }

    /** Versão de conveniência de {@link #signUrls(Collection)} para uma única key. */
    public String signUrl(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        return signUrls(List.of(key)).get(key);
    }

    /**
     * Remove do Storage a mídia informada, aceitando tanto uma storage key quanto
     * uma URL pública legada (posts criados antes de o bucket virar privado).
     * Usado como limpeza compensatória quando o upload deu certo mas a criação do
     * post/story falhou. É best-effort: falhas só são logadas.
     */
    public void delete(String urlOrKey) {
        String key = normalizeKey(urlOrKey);
        if (key == null) {
            return;
        }
        deleteByKey(key);
    }

    /**
     * Key de mídia social enviada por {@code ownerId}, normalizada (aceita a URL pública
     * legada). Vazio → null. Qualquer outra coisa (mídia de outro usuário, key antiga sem
     * dono, "..", barra inicial, outro bucket) → {@link ForbiddenException} (403): sem
     * isso o cliente poderia apagar ou reassinar objetos alheios com a service_role.
     */
    public String requireOwnMediaKey(String urlOrKey, UUID ownerId) {
        if (urlOrKey == null || urlOrKey.isBlank()) return null;
        String key = normalizeKey(urlOrKey);
        Matcher m = key != null ? MEDIA_KEY.matcher(key) : null;
        if (m == null || !m.matches() || !m.group(2).equals(ownerId.toString())) {
            throw new ForbiddenException("Mídia inválida ou de outro usuário.");
        }
        return key;
    }

    /** Remove o objeto identificado por {@code key} (ex: "posts/uuid.jpg"). Best-effort. */
    public void deleteByKey(String key) {
        deleteObject(bucket, key);
    }

    private void deleteObject(String targetBucket, String key) {
        try {
            restClient.delete()
                    .uri(supabaseUrl + "/storage/v1/object/" + targetBucket + "/" + key)
                    .header("apikey", serviceRoleKey)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.warn("Falha ao remover objeto '{}' do Storage ({}): {}",
                    key, e.getStatusCode(), e.getResponseBodyAsString());
        } catch (RestClientException e) {
            log.warn("Falha ao remover objeto '{}' do Storage: {}", key, e.getMessage());
        }
    }

    /**
     * Lista todos os objetos de {@code folder} no bucket, paginando automaticamente.
     * Restrito à whitelist {@code ALLOWED_FOLDERS}. Best-effort: erro de API retorna
     * o que foi coletado até o momento.
     */
    // MediaType.APPLICATION_JSON e o Map.of(...) não têm nulidade declarada pelas classes do
    // Spring/JDK, gerando aviso de unchecked conversion para os parâmetros @NonNull do
    // RestClient sem risco real de NPE (ambos são constantes/literais nunca nulos).
    @SuppressWarnings("null")
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
            } catch (RestClientException e) {
                log.warn("Falha ao listar '{}' (offset={}): {}", folder, offset, e.getMessage());
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

    /**
     * Normaliza para storage key um valor que pode vir como key já pronta
     * ({@code posts/uuid.jpg}) ou como URL pública legada, de antes de o bucket
     * virar privado. Retorna null para entrada vazia ou URL de outro bucket.
     */
    String normalizeKey(String urlOrKey) {
        if (urlOrKey == null || urlOrKey.isBlank()) return null;
        String value = urlOrKey.trim();
        if (!value.startsWith("http")) {
            return value; // já é uma key
        }
        String marker = "/storage/v1/object/public/" + bucket + "/";
        int idx = value.indexOf(marker);
        if (idx < 0) return null;
        return value.substring(idx + marker.length());
    }

    /**
     * O Storage devolve a URL assinada como caminho relativo
     * ({@code /object/sign/...}); aqui vira URL absoluta. Tolera a variante já
     * prefixada com {@code /storage/v1} para não duplicar o segmento.
     */
    private String absolutize(String signedUrl) {
        if (signedUrl.startsWith("http")) return signedUrl;
        String suffix = signedUrl.startsWith("/storage/v1")
                ? signedUrl
                : "/storage/v1" + (signedUrl.startsWith("/") ? signedUrl : "/" + signedUrl);
        return supabaseUrl + suffix;
    }

    /** Objeto listado no bucket com sua key completa e data de criação. */
    public record RemoteObject(String key, Instant createdAt) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record SignedItem(
            String path,
            @JsonProperty("signedURL") String signedUrl,
            String error
    ) {}

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
