package com.kinetic.services;

import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AvatarServiceTest {

    private static final String EMAIL = "me@test.local";
    private static final String OLD = "https://x.supabase.co/storage/v1/object/public/avatars/u/old.jpg";
    private static final String NEW = "https://x.supabase.co/storage/v1/object/public/avatars/u/new.jpg";

    private final UserRepository users = mock(UserRepository.class);
    private final StorageService storage = mock(StorageService.class);
    private final AvatarService service = new AvatarService(users, storage);
    private final MultipartFile file = mock(MultipartFile.class);
    private final User user = new User();

    @BeforeEach
    void setUp() {
        user.setId(UUID.randomUUID());
        when(users.getByEmailOrThrow(EMAIL)).thenReturn(user);
        when(storage.uploadAvatar(file, user.getId())).thenReturn(NEW);
    }

    @Test
    void replacesThePhotoAndDeletesTheOldOneOnlyAfterSaving() {
        user.setAvatarUrl(OLD);

        assertEquals(NEW, service.updateAvatar(EMAIL, file));

        assertEquals(NEW, user.getAvatarUrl());
        InOrder order = inOrder(users, storage);
        order.verify(users).save(user);
        order.verify(storage).deleteAvatar(OLD);
        verify(storage, never()).deleteAvatar(NEW);
    }

    @Test
    void failedSaveRemovesTheNewUploadAndKeepsTheOldPhoto() {
        user.setAvatarUrl(OLD);
        when(users.save(any(User.class))).thenThrow(new RuntimeException("db down"));

        assertThrows(RuntimeException.class, () -> service.updateAvatar(EMAIL, file));

        verify(storage).deleteAvatar(NEW);
        verify(storage, never()).deleteAvatar(OLD);
    }

    @Test
    void removeClearsTheUrlAndDeletesTheFile() {
        user.setAvatarUrl(OLD);

        service.removeAvatar(EMAIL);

        assertNull(user.getAvatarUrl());
        verify(users).save(user);
        verify(storage).deleteAvatar(OLD);
    }

    @Test
    void removeWithoutPhotoDoesNothing() {
        service.removeAvatar(EMAIL);

        verify(users, never()).save(any(User.class));
        verify(storage, never()).deleteAvatar(anyString());
    }
}
