package com.kinetic.controllers;

import com.kinetic.dtos.*;
import com.kinetic.services.SocialService;
import com.kinetic.services.StorageService;
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
public class SocialController extends BaseController {

    private final SocialService socialService;
    private final StorageService storageService;

    public SocialController(SocialService socialService, StorageService storageService) {
        this.socialService = socialService;
        this.storageService = storageService;
    }

    // ── Media ─────────────────────────────────────────────────────────────────

    // Sobe a imagem ao Supabase Storage e devolve a URL pública. O app chama
    // este endpoint antes de criar post/story, gravando a URL retornada em
    // imageUrl (em vez do caminho local do dispositivo).
    @PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> uploadMedia(
            @RequestParam(defaultValue = "posts") String folder,
            @RequestPart("file") MultipartFile file) {
        String url = storageService.upload(file, folder);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MediaUploadResponse(url));
    }

    // ── Search ──────────────────────────────────────────────────────────────

    @GetMapping("/users/search")
    public ResponseEntity<List<UserCardDTO>> searchUsers(
            @RequestParam(required = false, defaultValue = "") String q) {
        String email = currentUserEmail();
        try {
            return ResponseEntity.ok(socialService.searchUsers(email, q));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // ── Connections ─────────────────────────────────────────────────────────

    @PostMapping("/connections")
    public ResponseEntity<?> sendConnection(@RequestBody Map<String, UUID> body) {
        try {
            socialService.sendConnection(currentUserEmail(), body.get("addresseeId"));
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/connections/pending")
    public ResponseEntity<List<PendingRequestDTO>> getPendingRequests() {
        return ResponseEntity.ok(socialService.getPendingRequests(currentUserEmail()));
    }

    // {id} = id do usuário que enviou a solicitação (não o id da conexão).
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

    @GetMapping("/squad")
    public ResponseEntity<List<SquadMemberDTO>> getSquad() {
        return ResponseEntity.ok(socialService.getSquad(currentUserEmail()));
    }

    @PostMapping("/squad/{userId}/toggle")
    public ResponseEntity<?> toggleSquad(@PathVariable UUID userId) {
        try {
            socialService.toggleSquad(currentUserEmail(), userId);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/squad/status")
    public ResponseEntity<List<SquadMemberDTO>> getSquadStatus() {
        return ResponseEntity.ok(socialService.getSquad(currentUserEmail()));
    }

    // ── Feed ─────────────────────────────────────────────────────────────────

    @GetMapping("/feed")
    public ResponseEntity<Page<FeedPostDTO>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(socialService.getFeed(currentUserEmail(), PageRequest.of(page, size)));
    }

    @PostMapping("/posts")
    public ResponseEntity<FeedPostDTO> createPost(@RequestBody CreatePostRequest req) {
        FeedPostDTO dto = socialService.createPost(currentUserEmail(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // ── Stories ──────────────────────────────────────────────────────────────

    @GetMapping("/stories")
    public ResponseEntity<List<StoryGroupDTO>> getStories() {
        return ResponseEntity.ok(socialService.getStories(currentUserEmail()));
    }

    @PostMapping("/stories")
    public ResponseEntity<StoryDTO> createStory(@RequestBody CreateStoryRequest req) {
        StoryDTO dto = socialService.createStory(currentUserEmail(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // ── Likes ────────────────────────────────────────────────────────────────

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<Map<String, Long>> likePost(@PathVariable UUID id) {
        long count = socialService.likePost(currentUserEmail(), id);
        return ResponseEntity.ok(Map.of("likesCount", count));
    }

    @DeleteMapping("/posts/{id}/like")
    public ResponseEntity<Map<String, Long>> unlikePost(@PathVariable UUID id) {
        long count = socialService.unlikePost(currentUserEmail(), id);
        return ResponseEntity.ok(Map.of("likesCount", count));
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    @GetMapping("/posts/{id}/comments")
    public ResponseEntity<List<CommentDTO>> listComments(@PathVariable UUID id) {
        return ResponseEntity.ok(socialService.listComments(id));
    }

    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<CommentDTO> addComment(@PathVariable UUID id,
                                                  @Valid @RequestBody AddCommentRequest req) {
        CommentDTO dto = socialService.addComment(currentUserEmail(), id, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
