package com.kinetic.utils;

/**
 * Layout HTML dos e-mails transacionais com a identidade do Kinetic (fundo escuro,
 * ciano #00E5FF, logo em barras). Feito com tabelas e estilos inline, que é o que
 * Gmail, Outlook e Apple Mail renderizam de forma consistente; sem SVG nem imagem
 * externa, então a logo aparece mesmo com imagens bloqueadas.
 */
public final class EmailTemplates {

    private static final String CYAN = "#00E5FF";
    private static final String BG = "#0B0B0B";
    private static final String CARD = "#161616";
    private static final String BORDER = "#2A2A2A";
    private static final String TEXT = "#FFFFFF";
    private static final String TEXT_DIM = "#A0A0A0";
    private static final String TEXT_MUTED = "#6B6B6B";
    private static final String FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

    private EmailTemplates() {
    }

    /**
     * E-mail com código de verificação.
     *
     * @param preheader  resumo que aparece ao lado do assunto na caixa de entrada
     * @param title      título grande do corpo
     * @param intro      frase antes do código (texto puro, é escapado)
     * @param footnote   aviso final do tipo "se não foi você, ignore" (texto puro)
     */
    public static String codeEmail(String nome, String preheader, String title, String intro,
                                   String code, long ttlMinutes, String footnote) {
        return "<!DOCTYPE html><html lang=\"pt-BR\"><head><meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<meta name=\"color-scheme\" content=\"dark\"><meta name=\"supported-color-schemes\" content=\"dark\">"
                + "<title>" + escape(title) + "</title></head>"
                + "<body style=\"margin:0;padding:0;background:" + BG + ";\">"
                // Preheader: invisível no corpo, aparece na prévia da caixa de entrada.
                + "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;\">"
                + escape(preheader) + "</div>"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"background:" + BG + ";\"><tr><td align=\"center\" style=\"padding:40px 16px;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"max-width:520px;\">"

                // Logo
                + "<tr><td style=\"padding:0 4px 24px;\">" + logo() + "</td></tr>"

                // Cartão
                + "<tr><td style=\"background:" + CARD + ";border:1px solid " + BORDER + ";border-radius:16px;"
                + "border-top:3px solid " + CYAN + ";padding:36px 32px;font-family:" + FONT + ";\">"
                + "<h1 style=\"margin:0 0 20px;font-size:24px;line-height:1.25;font-weight:800;color:" + TEXT + ";\">"
                + escape(title) + "</h1>"
                + "<p style=\"margin:0 0 8px;font-size:15px;line-height:1.6;color:" + TEXT + ";\">Olá"
                + escape(greetingName(nome)) + ",</p>"
                + "<p style=\"margin:0 0 24px;font-size:15px;line-height:1.6;color:" + TEXT_DIM + ";\">"
                + escape(intro) + "</p>"

                // Código
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
                + "<tr><td align=\"center\" style=\"background:#0F2A2E;border:1px solid #14535C;border-radius:12px;"
                + "padding:22px 12px;\">"
                + "<div style=\"font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:36px;"
                + "font-weight:700;letter-spacing:10px;color:" + CYAN + ";padding-left:10px;\">" + escape(code) + "</div>"
                + "</td></tr></table>"

                + "<p style=\"margin:20px 0 0;font-size:13px;line-height:1.6;color:" + TEXT_DIM + ";\">"
                + "O código vale por <strong style=\"color:" + TEXT + ";\">" + ttlMinutes + " minutos</strong> "
                + "e só pode ser usado uma vez. Nunca compartilhe com ninguém, nem com a equipe Kinetic.</p>"

                + "<hr style=\"border:none;border-top:1px solid " + BORDER + ";margin:28px 0 20px;\">"
                + "<p style=\"margin:0;font-size:12px;line-height:1.6;color:" + TEXT_MUTED + ";\">"
                + escape(footnote) + "</p>"
                + "</td></tr>"

                // Rodapé
                + "<tr><td align=\"center\" style=\"padding:24px 16px 0;font-family:" + FONT + ";font-size:12px;"
                + "line-height:1.6;color:" + TEXT_MUTED + ";\">"
                + "Kinetic · Treine mais alunos, com menos esforço.<br>"
                + "Este é um e-mail automático; respostas não são lidas."
                + "</td></tr>"

                + "</table></td></tr></table></body></html>";
    }

    /** Versão em texto puro, para clientes que não mostram HTML. */
    public static String codeText(String nome, String intro, String code, long ttlMinutes, String footnote) {
        return "Olá" + greetingName(nome) + ",\n\n"
                + intro + "\n\n"
                + "    " + code + "\n\n"
                + "O código vale por " + ttlMinutes + " minutos e só pode ser usado uma vez. "
                + "Nunca compartilhe com ninguém.\n\n"
                + footnote + "\n\n"
                + "— Kinetic";
    }

