package com.kinetic.services;

import com.kinetic.dtos.*;
import com.kinetic.enums.PresenceStatus;
import com.kinetic.models.*;
import com.kinetic.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SocialService {

    private final UserRepository userRepository;
    private final UserConnectionRepository connectionRepository;
    private final SocialPostRepository postRepository;
    private final PostLikeRepository likeRepository;
    private final PostCommentRepository commentRepository;

    public SocialService(UserRepository userRepository,
                         UserConnectionRepository connectionRepository,
                         SocialPostRepository postRepository,
                         PostLikeRepository likeRepository,
                         PostCommentRepository commentRepository) {
        this.userRepository = userRepository;
        this.connectionRepository = connectionRepository;
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
    }

    // ── Search ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserCardDTO> searchUsers(String email, String query) {
        User me = findByEmail(email);
        List<User> matches = userRepository.findByNomeContainingIgnoreCaseAndIdNot(query, me.getId());
        return matches.stream()
                .map(u -> new UserCardDTO(u.getId(), u.getNome(), avatarOf(u), connectionState(me, u)))
                .toList();
    }

    // ── Connections ─────────────────────────────────────────────────────────

    @Transactional
    public void sendConnection(String email, UUID addresseeId) {
        User me = findByEmail(email);
        User addressee = findById(addresseeId);
        if (connectionRepository.findPair(me.getId(), addressee.getId()).isPresent()) return;

        UserConnection conn = new UserConnection();
        conn.setRequester(me);
        conn.setAddressee(addressee);
        conn.setStatus("PENDING");
        connectionRepository.save(conn);
    }

    @Transactional
    public void acceptConnection(String email, UUID connectionId) {
        User me = findByEmail(email);
        UserConnection conn = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new EntityNotFoundException("Connection not found"));
        if (!conn.getAddressee().getId().equals(me.getId())) throw new IllegalStateException("Not your request");
        conn.setStatus("ACCEPTED");
        conn.setRespondedAt(LocalDateTime.now());
        connectionRepository.save(conn);
    }

    @Transactional
    public void removeConnection(String email, UUID connectionId) {
        User me = findByEmail(email);
        UserConnection conn = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new EntityNotFoundException("Connection not found"));
        boolean isParty = conn.getRequester().getId().equals(me.getId())
                || conn.getAddressee().getId().equals(me.getId());
        if (!isParty) throw new IllegalStateException("Not your connection");
        connectionRepository.delete(conn);
    }

    // ── Squad ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SquadMemberDTO> getSquad(String email) {
        User me = findByEmail(email);
        List<UserConnection> accepted = connectionRepository.findAcceptedFor(me.getId());
        return accepted.stream()
                .filter(c -> isInSquad(c, me.getId()))
                .map(c -> {
                    User friend = friendOf(c, me.getId());
                    return new SquadMemberDTO(
                            friend.getId(),
                            friend.getNome(),
                            avatarOf(friend),
                            derivePresence(friend).name(),
                            hasNewUpdate(friend)
                    );
                })
                .toList();
    }

    @Transactional
    public void toggleSquad(String email, UUID friendId) {
        User me = findByEmail(email);
        UserConnection conn = connectionRepository.findPair(me.getId(), friendId)
                .orElseThrow(() -> new EntityNotFoundException("Connection not found"));
        if (!"ACCEPTED".equals(conn.getStatus())) throw new IllegalStateException("Not connected");

        if (conn.getRequester().getId().equals(me.getId())) {
            conn.setRequesterInSquad(!conn.getRequesterInSquad());
        } else {
            conn.setAddresseeInSquad(!conn.getAddresseeInSquad());
        }
        connectionRepository.save(conn);
    }

    @Transactional(readOnly = true)
    public List<SquadMemberDTO> getSquadStatus(String email) {
        return getSquad(email);
    }

    // ── Feed ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<FeedPostDTO> getFeed(String email, Pageable pageable) {
        User me = findByEmail(email);
        List<UUID> authorIds = getConnectedIds(me);
        authorIds.add(me.getId());

        Page<SocialPost> page = postRepository.findFeed(authorIds, pageable);
        List<SocialPost> posts = page.getContent();
        if (posts.isEmpty()) return new PageImpl<>(List.of(), pageable, 0);

        List<UUID> postIds = posts.stream().map(SocialPost::getId).toList();

        Map<UUID, Long> likeCounts = buildLikeCounts(postIds);
        Map<UUID, Long> commentCounts = buildCommentCounts(postIds);
        Set<UUID> likedByMe = new HashSet<>(likeRepository.findLikedPostIds(postIds, me.getId()));

        List<FeedPostDTO> dtos = posts.stream()
                .map(p -> toFeedPostDTO(p, likeCounts, commentCounts, likedByMe))
                .toList();

        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional
    public FeedPostDTO createPost(String email, CreatePostRequest req) {
        User me = findByEmail(email);
        SocialPost post = new SocialPost();
        post.setAuthor(me);
        post.setCategory(req.category());
        post.setIntensity(req.intensity());
        post.setDurationMinutes(req.durationMinutes());
        post.setCalories(req.calories());
        post.setCaption(req.caption());
        post.setImageUrl(req.imageUrl());
        post.setBadge(req.badge());
        postRepository.save(post);

        return toFeedPostDTO(post, Map.of(), Map.of(), Set.of());
    }

    // ── Likes ────────────────────────────────────────────────────────────────

    @Transactional
    public long likePost(String email, UUID postId) {
        User me = findByEmail(email);
        if (!likeRepository.existsByPostIdAndUserId(postId, me.getId())) {
            SocialPost post = postRepository.findById(postId)
                    .orElseThrow(() -> new EntityNotFoundException("Post not found"));
            PostLike like = new PostLike();
            like.setPost(post);
            like.setUser(me);
            likeRepository.save(like);
        }
        return likeRepository.countByPostId(postId);
    }

    @Transactional
    public long unlikePost(String email, UUID postId) {
        User me = findByEmail(email);
        likeRepository.deleteByPostIdAndUserId(postId, me.getId());
        return likeRepository.countByPostId(postId);
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CommentDTO> listComments(UUID postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(c -> new CommentDTO(
                        c.getId(),
                        c.getUser().getId(),
                        c.getUser().getNome(),
                        avatarOf(c.getUser()),
                        c.getBody(),
                        c.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public CommentDTO addComment(String email, UUID postId, AddCommentRequest req) {
        User me = findByEmail(email);
        SocialPost post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found"));
        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setUser(me);
        comment.setBody(req.body());
        commentRepository.save(comment);
        return new CommentDTO(comment.getId(), me.getId(), me.getNome(), avatarOf(me), comment.getBody(), comment.getCreatedAt());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PresenceStatus derivePresence(User u) {
        if (u.getLastActive() == null) return PresenceStatus.OFFLINE;
        LocalDateTime now = LocalDateTime.now();
        if (u.getActiveSessionId() != null
                && u.getLastActive().isAfter(now.minusMinutes(5))) {
            return PresenceStatus.TRAINING;
        }
        if (u.getLastActive().isAfter(now.minusMinutes(2))) {
            return PresenceStatus.ONLINE;
        }
        return PresenceStatus.OFFLINE;
    }

    private boolean hasNewUpdate(User u) {
        return postRepository.findFeed(List.of(u.getId()), Pageable.ofSize(1))
                .stream()
                .findFirst()
                .map(p -> p.getCreatedAt().isAfter(LocalDateTime.now().minusHours(24)))
                .orElse(false);
    }

    private String connectionState(User me, User other) {
        Optional<UserConnection> opt = connectionRepository.findPair(me.getId(), other.getId());
        if (opt.isEmpty()) return "NONE";
        UserConnection c = opt.get();
        if ("ACCEPTED".equals(c.getStatus())) return "CONNECTED";
        if (c.getRequester().getId().equals(me.getId())) return "PENDING_OUTGOING";
        return "PENDING_INCOMING";
    }

    private boolean isInSquad(UserConnection c, UUID meId) {
        if (c.getRequester().getId().equals(meId)) return Boolean.TRUE.equals(c.getRequesterInSquad());
        return Boolean.TRUE.equals(c.getAddresseeInSquad());
    }

    private User friendOf(UserConnection c, UUID meId) {
        return c.getRequester().getId().equals(meId) ? c.getAddressee() : c.getRequester();
    }

    private List<UUID> getConnectedIds(User me) {
        return connectionRepository.findAcceptedFor(me.getId()).stream()
                .map(c -> friendOf(c, me.getId()).getId())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private Map<UUID, Long> buildLikeCounts(List<UUID> postIds) {
        return likeRepository.countByPostIds(postIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
    }

    private Map<UUID, Long> buildCommentCounts(List<UUID> postIds) {
        return commentRepository.countByPostIds(postIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
    }

    private FeedPostDTO toFeedPostDTO(SocialPost p,
                                      Map<UUID, Long> likeCounts,
                                      Map<UUID, Long> commentCounts,
                                      Set<UUID> likedByMe) {
        User author = p.getAuthor();
        FeedAuthorDTO authorDTO = new FeedAuthorDTO(author.getId(), author.getNome(), avatarOf(author));

        String duration = formatDuration(p.getDurationMinutes());
        String calories = formatCalories(p.getCalories());
        String timestamp = formatTimestamp(p.getCreatedAt());

        return new FeedPostDTO(
                p.getId(),
                authorDTO,
                timestamp,
                p.getCategory() != null ? p.getCategory().toUpperCase() : "",
                p.getImageUrl(),
                duration,
                calories,
                p.getBadge(),
                likeCounts.getOrDefault(p.getId(), 0L),
                commentCounts.getOrDefault(p.getId(), 0L),
                p.getCaption() != null ? p.getCaption() : "",
                likedByMe.contains(p.getId()),
                p.getCreatedAt()
        );
    }

    private String formatDuration(Integer minutes) {
        if (minutes == null || minutes <= 0) return "";
        if (minutes >= 60) return (minutes / 60) + " HRS";
        return minutes + " MIN";
    }

    private String formatCalories(Integer kcal) {
        if (kcal == null || kcal <= 0) return "";
        return kcal + " KCAL";
    }

    private String formatTimestamp(LocalDateTime createdAt) {
        if (createdAt == null) return "";
        long minutes = ChronoUnit.MINUTES.between(createdAt, LocalDateTime.now());
        if (minutes < 1) return "JUST NOW";
        if (minutes < 60) return minutes + " MIN AGO";
        long hours = minutes / 60;
        if (hours < 24) return hours + " HRS AGO";
        long days = hours / 24;
        return days + " DAYS AGO";
    }

    private String avatarOf(User u) {
        return u.getAvatarUrl() != null ? u.getAvatarUrl()
                : "https://i.pravatar.cc/150?u=" + u.getId();
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuario nao encontrado."));
    }

    private User findById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario nao encontrado."));
    }
}
