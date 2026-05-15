# Plano de Refatoração: Home Screen & Fluxo de Treino (Kinetic App)

Este documento serve como guia técnico para a refatoração da tela inicial e da lógica de progressão de treinos. O objetivo é transformar a Home em um dashboard dinâmico que reflete o estado real do usuário e segue o padrão visual Premium (Dark Mode + Ciano).

---

## 1. Back-end: Inteligência e Persistência (Java Spring Boot)

### 1.1. Status de Onboarding do Usuário
* **Tarefa:** Adicionar campo `Boolean workoutOnboardingCompleted` na entidade `User`.
* **Objetivo:** Permitir que o Front-end saiba se deve mostrar o convite para gerar o primeiro treino ou o Dashboard completo.
* **Endpoint:** Garantir que o `GET /api/user/profile` (ou similar) retorne esta flag.

### 1.2. Lógica de "Próxima Ficha Disponível"
* **Conceito:** O treino exibido na Home não deve ser estático por dia da semana, mas sim o **próximo treino não realizado** do plano atual.
* **Implementação:**
    * Criar endpoint `GET /api/workouts/next-pending`.
    * **Lógica:**
        1. Buscar o plano de treino atual do usuário (Ex: Push/Pull/Legs).
        2. Cruzar com a tabela de logs de execução (`WorkoutExecutionLog`).
        3. Retornar o primeiro treino do ciclo que não foi marcado como "Concluído" recentemente.
        4. Caso todos tenham sido concluídos, reiniciar o ciclo.

---

## 2. Front-end: UI/UX e Navegação (React Native + TS)

### 2.1. Reestruturação da Navegação
* **Tarefa:** Remover o componente de **Barra Lateral (Drawer Navigation)**.
* **Configuração:** Centralizar toda a navegação na **Bottom Tab Bar** (Home, Treinar, Stats, Social, Perfil).

### 2.2. Lógica de Redirecionamento (Conditional Rendering)
Na `HomeScreen.tsx`, implementar a verificação do status de onboarding:
- Se `workoutOnboardingCompleted == false`: Exibir Card de convite (Image 0).
- Se `workoutOnboardingCompleted == true`: Exibir Dashboard (Image 3).

### 2.3. Refatoração Visual do Dashboard (Design Premium)
* **Card de Treino:** * Consumir dados do novo endpoint `next-pending`.
    * Aplicar botão estilo "Pílula" (`borderRadius: 30`) em Ciano (#00FFFF).
* **Gráfico de Atividade da Semana:**
    * Substituir o gráfico atual pelo `BarChart` da `react-native-gifted-charts`.
    * **Specs:** Barras com cantos arredondados no topo (`roundedTop`), degradê ciano, e rótulos de tempo (min) acima das barras.
* **Leaderboard (Ranking da Arena):**
    * Atualizar o design para o novo padrão: cards com fundo cinza escuro, avatares circulares e indicadores de tendência.
    * Destacar o card do usuário atual ("Você") com tipografia Itálica e Ciano.

---

## 3. Checklist de Implementação

- [ ] **[BE]** Adicionar flag `workoutOnboardingCompleted` ao User.
- [ ] **[BE]** Criar Service/Controller para buscar o próximo treino pendente.
- [ ] **[FE]** Limpar navegação (remover Sidebar).
- [ ] **[FE]** Criar componente `OnboardingPrompt` para usuários sem treino.
- [ ] **[FE]** Atualizar `BarChart` para design de barras arredondadas e degradê.
- [ ] **[FE]** Aplicar tipografia Itálico/Ciano em nomes de destaque.
- [ ] **[FE]** Vincular botão "Começar Treino" à ficha dinâmica recebida do back-end.

---
**Diretriz Visual:** Manter fundo `#121212`, destaque Ciano `#00FFFF` e evitar qualquer componente que bloqueie a fluidez da Bottom Bar.