    private static final String CREDENTIALS_NOTE = "No primeiro acesso você vai cadastrar um app autenticador "
            + "(Authy, Google Authenticator ou Microsoft Authenticator): depois disso, além da senha, o login pede "
            + "o código de 6 dígitos do app. Guarde esta senha num lugar seguro e apague este e-mail.";

    /**
     * Acesso de uma conta de gestão criada por outra pessoa (dono pelo ROOT, filial pelo
     * dono): usuário e senha gerada. A senha sozinha não entra: falta o app autenticador.
     */
    public static String credentialsEmail(String nome, String title, String intro, String login, String password,
                                          String panelUrl) {
        return "<!DOCTYPE html><html lang=\"pt-BR\"><head><meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<meta name=\"color-scheme\" content=\"dark\"><meta name=\"supported-color-schemes\" content=\"dark\">"
                + "<title>" + escape(title) + "</title></head>"
                + "<body style=\"margin:0;padding:0;background:" + BG + ";\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"background:" + BG + ";\"><tr><td align=\"center\" style=\"padding:40px 16px;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"max-width:520px;\">"
                + "<tr><td style=\"padding:0 4px 24px;\">" + logo() + "</td></tr>"
                + "<tr><td style=\"background:" + CARD + ";border:1px solid " + BORDER + ";border-radius:16px;"
                + "border-top:3px solid " + CYAN + ";padding:36px 32px;font-family:" + FONT + ";\">"
                + "<h1 style=\"margin:0 0 20px;font-size:24px;line-height:1.25;font-weight:800;color:" + TEXT + ";\">"
                + escape(title) + "</h1>"
                + "<p style=\"margin:0 0 8px;font-size:15px;line-height:1.6;color:" + TEXT + ";\">Olá"
                + escape(greetingName(nome)) + ",</p>"
                + "<p style=\"margin:0 0 24px;font-size:15px;line-height:1.6;color:" + TEXT_DIM + ";\">"
                + escape(intro) + "</p>"
                + credentialRow("Usuário", login)
                + credentialRow("Senha", password)
                + "<p style=\"margin:20px 0 0;font-size:13px;line-height:1.6;color:" + TEXT_DIM + ";\">"
                + "Acesse em <a href=\"" + escape(panelUrl) + "\" style=\"color:" + CYAN + ";\">" + escape(panelUrl)
                + "</a>.</p>"
                + "<hr style=\"border:none;border-top:1px solid " + BORDER + ";margin:28px 0 20px;\">"
                + "<p style=\"margin:0;font-size:12px;line-height:1.6;color:" + TEXT_MUTED + ";\">"
                + escape(CREDENTIALS_NOTE) + "</p>"
                + "</td></tr>"
                + "<tr><td align=\"center\" style=\"padding:24px 16px 0;font-family:" + FONT + ";font-size:12px;"
                + "line-height:1.6;color:" + TEXT_MUTED + ";\">"
                + "Kinetic · Treine mais alunos, com menos esforço.<br>"
                + "Este é um e-mail automático; respostas não são lidas."
                + "</td></tr>"
                + "</table></td></tr></table></body></html>";
    }

    public static String credentialsText(String nome, String intro, String login, String password, String panelUrl) {
        return "Olá" + greetingName(nome) + ",\n\n"
                + intro + "\n\n"
                + "    Usuário: " + login + "\n"
                + "    Senha:   " + password + "\n\n"
                + "Acesse em " + panelUrl + "\n\n"
                + CREDENTIALS_NOTE + "\n\n"
                + "— Kinetic";
    }

    private static String credentialRow(String label, String value) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"margin-bottom:10px;\"><tr><td style=\"background:#0F2A2E;border:1px solid #14535C;"
                + "border-radius:12px;padding:14px 16px;\">"
                + "<div style=\"font-family:" + FONT + ";font-size:12px;color:" + TEXT_DIM + ";\">" + escape(label) + "</div>"
                + "<div style=\"font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:18px;"
                + "font-weight:700;color:" + CYAN + ";word-break:break-all;\">" + escape(value) + "</div>"
                + "</td></tr></table>";
    }

    // As três barras inclinadas da marca, desenhadas com células de tabela.
    private static String logo() {
        return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>"
                + bar(CYAN) + bar("#00A3B5") + bar("#00616B")
                + "<td style=\"padding-left:12px;font-family:" + FONT + ";font-size:20px;font-weight:800;"
                + "font-style:italic;letter-spacing:2px;color:" + TEXT + ";\">KINETIC</td>"
                + "</tr></table>";
    }

    private static String bar(String color) {
        return "<td style=\"padding-right:4px;\"><div style=\"width:6px;height:20px;background:" + color + ";"
                + "border-radius:1px;transform:skewX(-20deg);\"></div></td>";
    }

    private static String greetingName(String nome) {
        return (nome == null || nome.isBlank()) ? "" : " " + nome.trim();
    }

    public static String escape(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
