# 🐛 Plano de Debug: Resolução da Quebra Silenciosa na Geração de Treino

## 1. Contexto do Problema
Após atualizar o `WorkoutService` para salvar os dados de Onboarding (`weight`, `height`, `frequency`, etc.) e calcular a idade usando `birthDate`, a geração de treino parou de funcionar.
O console mostra apenas dois `SELECT` do Hibernate (um do Spring Security e outro do Service buscando o User), mas **não realiza nenhum UPDATE no perfil nem INSERT dos treinos**. A transação está sofrendo *rollback* silencioso devido a uma exceção lançada no meio do método.

## 2. Suspeitos Principais
1. **Falha de Parse de Data:** O React Native pode estar enviando o `birthDate` com Timezone (ex: `2026-05-05T12:00...`) e o Jackson no Spring Boot está falhando ao converter para `LocalDate`, gerando um erro antes mesmo de entrar no método.
2. **NullPointerException (NPE) no Cálculo de Idade:** O `birthDate` está chegando nulo e quebrando o `Period.between()`.
3. **Erro de Formatação no Prompt:** Variáveis numéricas nulas sendo injetadas no `String.formatted()` do Gemini, lançando `IllegalFormatException`.

## 3. Ações Exigidas para a IA (Passo a Passo do Debug)

### A. Adicionar Logs de Rastreamento (Tracing)
No `WorkoutService` (ou onde a lógica principal estiver), adicione marcações de log (via `@Slf4j` ou `System.out.println`) em cada passo crítico da transação para descobrirmos exatamente onde o código para de executar:
- Log 1: "Usuário encontrado. Atualizando perfil..."
- Log 2: "Perfil atualizado. Calculando idade com a data: [valor]"
- Log 3: "Idade calculada: [valor]. Montando prompt..."
- Log 4: "Chamando API do Gemini..."
- Log 5: "Resposta do Gemini recebida. Salvando entidades..."

### B. Blindar o Recebimento da Data
No `GenerateWorkoutRequestDto` (ou no DTO equivalente), adicione tratamento explícito para a deserialização da data:
- Adicionar anotação `@JsonFormat(pattern = "yyyy-MM-dd")` ou equivalente sobre o campo `birthDate` para forçar o Jackson a ignorar Timezones e pegar só a data, ou ajustar para aceitar o formato que o React Native estiver mandando.

### C. Expor a Exceção Raiz
No `WorkoutController`, envolva a chamada do serviço em um bloco `try-catch` temporário ou garanta que o seu `@ExceptionHandler` esteja imprimindo a stack trace completa no console.
```java
try {
    List<WorkoutPlanResponseDTO> response = workoutService.generateAndSaveWorkout(request, userEmail);
    return ResponseEntity.status(201).body(response);
} catch (Exception e) {
    System.err.println("❌ ERRO FATAL NA GERAÇÃO: " + e.getClass().getName() + " - " + e.getMessage());
    e.printStackTrace();
    throw e;
}