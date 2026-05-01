# 🤖 Execução: Integração com Gemini AI e Cadastro de Treinos

## 📌 Objetivo
Implementar a inteligência do Kinetic. O back-end deve ser capaz de gerar fichas de treino personalizadas via Google Gemini API e persisti-las no Supabase.

## 🛠️ Configurações Necessárias
1. **Dependência:** Adicione o cliente HTTP (ex: Spring Reactive Web ou RestTemplate) no `pom.xml`.
2. **Segurança:** Adicione `GOOGLE_AI_API_KEY` ao arquivo `.env`.

## 🏗️ Estrutura de Dados (Entidades JPA)
Crie/Atualize as entidades para suportar o relacionamento:
- `WorkoutPlan` (Ficha): id, nome, objetivo, nivel, data_criacao, user_id.
- `Exercise`: id, nome, series, repeticoes, descanso, observacoes, workout_plan_id.

## 🧠 Serviço de IA (GeminiService)
Crie um serviço que envie um prompt do sistema para a API do Google. O prompt deve exigir que a resposta seja estritamente um **JSON** para que possamos fazer o parse automático.

**Lógica do Prompt:**
- Se `nivel == INICIANTE`: Foco em Resistência/Adaptação Muscular.
- Se `nivel == INTERMEDIARIO`: Foco em Hipertrofia.
- Se `nivel == PRO`: Foco em Alto Rendimento/Força.

## 🚀 Endpoints (WorkoutController)
- `POST /api/workouts/generate`: Recebe o nível do usuário, chama o `GeminiService`, salva a ficha e os exercícios no banco e retorna o objeto completo.
- `GET /api/workouts/my-plans`: Lista as fichas do usuário logado (extraindo ID do token JWT).

## 🛑 Restrições
- A resposta da IA deve ser mapeada para objetos Java (POJOs) antes de salvar.
- Garanta que cada exercício esteja vinculado corretamente ao ID da Ficha gerada.