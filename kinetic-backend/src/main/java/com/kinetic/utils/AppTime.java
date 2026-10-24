package com.kinetic.utils;

import java.time.LocalDate;
import java.time.ZoneId;

/** "Hoje" é o dia no Brasil, não o do servidor (que roda em UTC no Docker e virava o dia 3h antes). */
public final class AppTime {

    public static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

    private AppTime() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }
}
