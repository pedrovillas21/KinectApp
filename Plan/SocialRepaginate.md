Social Feature Rework — Full-Stack (KineticApp)
Context
SocialScreen.tsx is today fully mocked (mockSquad + mockFeed from mockData.ts). The user wants it DB-backed while keeping the prototype's flow: stories ring, feed posts, adding people searched from registered users, adding them to a "squad", and showing a live treinando (training) vs online status color on squad avatars.

Exploration confirmed there is no social backend at all: the Spring Boot app at kinetic-backend/ has users/workouts/sessions but no friends, squad, posts, likes, comments, user-search, or presence. The "online" ranking dot today is hardcoded mock. No WebSocket / Supabase Realtime exists.

Decisions locked with the user: build full-stack, all at once; presence via polling (no realtime infra); first build centers on squad + training status and feed posts (likes/comments) with a minimal search + add-connection flow as a prerequisite; stories are designed-for but NOT built (24h ephemeral — follow-up); visuals refined later, reusing the dark KINETIC language.

Outcome: a real social graph (connections → squad), a real feed with likes/comments, and squad avatars that turn green while a friend trains and teal/gray when idle — all on the existing Spring + Supabase + Axios stack.

Architecture decisions
Squad = accepted connections flagged into the squad bar. Single user_connections table (requester/addressee/status PENDING|ACCEPTED) with per-direction requester_in_squad / addressee_in_squad booleans (default true on accept). Avoids a separate squad table.
Presence by polling. Add last_active TIMESTAMP + active_session_id UUID to users. Frontend polls GET /api/social/squad/status every ~20s. Status derivation evaluates TRAINING FIRST, then ONLINE, then OFFLINE (order is load-bearing): TRAINING if active_session_id set AND last_active >= now()-5min; else ONLINE if last_active >= now()-2min; else OFFLINE. Evaluating ONLINE first would wrongly drop a genuinely-training user whose screen locked 3min ago (fails the 2min ONLINE window) down to OFFLINE despite an active session — the TRAINING branch with its wider 5min guard must short-circuit first.
last_active updated cheaply via a HandlerInterceptor doing a gated UPDATE ... WHERE last_active IS NULL OR last_active < now()-60s — never a write per request.
TRAINING flag set on POST /api/sessions/start (ActiveSessionScreen mount), cleared by existing POST /api/sessions/log (finish) and DELETE /api/sessions/active (exit without finishing). 5-min guard handles crashed clients.
Avatars: add nullable avatar_url to users; no upload yet — frontend falls back to https://i.pravatar.cc/150?u=<userId> (mirrors today's mock).
Stories-extensible: social_posts.kind (default POST) + expires_at reserved now; hasNewUpdate ring derived as "author posted in last 24h", swappable to "has unexpired STORY" later with no schema change.
Feed formatting done server-side so FeedPostDTO matches the existing FeedPostData shape ("45 MIN", "420 KCAL", "2 HRS AGO"); also return raw createdAt.
Backend (kinetic-backend/src/main/java/com/kinetic/)
Flyway migrations (src/main/resources/db/migration/, next is V8)
V8 — ALTER TABLE users ADD avatar_url VARCHAR(512), last_active TIMESTAMP, active_session_id UUID; + index on last_active.
V9 — user_connections(id, requester_id FK, addressee_id FK, status VARCHAR(16) DEFAULT 'PENDING', requester_in_squad BOOL, addressee_in_squad BOOL, created_at, responded_at); CHECK(requester<>addressee); unique (LEAST(requester,addressee), GREATEST(...)) to block reciprocal dupes; indexes on each side+status.
V10 — social_posts(id, author_id FK, workout_session_id FK null, kind DEFAULT 'POST', category, intensity VARCHAR(16), duration_minutes INT, calories INT, caption TEXT, image_url, badge, expires_at, created_at); index (author_id, created_at DESC).
V11 — post_likes(id, post_id FK ON DELETE CASCADE, user_id FK, created_at, UNIQUE(post_id,user_id)); post_comments(id, post_id FK CASCADE, user_id FK, body TEXT, created_at).
Use Postgres gen_random_uuid() / IF NOT EXISTS per existing V7. Match entity column names exactly so Hibernate ddl doesn't create a second shape.

