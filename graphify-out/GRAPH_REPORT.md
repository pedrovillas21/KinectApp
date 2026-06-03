# Graph Report - KinectApp  (2026-06-03)

## Corpus Check
- 147 files · ~66,065 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 801 nodes · 1087 edges · 85 communities (61 shown, 24 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6435275d`
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
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]

## God Nodes (most connected - your core abstractions)
1. `COLORS` - 24 edges
2. `ThemeContext` - 20 edges
3. `AuthContext` - 14 edges
4. `JwtUtil` - 13 edges
5. `HomeAggregatorService` - 10 edges
6. `KINETIC` - 10 edges
7. `StatsService` - 8 edges
8. `AuthController` - 7 edges
9. `AuthService` - 7 edges
10. `RefreshTokenService` - 7 edges

## Surprising Connections (you probably didn't know these)
- `DeltaChip()` --calls--> `formatNumberPtBR()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts
- `RankingRow()` --calls--> `rankingPositionColor()`  [EXTRACTED]
  KineticApp/src/components/home/RankingCard.tsx → KineticApp/src/theme/kinetic.ts
- `RankingRow()` --calls--> `rankingPositionChipBg()`  [EXTRACTED]
  KineticApp/src/components/home/RankingCard.tsx → KineticApp/src/theme/kinetic.ts
- `ProtocolSection()` --calls--> `goalLabel()`  [EXTRACTED]
  KineticApp/src/screens/ProfileScreen.tsx → KineticApp/src/constants/protocol.ts
- `ProtocolSection()` --calls--> `levelLabel()`  [EXTRACTED]
  KineticApp/src/screens/ProfileScreen.tsx → KineticApp/src/constants/protocol.ts

## Communities (85 total, 24 thin omitted)

### Community 0 - "Frontend Core & Auth UI"
Cohesion: 0.06
Nodes (37): styles, styles, styles, styles, styles, styles, styles, styles (+29 more)

### Community 1 - "Stats & Dashboard Types"
Cohesion: 0.05
Nodes (42): ageFromBirthDate(), DAYS_LABELS, FREQUENCY_OPTIONS, GOAL_API_MAP, GOAL_OPTIONS, GoalDef, goalLabel(), GOALS (+34 more)

### Community 2 - "Backend Auth & User Mgmt"
Cohesion: 0.06
Nodes (45): CardHeaderProps, chipStyles, ConsistencyCardProps, consistencyStyles, DeltaChip(), DeltaChipProps, InsightBlockProps, insightStyles (+37 more)

### Community 3 - "Stats Service & Periods"
Cohesion: 0.05
Nodes (37): AppHeader(), AppHeaderProps, styles, AdherenceCardProps, styles, getGreeting(), HomeGreeting(), HomeGreetingProps (+29 more)

### Community 4 - "Workout Sessions & Community Stats"
Cohesion: 0.08
Nodes (9): RefreshToken, OncePerRequestFilter, RefreshTokenRepository, CustomUserDetailsService, JwtAuthenticationFilter, JwtUtil, AuthService, RefreshTokenService (+1 more)

### Community 5 - "Home Screen & Evolution Modal"
Cohesion: 0.07
Nodes (10): HomeController, json(), of(), getText(), WorkoutSessionRepository, RuntimeException, GeminiService, InvalidGeminiResponseException (+2 more)

### Community 6 - "Workout Planning & Plans"
Cohesion: 0.06
Nodes (8): WorkoutController, WorkoutPlanRepository, WorkoutService, DATA, Icons, INSIGHTS, PERIODS, T

### Community 7 - "JWT Security & Auth Filters"
Cohesion: 0.1
Nodes (13): endDate(), fromString(), id(), insightTag(), previousEndDate(), previousStartDate(), startDate(), targetSessions() (+5 more)

### Community 8 - "Gemini AI Service"
Cohesion: 0.06
Nodes (22): AuthContextValue, DAYS_LABELS, GEN_STEPS, GOAL_API_MAP, GoalDef, GOALS, GoalType, LEVEL_API_MAP (+14 more)

### Community 9 - "Social Feed & Mock Data"
Cohesion: 0.07
Nodes (10): AGES, DAYS, DEFAULT_FORM, GOALS, HEIGHTS, K, LEVELS, STEPS (+2 more)

### Community 10 - "Exercise Logging DTOs"
Cohesion: 0.11
Nodes (4): UserController, UserLoginStreakRepository, WorkoutExecutionLogRepository, UserService

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (3): AuthController, UserRepository, CommunityStatsService

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (3): Ic, PF, USER

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (17): 1. Overview & Creative North Star: "The Digital Kineticist", 2. Colors: Tonal Depth & The Neon Pulse, 3. Typography: Editorial Authority, 4. Elevation & Depth: Tonal Layering, 5. Components: The Athletic Kit, 6. Do’s and Don’ts, Buttons (The Kinetic Drivers), Cards & Lists (The Performance Modules) (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (3): HK, MOCK, TAB_ICONS

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Refatoração Back-end: Blindagem de Dados (Java), 3. Refatoração Front-end: ActiveSessionScreen.tsx (UX e Validações), 4. StatsScreen e Evolução Mensal (TypeScript & Gifted Charts), 5. Diretrizes Técnicas para o Agente (IDE), A. Atualização do `SetLogDto.java`, A. Dashboards Visuais (StatsScreen.tsx), A. Validação Individual de Série (Botão Check) (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Regras de Negócio e Lógica Matemática, 3. Back-end (Spring Boot 3.2.x - Java 17), 4. Front-end (React Native), A. Gerenciamento de Estado (useState), A. Nova Entidade e Tabela (`WorkoutSession`), B. Hook do Cronômetro (useEffect), B. Novo Endpoint de Registro (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.21
Nodes (10): AuthContextValue, AuthResult, CompleteOnboardingData, KineticUser, WorkoutPlanItem, logoutUser(), original, refreshAccessToken() (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (10): 1. Back-end: Ajuste na Entidade `User` (JPA/Hibernate), 1. Visão Geral, 2. Refatoração Back-end (Java Spring Boot), 3. Refatoração Front-end (React Native / TypeScript), 4. Diretrizes, A. Atualização de Entidades e DTOs, A. Nova Tela/Etapa no Onboarding (`MedicalHistoryScreen.tsx` ou Step equivalente), 🛠️ Adendo ao Plano: Persistência e Tratamento de Exceção da IA (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.2
Nodes (9): 1.1. Status de Onboarding do Usuário, 1.2. Lógica de "Próxima Ficha Disponível", 1. Back-end: Inteligência e Persistência (Java Spring Boot), 2.1. Reestruturação da Navegação, 2.2. Lógica de Redirecionamento (Conditional Rendering), 2.3. Refatoração Visual do Dashboard (Design Premium), 2. Front-end: UI/UX e Navegação (React Native + TS), 3. Checklist de Implementação (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (6): GRADIENT_COLORS, GRADIENT_LOCATIONS, IconName, ROUTE_META, styles, T

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (8): 📌 Contexto e Arquitetura, Fase 1: Fundação e Conexão com Supabase, Fase 2: Entidade de Autenticação (Traditional Login), Fase 3: Controllers de Entrada, 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App), 📐 Padrões de Código e Clean Architecture, 🗺️ Roadmap de Execução (Modo Agêntico), 🛠️ Stack Tecnológico Obrigatório

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (7): 1. Contexto do Problema, 2. Suspeitos Principais, 3. Ações Exigidas para a IA (Passo a Passo do Debug), A. Adicionar Logs de Rastreamento (Tracing), B. Blindar o Recebimento da Data, C. Expor a Exceção Raiz, 🐛 Plano de Debug: Resolução da Quebra Silenciosa na Geração de Treino

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (7): 1.1. Alterações na Entidade `User`, 1.2. Entidade de Log: `WorkoutExecutionLog`, 1. Persistência de Dados (JPA/Hibernate), 2.1. Lógica do Algoritmo "Próxima Ficha Pendente", 2. Motor de Busca de Treinos (`WorkoutService`), 3. Arquitetura do Contrato BFF (`HomeDashboardResponseDTO`), Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (6): Diretrizes de Tipagem (Strict TypeScript), Objetivo, Plano de Refatoração: Onboarding Flow (React -> TSX Estrito), Tarefa 1: Substituição de "Idade" por "Data de Nascimento", Tarefa 2: Criação da Etapa de Anamnese, Tarefa 3: Atualização do Controlador Principal (`OnboardingFlow`)

### Community 29 - "Community 29"
Cohesion: 0.33
Nodes (3): EvolutionModalProps, styles, api

### Community 30 - "Community 30"
Cohesion: 0.53
Nodes (5): base64Decode(), base64UrlDecode(), decodeJwt(), isJwtExpired(), JwtPayload

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (5): 1. Front-end: Camada de Contexto (`AuthContext.tsx`), 2.1. Tokens de Estilização e Specs Visuais (Image Reference), 2. Front-end: UI do Modal (ProfileScreen.tsx), 3.1. Controle de Estado do Modal, 3. Lógica de Integração e Fluxo

### Community 33 - "Community 33"
Cohesion: 0.5
Nodes (3): config, { getDefaultConfig }, path

## Knowledge Gaps
- **245 isolated node(s):** `HK`, `MOCK`, `TAB_ICONS`, `K`, `GOALS` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthService` connect `Workout Sessions & Community Stats` to `Community 11`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `UserRepository` connect `Community 11` to `Workout Sessions & Community Stats`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `HK`, `MOCK`, `TAB_ICONS` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Core & Auth UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Stats & Dashboard Types` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Backend Auth & User Mgmt` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Stats Service & Periods` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._