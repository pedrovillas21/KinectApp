# 🚀 Plano Final: Tracking de Performance, Evolução Mensal e Dashboard de Estatísticas

## 1. Visão Geral
Este plano integra a coleta de dados (séries, reps, carga), o check-in fisiológico mensal (peso) e a transformação desses dados brutos em gráficos visuais na `StatsScreen`. A inteligência de tempo para o check-in será gerenciada pelo Back-end.

## 2. Refatoração do ActiveSessionScreen (Captura de Dados)

### A. Consolidação dos Logs
- Mapear os inputs de cada série para um estado de array de objetos.
- **Payload de Finalização (`POST /api/sessions/log`):**
    ```javascript
    {
      durationInSeconds: number,
      date: "YYYY-MM-DD",
      exercisesLog: [
        { exerciseId: "uuid", setNumber: 1, repsPerformed: 12, weightUsed: 25.5 },
        ...
      ]
    }
    ```

## 3. Inteligência de Check-in e Re-geração (Evolução Mensal)

### A. Fluxo de Gatilho (Backend-Driven)
- O app consulta o back-end (via `GET /api/users/profile` ou endpoint de stats) para verificar o booleano `needsWeightUpdate`.
- Se `true`, exibe o **EvolutionModal**:
    1. **Coleta:** Input do novo peso (com instrução sobre pesagem em jejum).
    2. **Persistência:** `POST /api/users/weight`.
    3. **Ação Proativa:** Pergunta se o usuário deseja gerar uma nova ficha de treino com o peso atualizado e opção de trocar o objetivo.

## 4. Implementação da StatsScreen (Visualização de Dados)

Para que a tela deixe de ser "crua", ela será dividida em três seções principais:

### A. Gráfico de Evolução de Peso (Linear)
- **Fonte:** `GET /api/users/weight-history`.
- **Visualização:** Gráfico de linha mostrando a variação do peso nos últimos meses.
- **Biblioteca Sugerida:** `react-native-chart-kit` ou `react-native-gifted-charts`.

### B. Gráfico de Volume de Carga (Progressive Overload)
- **Lógica:** O back-end soma `reps * weight` de cada sessão.
- **Visualização:** Gráfico de barras comparando o volume total levantado por semana ou por grupo muscular. Isso prova visualmente que o usuário está ficando mais forte.

### C. Círculo de Eficiência Mensal (Consistency)
- **Lógica:** Comparação entre `treinos realizados` vs. `meta de frequência` (ex: 12/16 treinos no mês).
- **Visualização:** Gráfico de progresso circular (Progress Circle) com a porcentagem de eficiência.

## 5. Regras para o Agente da IDE (Full-Stack)

1. **Back-end (Novos Endpoints de Stats):**
   - Criar `GET /api/stats/summary`: Deve retornar a eficiência do mês, o volume total e os dados para o gráfico de peso em um único objeto.
   - Garantir que o cálculo de eficiência use o `frequency` salvo no `User`.

2. **Front-end (Componentização):**
   - Criar componentes de gráfico reutilizáveis para a `StatsScreen`.
   - Implementar um "Estado Zero": Se não houver dados, exibir uma mensagem motivadora: "Seu primeiro gráfico aparecerá após o primeiro treino finalizado!".

3. **Tratamento de Dados:**
   - No React Native, garantir a conversão de vírgula para ponto e o tratamento de `Float` para evitar erros de tipo no Java.