Enums (com.kinetic.enums)
ConnectionStatus, PresenceStatus, PostIntensity{LEVE,MODERADO,ALTA}.

Entities (com.kinetic.models) — mirror User.java/WorkoutSession.java conventions
NEW: UserConnection, SocialPost, PostLike, PostComment (Lombok, @GeneratedValue(UUID), @ManyToOne(LAZY)+@JsonIgnore, @CreationTimestamp).
MODIFY User.java: add avatarUrl, lastActive, activeSessionId.
Repositories (com.kinetic.repositories)
MODIFY UserRepository: add findByNomeContainingIgnoreCaseAndIdNot(String, UUID).
NEW UserConnectionRepository (find pair either-direction, accepted-for-user, pending-incoming), SocialPostRepository (findFeed(authorIds, Pageable) ordered created_at DESC), PostLikeRepository (existsBy…, deleteBy…, countByPostId, batch liked-ids + counts), PostCommentRepository (findByPostIdOrderByCreatedAtAsc, batch counts). Feed counts via 3 batched queries — no N+1.
DTOs (com.kinetic.dtos, records)
UserCardDTO(id,nome,avatarUrl,connectionState) where state ∈ NONE/PENDING_OUTGOING/PENDING_INCOMING/CONNECTED; SquadMemberDTO(id,nome,avatarUrl,status,hasNewUpdate); FeedPostDTO (fields named to match frontend FeedPostData, @JsonProperty("isLikedByMe") like the existing RankingEntryDTO trick) + FeedAuthorDTO(id,nome,avatarUrl); CommentDTO; CreatePostRequest; AddCommentRequest(@NotBlank body); StartSessionResponseDTO.

Null-safe mapping for photo-only posts: a SocialPost with workout_session_id = NULL (plain photo + caption, no workout attached) has null category/intensity/durationMinutes/calories/badge. SocialService must map these to safe defaults so Jackson never emits a shape the frontend's string-parsing (post.duration.split(' ') in FeedPost) can choke on: emit duration: ""/calories: "" (or "—"), category: "", badge: null. FeedPost must also guard the .split(' ') against empty/undefined. Never let a null metric bubble out as a raw null into a field FeedPost treats as a non-null string.

