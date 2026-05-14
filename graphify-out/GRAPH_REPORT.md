# Graph Report - KinectApp  (2026-05-14)

## Corpus Check
- 105 files · ~40,707 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 511 nodes · 680 edges · 59 communities (40 shown, 19 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `818e8347`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend Core & Auth UI|Frontend Core & Auth UI]]
- [[_COMMUNITY_Stats & Dashboard Types|Stats & Dashboard Types]]
- [[_COMMUNITY_Backend Auth & User Mgmt|Backend Auth & User Mgmt]]
- [[_COMMUNITY_Stats Service & Periods|Stats Service & Periods]]
- [[_COMMUNITY_Workout Sessions & Community Stats|Workout Sessions & Community Stats]]
- [[_COMMUNITY_Home Screen & Evolution Modal|Home Screen & Evolution Modal]]
- [[_COMMUNITY_Workout Planning & Plans|Workout Planning & Plans]]
- [[_COMMUNITY_JWT Security & Auth Filters|JWT Security & Auth Filters]]
- [[_COMMUNITY_Gemini AI Service|Gemini AI Service]]
- [[_COMMUNITY_Social Feed & Mock Data|Social Feed & Mock Data]]
- [[_COMMUNITY_Exercise Logging DTOs|Exercise Logging DTOs]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]

## God Nodes (most connected - your core abstractions)
1. `COLORS` - 23 edges
2. `ThemeContext` - 20 edges
3. `JwtUtil` - 10 edges
4. `AuthContext` - 10 edges
5. `StatsService` - 8 edges
6. `formatNumberPtBR()` - 7 edges
7. `Design System Specification: High-Performance Athleticism` - 7 edges
8. `SecurityConfig` - 6 edges
9. `WorkoutService` - 6 edges
10. `🚀 Plano de Implementação: Blindagem de Dados, UX e Dashboard de Desempenho` - 6 edges

