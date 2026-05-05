# ⏱️ Plano de Implementação: Check-in Dinâmico e Tracking Mensal

## 1. Visão Geral
Transformar a tela de Check-in/Tracking (atualmente estática) em uma interface interativa com cronômetro em tempo real e barra de progresso circular dinâmica. A meta mensal do usuário deve ser calculada baseada na `frequency` (dias por semana) informada no Onboarding.

## 2. Regras de Negócio e Lógica Matemática
- **Meta Mensal (Target):** Frequência semanal selecionada no Onboarding multiplicada por 4 semanas (ex: Frequência 5x/semana = Meta de 20 treinos no mês).
- **Eficiência (%):** `(Treinos Concluídos no Mês / Meta Mensal) * 100`. O limite visual do círculo é 100%, mas o usuário pode ultrapassar a meta (ex: 110%).
- **Cronômetro:** Inicia do zero (00:00:00 - HH:mm:ss). Ao finalizar, o tempo total em segundos deve ser enviado ao Back-end junto com a data atual.

## 3. Back-end (Spring Boot 3.2.x - Java 17)

### A. Nova Entidade e Tabela (`WorkoutSession`)
- Criar entidade `WorkoutSession` com os campos: `id`, `user` (ManyToOne), `durationInSeconds` (Integer), `sessionDate` (LocalDate).
- **Proibido** o uso de `@Data`. Usar `@Getter`, `@Setter` e construtores apropriados.

### B. Novo Endpoint de Registro
- `POST /api/sessions/log`
- **Payload:** `{ "durationInSeconds": 3600, "date": "2026-05-05" }`
- **Ação:** Identificar o usuário pelo JWT (SecurityContext), instanciar um `WorkoutSession` e salvar no Supabase via JPA.

### C. Novo Endpoint de Estatísticas
- `GET /api/sessions/monthly-stats`
- **Ação:** 1. Buscar a `frequency` salva no perfil do usuário logado.
  2. Calcular a `targetSessions` (frequency * 4).
  3. Contar quantas `WorkoutSession` existem para este usuário no mês/ano atual (`completedSessions`).
  4. Retornar DTO: `{ "completedSessions": 14, "targetSessions": 20, "efficiency": 70 }`.

## 4. Front-end (React Native)

### A. Gerenciamento de Estado (useState)
- `isActive` (boolean): Controla se o cronômetro está rodando.
- `seconds` (number): Armazena o tempo decorrido.
- `stats` (object): Armazena os dados vindos do `GET /monthly-stats`.

### B. Hook do Cronômetro (useEffect)
- Implementar um `setInterval` que incrementa o estado `seconds` a cada 1000ms apenas quando `isActive` for `true`.
- Criar uma função auxiliar para formatar os segundos no padrão `HH:mm:ss` para exibição na tela.

### C. Atualização da UI (Design Existente)
- **Botão:** O botão "INICIAR TEMPO" deve mudar o texto para "FINALIZAR TREINO" (e talvez mudar para uma cor de alerta, como vermelho ou laranja) quando `isActive` for true.
- **Gráfico Circular:** Substituir o valor estático de "70%" pela variável `stats.efficiency`. (Garantir que a biblioteca de SVG/Gráfico aceite a variável dinamicamente).
- **Legenda:** Substituir "14 out of 20 sessions..." por uma interpolação: `${stats.completedSessions} out of ${stats.targetSessions} sessions completed this month`.

### D. Integração (Axios)
1. Ao montar a tela (`useEffect` vazio), chamar `GET /api/sessions/monthly-stats` para popular o gráfico.
2. Ao clicar em "FINALIZAR TREINO", dar um `clearInterval`, disparar o `POST /api/sessions/log` com o tempo total, resetar o cronômetro e refazer o `GET` para atualizar o gráfico circular imediatamente.