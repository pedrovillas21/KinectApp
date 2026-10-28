package com.kinetic.services;

import com.kinetic.dtos.CompareProgressDTO;
import com.kinetic.dtos.PersonalRecordDTO;
import com.kinetic.dtos.PublicProfileDTO;
import com.kinetic.exceptions.ForbiddenException;
import com.kinetic.models.User;
import com.kinetic.repositories.SocialPostRepository;
import com.kinetic.repositories.UserConnectionRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PublicProfileServiceTest {

    private static final String EMAIL = "me@test.local";

    private final SocialService social = mock(SocialService.class);
    private final TrainingSummaryService summary = mock(TrainingSummaryService.class);
    private final SocialPostRepository posts = mock(SocialPostRepository.class);
    private final UserConnectionRepository connections = mock(UserConnectionRepository.class);
    private final WorkoutSessionRepository sessions = mock(WorkoutSessionRepository.class);
    private final PublicProfileService service =
            new PublicProfileService(social, summary, posts, connections, sessions);

    private final User me = user("Eu");
    private final User other = user("Outro");

    PublicProfileServiceTest() {
        when(social.findByEmail(EMAIL)).thenReturn(me);
        when(social.findById(other.getId())).thenReturn(other);
        when(summary.lastWeekStarts()).thenReturn(List.of(LocalDate.of(2026, 10, 11)));
    }

    @Test
    void compareWithSelfIsBadRequest() {
        assertThrows(IllegalArgumentException.class, () -> service.compare(EMAIL, me.getId()));
    }

    @Test
    void compareWithoutAcceptedFriendshipIsForbidden() {
        when(social.canSeeActivity(me, other)).thenReturn(false);
        assertThrows(ForbiddenException.class, () -> service.compare(EMAIL, other.getId()));
    }

    @Test
    void compareWithFriendReturnsOnlySharedRecords() {
        when(social.canSeeActivity(me, other)).thenReturn(true);
        Map<String, PersonalRecordDTO> mine = new LinkedHashMap<>();
        mine.put("supino reto", new PersonalRecordDTO("Supino Reto", 80, 5, LocalDate.now()));
        mine.put("rosca", new PersonalRecordDTO("Rosca", 20, 10, LocalDate.now()));
        Map<String, PersonalRecordDTO> theirs = new LinkedHashMap<>();
        theirs.put("supino reto", new PersonalRecordDTO("supino reto", 90, 3, LocalDate.now()));
        when(summary.personalRecordsByKey(me.getId())).thenReturn(mine);
        when(summary.personalRecordsByKey(other.getId())).thenReturn(theirs);

        CompareProgressDTO dto = service.compare(EMAIL, other.getId());

        assertEquals(1, dto.sharedPrs().size());
        assertEquals("Supino Reto", dto.sharedPrs().get(0).exercise());
        assertEquals(80, dto.sharedPrs().get(0).me().weightKg());
        assertEquals(90, dto.sharedPrs().get(0).friend().weightKg());
        assertEquals(me.getId(), dto.me().id());
        assertEquals(other.getId(), dto.friend().id());
    }

    @Test
    void profileOfNonFriendIsLockedWithoutActivity() {
        when(social.canSeeActivity(me, other)).thenReturn(false);
        when(social.connectionState(me, other)).thenReturn("NONE");

        PublicProfileDTO dto = service.getProfile(EMAIL, other.getId());

        assertTrue(dto.locked());
        assertFalse(dto.isMe());
        assertEquals("NONE", dto.connectionState());
        assertTrue(dto.weeklyMinutes().isEmpty());
        assertTrue(dto.records().isEmpty());
        assertTrue(dto.achievements().isEmpty());
        verify(summary, never()).personalRecords(other.getId());
    }

    @Test
    void ownProfileIsSelfAndUnlocked() {
        when(social.findById(me.getId())).thenReturn(me);
        when(social.canSeeActivity(me, me)).thenReturn(true);

        PublicProfileDTO dto = service.getProfile(EMAIL, me.getId());

        assertFalse(dto.locked());
        assertTrue(dto.isMe());
        assertEquals("SELF", dto.connectionState());
    }

    @Test
    void workoutsOfNonFriendAreForbidden() {
        doThrow(new ForbiddenException("x")).when(social).ensureCanSeeActivity(me, other);
        assertThrows(ForbiddenException.class,
                () -> service.getUserWorkouts(EMAIL, other.getId(), PageRequest.of(0, 10)));
    }

    private static User user(String name) {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setNome(name);
        return u;
    }
}
