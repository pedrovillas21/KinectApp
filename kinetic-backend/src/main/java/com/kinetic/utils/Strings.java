package com.kinetic.utils;

public final class Strings {

    private Strings() {
    }

    /** Texto aparado, ou {@code null} quando vier nulo ou só com espaços. */
    public static String trimOrNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
