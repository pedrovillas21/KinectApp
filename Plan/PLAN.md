# 🚀 Plano de Implementação: Blindagem de Dados, UX e Dashboard de Performance

## 1. Visão Geral
Este plano estabelece a "fiação" completa entre o Front-end (React Native em TypeScript) e o Back-end (Spring Boot), focando na validação rigorosa de dados de treino, gestão de sessões parciais e visualização de progresso.

## 2. Refatoração Back-end: Blindagem de Dados (Java)
**Objetivo:** Garantir que a API nunca aceite dados "sujos", mesmo que o Front-end seja burlado.

### A. Atualização do `SetLogDto.java`
- **Repetições:** Adicionar `@Min(value = 1, message = "A série deve ter pelo menos 1 repetição")`.
- **Peso:** Adicionar `@PositiveOrZero(message = "O peso não pode ser negativo")` (para permitir 0kg em exercícios de peso corporal).
- **Série:** Adicionar `@Min(1)`.
- **Validação:** Garantir que o `WorkoutSessionController` utiliza a anotação `@Valid` no corpo da requisição.

## 3. Refatoração Front-end: ActiveSessionScreen.tsx (UX e Validações)
**Objetivo:** Implementar a estratégia "Fail Fast" (falhar rápido) para educar o utilizador e evitar erros de rede.

### A. Validação Individual de Série (Botão Check)
- **Ação:** Intercetar a função `onPress` do ícone de confirmação da série.
- **Lógica:**
    1. Validar `numericReps`: Se for `< 1` ou `NaN`, disparar `Alert.alert("Série Incompleta", "Insira pelo menos 1 repetição.")`.
    2. Validar `numericWeight`: Se for `< 0`, disparar `Alert.alert("Peso Inválido", "O peso não pode ser negativo. Use 0 para peso do corpo.")`.
    3. Bloquear a marcação visual (ícone azul) enquanto os dados não forem válidos.

### B. Novo Botão: "Sair da Sessão" (Texto Cinzento)
- **Função:** Permitir a interrupção do treino a qualquer momento.
- **UX:** Ao clicar, disparar um Pop-up (Alert):
    - **Título:** "Tem a certeza que deseja sair?"
    - **Mensagem:** "O seu treino será encerrado. Apenas as séries marcadas como concluídas serão guardadas no seu histórico."
- **Lógica de Gravação Parcial:**
    - Se `completedSets.length > 0`: Faz o `api.post` com os dados parciais e navega para a Home.
    - Se `completedSets.length === 0`: Apenas navega para a Home (descarta a sessão vazia para evitar "lixo" no banco de dados).

### C. Botão Principal: "FINALIZAR TREINO" (Ciano)
- **Lógica:** Filtrar apenas séries com `isCompleted === true`.
- **Trava:** Se não houver séries marcadas, impedir o envio e avisar o utilizador.

## 4. StatsScreen e Evolução Mensal (TypeScript & Gifted Charts)
**Objetivo:** Transformar dados em motivação visual.

### A. Dashboards Visuais (StatsScreen.tsx)
- **Gráfico de Eficiência:** Progress Circle (Donut) comparando treinos realizados vs. meta mensal.
- **Gráfico de Peso:** Gráfico de Linha (`LineChart`) consumindo o `WeightHistory`.
- **Gráfico de Volume:** Gráfico de Barras agrupado por **Grupo Muscular na Semana**.

### B. EvolutionModal.tsx (Gatilho de 30 dias)
- **Lógica:** O Back-end envia `needsWeightUpdate: true` se o último registo de peso tiver mais de 30 dias.
- **Fluxo:** Peso Atualizado -> Pergunta sobre Re-geração de Treino -> Chamada à API do Gemini para nova ficha com dados novos.

## 5. Diretrizes Técnicas para o Agente (IDE)
- **Typescript:** Todas as interfaces devem estar em `src/types/index.ts`. Refatorar ficheiros `.js` para `.tsx`.
- **Parsing:** Utilizar `.replace(',', '.')` em todos os campos de peso antes de converter para `float`.
- **Segurança:** A identidade do utilizador deve ser extraída estritamente do JWT no Back-end; nunca enviar `userId` no corpo do JSON.
- **UI:** Utilizar a biblioteca `react-native-gifted-charts` para os gráficos.