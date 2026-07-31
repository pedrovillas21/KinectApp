package com.kinetic.controllers;

import com.kinetic.dtos.*;
import com.kinetic.services.SocialService;
import com.kinetic.services.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/social")
@Tag(
        name = "Social",
        description = "Feed, stories, conexões entre usuários, curtidas e comentários — a rede social do app."
)
public class SocialController extends BaseController {

    private final SocialService socialService;
    private final StorageService storageService;

    public SocialController(SocialService socialService, StorageService storageService) {
        this.socialService = socialService;
        this.storageService = storageService;
    }

    // ── Media ─────────────────────────────────────────────────────────────────

    @Operation(
            summary = "Enviar uma foto/vídeo para o armazenamento",
            description = "Sobe o arquivo enviado (campo \"file\", formulário multipart) para o Supabase Storage e "
                    + "devolve a URL pública gerada. Chame este endpoint primeiro e use a URL da resposta para "
                    + "criar um post ou story — o arquivo em si não vai dentro do post/story."
    )
    @PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> uploadMedia(
            @Parameter(description = "Pasta de destino no storage (organização interna). Padrão: \"posts\".")
            @RequestParam(defaultValue = "posts") String folder,
            @Parameter(description = "Arquivo de imagem/vídeo a enviar.")
            @RequestPart("file") MultipartFile file) {
        String url = storageService.upload(file, folder);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MediaUploadResponse(url));
    }

    @Operation(
            summary = "Apagar uma mídia enviada",
            description = "Remove do armazenamento o arquivo cuja URL for informada. Usado para limpar o arquivo "
                    + "quando o upload deu certo mas a criação do post/story falhou depois — evita deixar arquivo "
                    + "\"órfão\" ocupando espaço."
    )
    @DeleteMapping("/media")
    public ResponseEntity<Void> deleteMedia(@Parameter(description = "URL pública retornada pelo upload.") @RequestParam String url) {
        storageService.delete(url);
        return ResponseEntity.noContent().build();
    }

    // ── Search ──────────────────────────────────────────────────────────────

    @Operation(
            summary = "Buscar usuários pelo nome",
            description = "Procura no banco usuários cujo nome combine com o texto informado, para a tela de busca "
                    + "de pessoas. Se \"q\" vier vazio, o comportamento depende da implementação (pode devolver "
                    + "uma lista vazia ou sugestões padrão)."
    )
    @GetMapping("/users/search")
    public ResponseEntity<List<UserCardDTO>> searchUsers(
            @Parameter(description = "Texto de busca (nome ou parte dele).")
            @RequestParam(required = false, defaultValue = "") String q) {
        String email = currentUserEmail();
        try {
            return ResponseEntity.ok(socialService.searchUsers(email, q));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // ── Connections ─────────────────────────────────────────────────────────

    @Operation(
            summary = "Enviar um convite de conexão",
            description = "Cria no banco uma solicitação de conexão (\"amizade\") do usuário logado para o usuário "
                    + "cujo id vier em \"addresseeId\" no corpo da requisição. Fica pendente até a outra pessoa aceitar."
    )
    @PostMapping("/connections")
    public ResponseEntity<?> sendConnection(@RequestBody Map<String, UUID> body) {
        try {
            socialService.sendConnection(currentUserEmail(), body.get("addresseeId"));
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Listar solicitações de conexão recebidas",
            description = "Retorna os convites de conexão que outras pessoas enviaram para o usuário logado e "
                    + "ainda não foram respondidos."
    )
    @GetMapping("/connections/pending")
    public ResponseEntity<List<PendingRequestDTO>> getPendingRequests() {
        return ResponseEntity.ok(socialService.getPendingRequests(currentUserEmail()));
    }

    @Operation(
            summary = "Aceitar uma solicitação de conexão",
            description = "Confirma a conexão entre o usuário logado e quem enviou o convite. O \"id\" da URL é o "
                    + "id do usuário que enviou a solicitação — não é um id de conexão."
    )
    @PostMapping("/connections/{id}/accept")
    public ResponseEntity<?> acceptConnection(@PathVariable UUID id) {
        try {
            socialService.acceptConnection(currentUserEmail(), id);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @Operation(
            summary = "Remover uma conexão (ou recusar/cancelar um convite)",
            description = "Apaga do banco a conexão (ou a solicitação pendente) entre o usuário logado e o usuário "
                    + "informado no \"id\" da URL."
    )
    @DeleteMapping("/connections/{id}")
    public ResponseEntity<?> removeConnection(@PathVariable UUID id) {
        try {
            socialService.removeConnection(currentUserEmail(), id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    // ── Squad ────────────────────────────────────────────────────────────────

    @Operation(
            summary = "Listar o squad (grupo próximo) do usuário",
            description = "Retorna as conexões que o usuário marcou como \"squad\" — um subconjunto em destaque das "
                    + "conexões normais."
    )
    @GetMapping("/squad")
    public ResponseEntity<List<SquadMemberDTO>> getSquad() {
        return ResponseEntity.ok(socialService.getSquad(currentUserEmail()));
    }

    @Operation(
            summary = "Adicionar/remover alguém do squad",
            description = "Alterna (liga/desliga) se o usuário informado no \"userId\" da URL faz parte do squad do "
                    + "usuário logado. Se já estava no squad, é removido; se não estava, é adicionado."
    )
    @PostMapping("/squad/{userId}/toggle")
    public ResponseEntity<?> toggleSquad(@PathVariable UUID userId) {
        try {
            socialService.toggleSquad(currentUserEmail(), userId);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(
            summary = "Ver o squad com status de presença",
            description = "Igual a /api/social/squad, mas pensado para telas que mostram quem do squad está ativo/"
                    + "treinando agora."
    )
    @GetMapping("/squad/status")
    public ResponseEntity<List<SquadMemberDTO>> getSquadStatus() {
        return ResponseEntity.ok(socialService.getSquad(currentUserEmail()));
    }

    // ── Feed ─────────────────────────────────────────────────────────────────

    @Operation(
            summary = "Buscar as publicações do feed",
            description = "Retorna os posts do feed social em páginas (para rolagem infinita). \"page\" é o número "
                    + "da página começando em 0; \"size\" é quantos posts vêm por página."
    )
    @GetMapping("/feed")
    public ResponseEntity<Page<FeedPostDTO>> getFeed(
            @Parameter(description = "Número da página, começando em 0. Padrão: 0.")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Quantidade de posts por página. Padrão: 10.")
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(socialService.getFeed(currentUserEmail(), PageRequest.of(page, size)));
    }

    @Operation(
            summary = "Criar uma publicação",
            description = "Salva um novo post no feed do usuário logado. Se o post tiver imagem/vídeo, faça o "
                    + "upload primeiro em /api/social/media e envie a URL retornada dentro do post."
    )
    @PostMapping("/posts")
    public ResponseEntity<FeedPostDTO> createPost(@RequestBody CreatePostRequest req) {
        FeedPostDTO dto = socialService.createPost(currentUserEmail(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // ── Stories ──────────────────────────────────────────────────────────────

    @Operation(
            summary = "Listar os stories ativos",
            description = "Retorna os stories ainda válidos (não expirados), agrupados por autor, para a barra de "
                    + "stories do feed."
    )
    @GetMapping("/stories")
    public ResponseEntity<List<StoryGroupDTO>> getStories() {
        return ResponseEntity.ok(socialService.getStories(currentUserEmail()));
    }

    @Operation(
            summary = "Publicar um story",
            description = "Cria um novo story para o usuário logado, que some automaticamente depois de um tempo. "
                    + "Assim como o post, se tiver mídia, faça o upload antes em /api/social/media."
    )
    @PostMapping("/stories")
    public ResponseEntity<StoryDTO> createStory(@RequestBody CreateStoryRequest req) {
        StoryDTO dto = socialService.createStory(currentUserEmail(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // ── Likes ────────────────────────────────────────────────────────────────

    @Operation(
            summary = "Curtir uma publicação",
            description = "Registra que o usuário logado curtiu o post informado no \"id\" da URL e devolve o total "
                    + "atualizado de curtidas."
    )
    @PostMapping("/posts/{id}/like")
    public ResponseEntity<Map<String, Long>> likePost(@PathVariable UUID id) {
        long count = socialService.likePost(currentUserEmail(), id);
        return ResponseEntity.ok(Map.of("likesCount", count));
    }

    @Operation(
            summary = "Descurtir uma publicação",
            description = "Remove a curtida do usuário logado no post informado no \"id\" da URL e devolve o total "
                    + "atualizado de curtidas."
    )
    @DeleteMapping("/posts/{id}/like")
    public ResponseEntity<Map<String, Long>> unlikePost(@PathVariable UUID id) {
        long count = socialService.unlikePost(currentUserEmail(), id);
        return ResponseEntity.ok(Map.of("likesCount", count));
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    @Operation(
            summary = "Listar os comentários de uma publicação",
            description = "Retorna todos os comentários salvos no banco para o post informado no \"id\" da URL."
    )
    @GetMapping("/posts/{id}/comments")
    public ResponseEntity<List<CommentDTO>> listComments(@PathVariable UUID id) {
        return ResponseEntity.ok(socialService.listComments(id));
    }

    @Operation(
            summary = "Comentar em uma publicação",
            description = "Cria um novo comentário do usuário logado no post informado no \"id\" da URL."
    )
    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<CommentDTO> addComment(@PathVariable UUID id,
                                                  @Valid @RequestBody AddCommentRequest req) {
        CommentDTO dto = socialService.addComment(currentUserEmail(), id, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
