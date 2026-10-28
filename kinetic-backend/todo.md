## IA: migrar do Gemini para o Claude Haiku 5.5 (decidido em 16/10/2026, ainda não feito)
- Modelo: claude-haiku-5-5 (US$ 0,10 / US$ 0,50 por milhão de tokens de entrada/saída em prompts até 100K).
- Pagamento: créditos mensais de API da assinatura Claude Max (US$ 100/mês no Max 5x; vencem no ciclo, não acumulam).
  Docs: https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers
- Onde: GeminiService (usado por WorkoutService e TrainerAiPlanService). Usar o SDK Java oficial (com.anthropic:anthropic-java).
- Cuidados: structured outputs para o JSON; effort baixo; gravar tokens por chamada para recalibrar as cotas (BillingPlan);
  saldo reserva com recarga automática no Console; workspace próprio com limite de gasto.
