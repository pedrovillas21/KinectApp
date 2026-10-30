package com.kinetic.services;

import com.kinetic.dtos.AddCommentRequest;
import com.kinetic.exceptions.ForbiddenException;
import com.kinetic.models.PostLike;
import com.kinetic.models.SocialPost;
import com.kinetic.models.User;
import com.kinetic.models.UserConnection;
import com.kinetic.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Curtidas/comentários só em post visível (meu ou de amigo aceito) e mídia só do próprio dono. */
class SocialServiceVisibilityTest {

    private static final String EMAIL = "me@test.local";

    private final UserRepository users = mock(UserRepository.class);
    private final UserConnectionRepository connections = mock(UserConnectionRepository.class);
    private final SocialPostRepository posts = mock(SocialPostRepository.class);
    private final PostLikeRepository likes = mock(PostLikeRepository.class);
    private final PostCommentRepository comments = mock(PostCommentRepository.class);
    private final StorageService storage = mock(StorageService.class);
    private final SocialService service = new SocialService(users, connections, posts, likes, comments,
            storage, mock(WorkoutSessionRepository.class), mock(TrainingSummaryService.class));

    private final User me = user();
    private final User other = user();
    private final SocialPost post = new SocialPost();

    SocialServiceVisibilityTest() {
        when(users.getByEmailOrThrow(EMAIL)).thenReturn(me);
        post.setId(UUID.randomUUID());
        post.setAuthor(other);
        when(posts.findById(post.getId())).thenReturn(Optional.of(post));
    }

    @Test
    void exFriendCannotReadLikeOrCommentPost() {
        when(connections.findPair(me.getId(), other.getId())).thenReturn(Optional.empty());
        UUID id = post.getId();

        assertThrows(EntityNotFoundException.class, () -> service.likePost(EMAIL, id));
        assertThrows(EntityNotFoundException.class, () -> service.unlikePost(EMAIL, id));
        assertThrows(EntityNotFoundException.class, () -> service.listComments(EMAIL, id));
        assertThrows(EntityNotFoundException.class,
                () -> service.addComment(EMAIL, id, new AddCommentRequest("oi")));
        verify(likes, never()).save(any());
        verify(likes, never()).deleteByPostIdAndUserId(any(), any());
        verify(comments, never()).saveAndFlush(any());
        verify(comments, never()).findByPostIdOrderByCreatedAtAsc(any());
    }

    @Test
    void pendingConnectionIsNotEnough() {
        UserConnection pending = new UserConnection();
        pending.setStatus("PENDING");
        when(connections.findPair(me.getId(), other.getId())).thenReturn(Optional.of(pending));
        assertThrows(EntityNotFoundException.class, () -> service.likePost(EMAIL, post.getId()));
    }

    @Test
    void acceptedFriendCanLike() {
        UserConnection accepted = new UserConnection();
        accepted.setStatus("ACCEPTED");
        when(connections.findPair(me.getId(), other.getId())).thenReturn(Optional.of(accepted));
        when(likes.countByPostId(post.getId())).thenReturn(1L);

        assertEquals(1L, service.likePost(EMAIL, post.getId()));
        verify(likes).save(any(PostLike.class));
    }

    @Test
    void ownPostIsVisibleWithoutConnection() {
        post.setAuthor(me);
        service.listComments(EMAIL, post.getId());
        verify(comments).findByPostIdOrderByCreatedAtAsc(post.getId());
    }

    @Test
    void deleteMediaOfAnotherUserIsForbiddenAndDeletesNothing() {
        when(storage.requireOwnMediaKey("posts/x.jpg", me.getId())).thenThrow(new ForbiddenException("x"));
        assertThrows(ForbiddenException.class, () -> service.deleteMedia(EMAIL, "posts/x.jpg"));
        verify(storage, never()).deleteByKey(any());
    }

    // ── StorageService.requireOwnMediaKey (sem HTTP: só valida o formato da key) ──

    @Test
    void ownMediaKeyAcceptsOnlyCallersUploadKeys() {
        StorageService real = new StorageService();
        UUID owner = me.getId();
        String mine = "posts/" + owner + "_" + UUID.randomUUID() + ".jpg";

        assertEquals(mine, real.requireOwnMediaKey(mine, owner));
        assertEquals(mine, real.requireOwnMediaKey("  " + mine + " ", owner));
        assertNull(real.requireOwnMediaKey(" ", owner));

        String theirs = "stories/" + other.getId() + "_" + UUID.randomUUID() + ".png";
        for (String bad : new String[]{
                theirs,
                "posts/" + UUID.randomUUID() + ".jpg",           // key antiga, sem dono
                "/" + mine,
                "posts/../" + mine,
                "avatars/" + owner + "_" + UUID.randomUUID() + ".jpg",
                mine + "?x=1",
                "https://evil.test/storage/v1/object/public/outro-bucket/" + mine}) {
            assertThrows(ForbiddenException.class, () -> real.requireOwnMediaKey(bad, owner), bad);
        }
    }

    private static User user() {
        User u = new User();
        u.setId(UUID.randomUUID());
        return u;
    }
}
