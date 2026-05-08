# 🚀 Plano de Refatoração: Home Screen UI Premium, Sincronização e Migração TypeScript

## 1. Visão Geral
O objetivo é triplo: 
1. Redesenhar a seção superior da Home Screen para replicar fielmente o protótipo de alta fidelidade (Dark UI e card de Check-in polido).
2. Unificar a regra de negócio do cálculo de Eficiência Mensal entre a Home e a StatsScreen.
3. **Migrar a Home Screen completamente para TypeScript**, com tipagem rigorosa e proibição absoluta do uso de `any`.

## 2. Back-end: Regra de Negócio Unificada (Java Spring Boot)
Ambas as telas (Home e Stats) devem consumir os mesmos dados calculados pelo servidor.

**Ação no `StatsService` (ou serviço responsável pelo dashboard):**
1. **Buscar a Meta:** Recuperar a `frequency` (frequência semanal) que o usuário definiu no Onboarding.
2. **Calcular a Meta Mensal (`targetSessions`):** `frequency * 4` (aproximadamente 4 semanas no mês).
3. **Buscar Realizado (`completedSessions`):** Fazer um `count` no `WorkoutSessionRepository` das sessões finalizadas por este usuário dentro do mês atual.
4. **Calcular Eficiência (`efficiencyPercentage`):** `(completedSessions / targetSessions) * 100` (limitado a 100%).
5. **Atualizar o DTO:** Garantir que o endpoint retorne as variáveis `completedSessions`, `targetSessions` e `efficiencyPercentage`.

## 3. 🚨 Diretriz Estrita Front-end: TypeScript e Tipagem
A tela da Home (e seus componentes) deve ser refatorada de `.js` ou `.jsx` para `.tsx`.
- **NÃO UTILIZAR `any` SOB NENHUMA HIPÓTESE.**
- **Criar Interfaces/Types:** Definir as interfaces para o payload da API (ex: `HomeDashboardResponseDTO`), para as Props dos componentes visuais e para os estados locais (useState). Guardar as interfaces globais no arquivo `src/types/index.ts`.

## 4. Front-end: Refatoração da Home Screen UI (.tsx)
Substituir o código atual da seção de progresso pelo visual do protótipo.

### A. Tipografia e Cabeçalho (Header)
- **Subtítulo Topo:** "MONTHLY PROGRESS" (Fonte pequena, uppercase, cor cinza claro `#A0A0A0`, `letterSpacing: 1.5`).
- **Título Principal:** "You're crushing the Kinetic pace." 
  - Usar aninhamento de `<Text>` para deixar "Kinetic" na cor Ciano (`#00FFFF`) e em Itálico, enquanto o resto fica em Branco (`#FFFFFF`) e negrito.
- **Texto Dinâmico:** Consumir os dados tipados da API: `"${completedSessions} out of ${targetSessions} sessions completed this month. Keep the momentum high."` (Cor cinza claro).

### B. Gráfico Donut (react-native-gifted-charts)
- O gráfico deve consumir a variável `efficiencyPercentage`.
- **Cores:** Cor principal em Ciano (`#00FFFF`) e o fundo do rastro em um cinza bem escuro (`#2A2A2A`).
- **Centro do Gráfico (`centerLabelComponent`):** Número grande e em negrito (ex: **70%**) na cor branca, e a palavra "EFFICIENCY" bem pequena embaixo, em cinza claro.

### C. Card de Check-in (Start Workout)
- **Fundo do Card:** Usar um Ciano sofisticado (gradiente de `#00C6FF` para `#0072FF` ou Ciano vibrante com `shadow`). Borda bem arredondada (`borderRadius: 16`).
- **Ícone:** Círculo com leve transparência branca e um "check" no meio.
- **Textos:** "Check-in Now" (Branco, negrito, centralizado) e o subtítulo "Log your current session at the Arena" (Branco com leve transparência).
- **Botão (Call to Action):** Fundo Branco (`#FFFFFF`), formato pílula (`borderRadius: 30`), texto "START WORKOUT" em Ciano escuro ou Preto, pequeno e em negrito.

## 5. Integração StatsScreen
Garantir que a `StatsScreen.tsx` consuma as exatas mesmas variáveis tipadas (`completedSessions`, `targetSessions`, `efficiencyPercentage`) que a Home Screen utiliza, atualizando o texto de apoio para refletir a mesma fração de forma dinâmica.