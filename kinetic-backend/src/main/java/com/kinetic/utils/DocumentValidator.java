package com.kinetic.utils;

public class DocumentValidator {

    public static boolean isValidCPF(String cpf) {
        if (cpf == null) return false;
        // Remove non-digits
        cpf = cpf.replaceAll("\\D", "");

        if (cpf.length() != 11) return false;

        // Check if all digits are the same
        if (cpf.matches("(\\d)\\1{10}")) return false;

        try {
            int sum = 0;
            for (int i = 0; i < 9; i++) {
                sum += (cpf.charAt(i) - '0') * (10 - i);
            }
            int r1 = 11 - (sum % 11);
            int d1 = (r1 == 10 || r1 == 11) ? 0 : r1;

            sum = 0;
            for (int i = 0; i < 10; i++) {
                sum += (cpf.charAt(i) - '0') * (11 - i);
            }
            int r2 = 11 - (sum % 11);
            int d2 = (r2 == 10 || r2 == 11) ? 0 : r2;

            return (cpf.charAt(9) - '0' == d1) && (cpf.charAt(10) - '0' == d2);
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isValidCNPJ(String cnpj) {
        if (cnpj == null) return false;
        // Remove non-digits
        cnpj = cnpj.replaceAll("\\D", "");

        if (cnpj.length() != 14) return false;

        // Check if all digits are the same
        if (cnpj.matches("(\\d)\\1{13}")) return false;

        try {
            int[] weight1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
            int[] weight2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

            int sum = 0;
            for (int i = 0; i < 12; i++) {
                sum += (cnpj.charAt(i) - '0') * weight1[i];
            }
            int r1 = sum % 11;
            int d1 = (r1 < 2) ? 0 : 11 - r1;

            sum = 0;
            for (int i = 0; i < 13; i++) {
                sum += (cnpj.charAt(i) - '0') * weight2[i];
            }
            int r2 = sum % 11;
            int d2 = (r2 < 2) ? 0 : 11 - r2;

            return (cnpj.charAt(12) - '0' == d1) && (cnpj.charAt(13) - '0' == d2);
        } catch (Exception e) {
            return false;
        }
    }
}
