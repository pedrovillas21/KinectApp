package com.kinetic.services;

import com.kinetic.dtos.SetLogDto;
import com.kinetic.enums.LoadType;
import com.kinetic.models.Exercise;
import com.kinetic.models.User;
import com.kinetic.utils.SetLimits;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SetLoadRulesTest {

    @Test
    void infersLoadTypeFromTheAiLabels() {
        assertEquals(LoadType.BODYWEIGHT, LoadType.infer("Peso corporal (RPE 8)"));
        assertEquals(LoadType.BODYWEIGHT, LoadType.infer("Colete 10kg (RPE 7)"));
        assertEquals(LoadType.NONE, LoadType.infer("Sem carga (RPE 3-4)"));
        assertEquals(LoadType.EXTERNAL, LoadType.infer("Halteres de 24kg (RPE 8)"));
        assertEquals(LoadType.EXTERNAL, LoadType.infer(null));
    }

    @Test
    void declaredLoadTypeWinsAndInvalidFallsBackToLabel() {
        assertEquals(LoadType.BODYWEIGHT, LoadType.resolve("bodyweight", "Halteres 10kg"));
        assertEquals(LoadType.NONE, LoadType.resolve("QUALQUER", "Sem carga"));
    }

    @Test
    void rejectsHumanlyImpossibleCombinations() {
        assertFalse(SetLimits.isPlausible(500, 99));
        assertFalse(SetLimits.isPlausible(150, 100));
        assertTrue(SetLimits.isPlausible(300, 20));   // leg press pesado
        assertTrue(SetLimits.isPlausible(0, 100));
    }

    @Test
    void bodyweightSetUsesTheStudentsWeightPlusExtraLoad() {
        User user = new User();
        user.setWeight(80.0);
        assertEquals(80.0, WorkoutSessionService.effectiveWeight(exercise(LoadType.BODYWEIGHT), user, set(12, 0)));
        assertEquals(90.0, WorkoutSessionService.effectiveWeight(exercise(LoadType.BODYWEIGHT), user, set(8, 10)));
        assertEquals(0.0, WorkoutSessionService.effectiveWeight(exercise(LoadType.NONE), user, set(10, 40)));
        assertEquals(40.0, WorkoutSessionService.effectiveWeight(exercise(LoadType.EXTERNAL), user, set(10, 40)));
    }

    @Test
    void impossibleSetIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> WorkoutSessionService.effectiveWeight(exercise(LoadType.EXTERNAL), new User(), set(99, 500)));
    }

    private static Exercise exercise(LoadType type) {
        Exercise e = new Exercise();
        e.setName("Teste");
        e.setLoadType(type);
        return e;
    }

    private static SetLogDto set(int reps, double weight) {
        return new SetLogDto(UUID.randomUUID(), 1, reps, weight);
    }
}
