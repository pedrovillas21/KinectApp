package com.kinetic.utils;

public final class Numbers {

    private Numbers() {
    }

    /** Arredonda para 1 casa decimal. */
    public static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