## Surprising Connections (you probably didn't know these)
- `DeltaChip()` --calls--> `formatNumberPtBR()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts
- `WeightCard()` --calls--> `periodDescription()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts
- `WeightCard()` --calls--> `formatNumberPtBR()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts
- `VolumeCard()` --calls--> `formatTotalVolume()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts
- `VolumeCard()` --calls--> `formatVolumeKg()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts

## Communities (59 total, 19 thin omitted)

### Community 0 - "Frontend Core & Auth UI"
Cohesion: 0.07
Nodes (25): styles, styles, styles, styles, styles, styles, styles, styles (+17 more)

### Community 1 - "Stats & Dashboard Types"
Cohesion: 0.07
Nodes (39): CardHeaderProps, chipStyles, ConsistencyCardProps, consistencyStyles, DeltaChip(), DeltaChipProps, InsightBlockProps, insightStyles (+31 more)

### Community 2 - "Backend Auth & User Mgmt"
Cohesion: 0.07
Nodes (8): AuthController, UserController, UserRepository, WeightHistoryRepository, CustomUserDetailsService, AuthService, UserService, UserDetailsService

### Community 3 - "Stats Service & Periods"
Cohesion: 0.07
Nodes (8): WorkoutController, WorkoutPlanRepository, WorkoutService, DATA, Icons, INSIGHTS, PERIODS, T

### Community 4 - "Workout Sessions & Community Stats"
Cohesion: 0.06
Nodes (22): AuthContextValue, DAYS_LABELS, GEN_STEPS, GOAL_API_MAP, GoalDef, GOALS, GoalType, LEVEL_API_MAP (+14 more)

### Community 5 - "Home Screen & Evolution Modal"
Cohesion: 0.07
Nodes (10): AGES, DAYS, DEFAULT_FORM, GOALS, HEIGHTS, K, LEVELS, STEPS (+2 more)

### Community 6 - "Workout Planning & Plans"
Cohesion: 0.13
Nodes (12): endDate(), fromString(), id(), insightTag(), previousEndDate(), previousStartDate(), startDate(), targetSessions() (+4 more)

### Community 7 - "JWT Security & Auth Filters"
Cohesion: 0.08
Nodes (16): EvolutionModalProps, styles, styles, SetData, styles, EMPTY_DASHBOARD, HomeScreenProps, LeaderboardEntry (+8 more)

### Community 8 - "Gemini AI Service"
Cohesion: 0.11
Nodes (17): 1. Overview & Creative North Star: "The Digital Kineticist", 2. Colors: Tonal Depth & The Neon Pulse, 3. Typography: Editorial Authority, 4. Elevation & Depth: Tonal Layering, 5. Components: The Athletic Kit, 6. Do’s and Don’ts, Buttons (The Kinetic Drivers), Cards & Lists (The Performance Modules) (+9 more)

### Community 9 - "Social Feed & Mock Data"
Cohesion: 0.14
Nodes (3): WorkoutSessionRepository, CommunityStatsService, WorkoutSessionService

### Community 10 - "Exercise Logging DTOs"
Cohesion: 0.24
Nodes (3): OncePerRequestFilter, JwtAuthenticationFilter, JwtUtil

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (6): json(), of(), getText(), RuntimeException, GeminiService, InvalidGeminiResponseException

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Refatoração Back-end: Blindagem de Dados (Java), 3. Refatoração Front-end: ActiveSessionScreen.tsx (UX e Validações), 4. StatsScreen e Evolução Mensal (TypeScript & Gifted Charts), 5. Diretrizes Técnicas para o Agente (IDE), A. Atualização do `SetLogDto.java`, A. Dashboards Visuais (StatsScreen.tsx), A. Validação Individual de Série (Botão Check) (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Regras de Negócio e Lógica Matemática, 3. Back-end (Spring Boot 3.2.x - Java 17), 4. Front-end (React Native), A. Gerenciamento de Estado (useState), A. Nova Entidade e Tabela (`WorkoutSession`), B. Hook do Cronômetro (useEffect), B. Novo Endpoint de Registro (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (10): 1. Back-end: Ajuste na Entidade `User` (JPA/Hibernate), 1. Visão Geral, 2. Refatoração Back-end (Java Spring Boot), 3. Refatoração Front-end (React Native / TypeScript), 4. Diretrizes, A. Atualização de Entidades e DTOs, A. Nova Tela/Etapa no Onboarding (`MedicalHistoryScreen.tsx` ou Step equivalente), 🛠️ Adendo ao Plano: Persistência e Tratamento de Exceção da IA (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (8): 📌 Contexto e Arquitetura, Fase 1: Fundação e Conexão com Supabase, Fase 2: Entidade de Autenticação (Traditional Login), Fase 3: Controllers de Entrada, 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App), 📐 Padrões de Código e Clean Architecture, 🗺️ Roadmap de Execução (Modo Agêntico), 🛠️ Stack Tecnológico Obrigatório

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (7): 1. Contexto do Problema, 2. Suspeitos Principais, 3. Ações Exigidas para a IA (Passo a Passo do Debug), A. Adicionar Logs de Rastreamento (Tracing), B. Blindar o Recebimento da Data, C. Expor a Exceção Raiz, 🐛 Plano de Debug: Resolução da Quebra Silenciosa na Geração de Treino

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (6): DAY_A, DAY_B, DAY_C, mockFeed, mockSquad, WORKOUT_MAP

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (6): Diretrizes de Tipagem (Strict TypeScript), Objetivo, Plano de Refatoração: Onboarding Flow (React -> TSX Estrito), Tarefa 1: Substituição de "Idade" por "Data de Nascimento", Tarefa 2: Criação da Etapa de Anamnese, Tarefa 3: Atualização do Controlador Principal (`OnboardingFlow`)

## Knowledge Gaps
- **159 isolated node(s):** `K`, `GOALS`, `LEVELS`, `DAYS`, `STEPS` (+154 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `K`, `GOALS`, `LEVELS` to the rest of the system?**
  _159 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Core & Auth UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Stats & Dashboard Types` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Backend Auth & User Mgmt` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Stats Service & Periods` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Workout Sessions & Community Stats` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Home Screen & Evolution Modal` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._