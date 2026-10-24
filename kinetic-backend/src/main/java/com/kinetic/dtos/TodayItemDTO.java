package com.kinetic.dtos;

import java.util.UUID;

/**
 * Uma pendência da caixa "Hoje" do personal.
 *
 * @param type       PAGAMENTO, TREINO_HOJE, PREVIA_IA, REAVALIACAO, FICHA_ANTIGA ou CONVITE
 * @param severity   ALTO, MEDIO ou INFO (ordem de exibição)
 * @param studentId  aluno relacionado; nulo em itens sem aluno (ex.: convite)
 * @param title      frase curta ("Mensalidade atrasada")
 * @param detail     complemento ("R$ 150,00 · venceu em 10/10")
 * @param actionPath rota do painel para resolver ("/financeiro", "/students/{id}?aba=treinos")
 *                   ou âncora da página da carteira ("#alertas-de-risco")
 * @param studentPhone celular do aluno para o atalho de WhatsApp (só em TREINO_HOJE)
 */
public record TodayItemDTO(
        String type,
        String severity,
        UUID studentId,
        String studentName,
        String title,
        String detail,
        String actionPath,
        String studentPhone
) {
    public TodayItemDTO(String type, String severity, UUID studentId, String studentName, String title,
                        String detail, String actionPath) {
        this(type, severity, studentId, studentName, title, detail, actionPath, null);
    }
}
