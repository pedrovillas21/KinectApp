package com.kinetic.services;

import com.kinetic.models.SocialPost;
import com.kinetic.repositories.SocialPostRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ExpiredStoryCleanupServiceTest {

    private final SocialPostRepository posts = mock(SocialPostRepository.class);
    private final StorageService storage = mock(StorageService.class);
    private final ExpiredStoryCleanupService service = new ExpiredStoryCleanupService(posts, storage);

    private static SocialPost story(String imageUrl) {
        SocialPost p = new SocialPost();
        p.setId(UUID.randomUUID());
        p.setKind("STORY");
        p.setImageUrl(imageUrl);
        p.setExpiresAt(LocalDateTime.now().minusHours(1));
        return p;
    }

    @Test
    void deletesExpiredStoryRowsThenTheirPhotos() {
        SocialPost withPhoto = story("stories/a.jpg");
        SocialPost withoutPhoto = story(null);
        when(posts.findByKindAndExpiresAtBefore(eq("STORY"), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(withPhoto, withoutPhoto));

        service.purgeExpiredStories();

        // Linha antes da foto: falha no Storage deixa só arquivo órfão, nunca linha sem foto.
        InOrder order = inOrder(posts, storage);
        order.verify(posts).deleteAllByIdInBatch(List.of(withPhoto.getId(), withoutPhoto.getId()));
        order.verify(storage).delete("stories/a.jpg");
        verify(storage, never()).delete(null);
    }

    @Test
    void onlyAsksForStoriesSoNormalPostsAreNeverTouched() {
        when(posts.findByKindAndExpiresAtBefore(anyString(), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of());

        service.purgeExpiredStories();

        verify(posts).findByKindAndExpiresAtBefore(eq("STORY"), any(LocalDateTime.class), any(Pageable.class));
        verify(posts, never()).deleteAllByIdInBatch(any());
        verify(storage, never()).delete(anyString());
    }
}