Services (com.kinetic.services)
NEW SocialService — search/connect/accept/remove/toggleSquad/listSquad/squadStatus/getFeed/createPost/like/unlike/listComments/addComment; resolves current user by email; holds presence-derivation + server-side string formatting.
NEW PresenceService — touch, startSession, endSession.
MODIFY WorkoutSessionService.logSession → call presenceService.endSession after saving.
Controllers (com.kinetic.controllers)
NEW SocialController @RequestMapping("/api/social"): GET /users/search?q=, POST /connections, POST /connections/{id}/accept, DELETE /connections/{id}, GET /squad, POST /squad/{userId}/toggle, GET /squad/status (poll), GET /feed?page&size, POST /posts, POST|DELETE /posts/{id}/like, GET|POST /posts/{id}/comments.
MODIFY session controller: POST /api/sessions/start (set active), DELETE /api/sessions/active (clear on exit).
NEW WebMvcConfigurer + HandlerInterceptor for gated last_active touch.
No SecurityConfig change (/api/** already JWT-protected).
Frontend (KineticApp/src/)
Types — MODIFY types/index.ts
Add PresenceStatus, ConnectionState, PostIntensity, SquadMember{id,nome,avatarUrl,status,hasNewUpdate}, FeedAuthor, FeedPostData (with createdAt), UserCard, Comment, CreatePostRequest, Page<T>. Strip the social interfaces out of mockData.ts (keep exercise mocks); SquadBar/FeedPost import from types.

NEW services/socialService.ts
First domain service wrapping api.ts: searchUsers, sendConnection, acceptConnection, removeConnection, toggleInSquad, getSquad, getSquadStatus, getFeed, createPost, likePost, unlikePost, getComments, addComment, startWorkoutPresence (POST /sessions/start), endWorkoutPresence (DELETE /sessions/active), plus avatarFallback(id,url).

NEW hooks
hooks/useSquadStatus.ts — fetch on mount + setInterval(~20s), clear on unmount, pause on AppState background.
hooks/useWorkoutPresence.ts — startWorkoutPresence() on mount; on unmount fire endWorkoutPresence() only if not already saved. Expose a markSaved() setter (backed by a hasSaved ref); ActiveSessionScreen calls it right after a successful POST /sessions/log so the unmount cleanup does NOT DELETE /sessions/active and clobber a session the backend just persisted-and-cleared. The ref (not state) guarantees the latest value is visible inside the unmount closure.
MODIFY components/screens
theme/kinetic.ts: add presenceColor(status) → TRAINING=KINETIC.success (green), ONLINE=KINETIC.primary (teal), OFFLINE=KINETIC.textMuted (gray).
SquadBar.tsx: props items: SquadMember[], onAddPress, onFindPress, onMemberPress; ring color from presenceColor(status); TRAINING Animated pulse; wire "Add +"/"Find" to UserSearchModal; avatar fallback.
FeedPost.tsx: author {id,nome,avatarUrl}; avatar fallback; like button → optimistic onToggleLike reconciled from server; comment button → onOpenComments. Guard post.duration.split(' ') (and the metrics block) against empty/undefined so photo-only posts with blank duration/calories render without crashing.
SocialScreen.tsx: remove mocks; paginated FlatList (onEndReached next page, RefreshControl reload + squad refresh, ListHeaderComponent=<SquadBar/>); useSquadStatus(); FAB opens NewPostModal; manage CommentsSheet + screen-level like handler; loading/empty states.
ActiveSessionScreen.tsx: add useWorkoutPresence().
NEW components
components/UserSearchModal.tsx — Modal+BlurView, debounced search, per-row action by connectionState (Add / Pending / Accept / In squad), optimistic update; parent refreshes squad on close.
components/CommentsSheet.tsx — bottom sheet from the screenshot; load comments, FlatList, input+send (optimistic), bump parent commentsCount; KeyboardAvoidingView.
components/NewPostModal.tsx — replaces inline handleOpenCamera; intensity segmented control LEVE|MODERADO|ALTA, caption, photo via expo-image-picker, "Treino detectado automaticamente" card (pre-fill from recent session; static placeholder OK for v1); calls createPost, returns new post to prepend.
Build order
Migrations V8–V11 → enums + User columns + entities → repositories (incl. search) → PresenceService + WorkoutSessionService change + interceptor → SocialService → controllers (Social + session start/clear) → verify backend → FE types + socialService → hooks + presenceColor → SquadBar + FeedPost → UserSearchModal/CommentsSheet/NewPostModal → SocialScreen + ActiveSessionScreen → E2E.

Verification
Backend: cd kinetic-backend; ./gradlew bootRun — confirm Flyway migrates to v8–v11; verify tables/columns in Supabase. Login for a JWT, smoke each endpoint: search → connect → accept (2nd account) → /squad + /squad/status show status → POST /sessions/start makes friend read TRAINING within a poll → /sessions/log drops it → create post → feed → like → comment. Add SocialServiceTest (connection-state transitions, presence thresholds, feed author-filter, like idempotency) and UserConnectionRepositoryTest (LEAST/GREATEST unique pair).
Frontend: cd KineticApp; npx expo start, two accounts/devices. Social → Find → search → Add → (other accepts) → squad avatar appears → start workout on A → B's ring turns green within ~20s → finish → ring returns teal/gray → NewPostModal create (intensity+photo+caption) → top of feed → like (optimistic) → CommentsSheet add comment → count increments. Check pull-to-refresh + pagination.
Risks
Polling load (pause on background, batched single query, gated last_active write); stale TRAINING flag (5-min guard + clear-on-log + DELETE /sessions/active); avatar storage deferred (nullable + FE fallback); pagination drift on offset paging (accept minor dupes v1, design getFeed for later keyset cursor); squad/connection integrity (LEAST/GREATEST unique index, directional in_squad); feed N+1 (enforce 3 batched count queries).

Follow-ups (designed-for, not in this build)
Stories (24h ephemeral via kind='STORY'+expires_at), avatar upload (Supabase Storage), automatic workout detection, incoming-requests inbox UI, keyset feed pagination.