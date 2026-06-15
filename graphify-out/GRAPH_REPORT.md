# Graph Report - KinectApp  (2026-06-15)

## Corpus Check
- 215 files · ~104,193 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1246 nodes · 1872 edges · 138 communities (107 shown, 31 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 164 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f2387e1`
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
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
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
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]

## God Nodes (most connected - your core abstractions)
1. `COLORS` - 42 edges
2. `SocialService` - 33 edges
3. `ThemeContext` - 30 edges
4. `AuthContext` - 21 edges
5. `SocialController` - 20 edges
6. `KINETIC` - 14 edges
7. `of()` - 13 edges
8. `JwtUtil` - 13 edges
9. `StatsService` - 12 edges
10. `HomeAggregatorService` - 10 edges

## Surprising Connections (you probably didn't know these)
- `DeltaChip()` --calls--> `formatNumberPtBR()`  [EXTRACTED]
  KineticApp/src/components/PlanEvolutionCard.tsx → KineticApp/src/utils/statsUtils.ts
- `DeltaChip()` --calls--> `formatNumberPtBR()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts
- `FeedPost()` --calls--> `avatarFallback()`  [EXTRACTED]
  KineticApp/src/components/FeedPost.tsx → KineticApp/src/services/socialService.ts
- `RankingRow()` --calls--> `rankingPositionColor()`  [EXTRACTED]
  KineticApp/src/components/home/RankingCard.tsx → KineticApp/src/theme/kinetic.ts
- `RankingRow()` --calls--> `rankingPositionChipBg()`  [EXTRACTED]
  KineticApp/src/components/home/RankingCard.tsx → KineticApp/src/theme/kinetic.ts

## Communities (138 total, 31 thin omitted)

### Community 0 - "Frontend Core & Auth UI"
Cohesion: 0.05
Nodes (13): RefreshToken, OncePerRequestFilter, RefreshTokenRepository, UserLoginStreakRepository, UserRepository, WorkoutExecutionLogRepository, CustomUserDetailsService, JwtAuthenticationFilter (+5 more)

### Community 1 - "Stats & Dashboard Types"
Cohesion: 0.05
Nodes (18): endDate(), fromString(), id(), insightTag(), previousEndDate(), previousStartDate(), startDate(), targetSessions() (+10 more)

### Community 2 - "Backend Auth & User Mgmt"
Cohesion: 0.05
Nodes (36): A, BiometricState, Props, SecurityState, styles, A, Props, RegisterScreen() (+28 more)

### Community 3 - "Stats Service & Periods"
Cohesion: 0.05
Nodes (41): Props, SquadBar(), SquadItem, styles, AdherenceCardProps, styles, getGreeting(), HomeGreeting() (+33 more)

### Community 4 - "Workout Sessions & Community Stats"
Cohesion: 0.05
Nodes (44): cardS, chipS, DeltaChip(), emptyS, insightS, PlanEvolutionCardProps, rowS, T (+36 more)

### Community 5 - "Home Screen & Evolution Modal"
Cohesion: 0.07
Nodes (5): PostCommentRepository, PostLikeRepository, SocialPostRepository, UserConnectionRepository, SocialService

### Community 6 - "Workout Planning & Plans"
Cohesion: 0.07
Nodes (8): BaseController, BaseController, HomeController, SocialController, StatsController, UserController, WorkoutController, WorkoutSessionController

### Community 7 - "JWT Security & Auth Filters"
Cohesion: 0.06
Nodes (13): Post, json(), of(), getText(), EmailAlreadyInUseException, WorkoutPlanRepository, RuntimeException, GeminiService (+5 more)

### Community 8 - "Gemini AI Service"
Cohesion: 0.05
Nodes (42): 1.1. Configurar variáveis de ambiente, 1.2. Rodar a aplicação, 1. Subindo o backend (`kinetic-backend`), 2.1. Instalar dependências, 2.2. Configurar a URL da API, 2.3. Rodar o app, 2. Subindo o app mobile (`KineticApp`), code:bash (cd kinetic-backend) (+34 more)

### Community 9 - "Social Feed & Mock Data"
Cohesion: 0.06
Nodes (20): AccountSectionProps, AnamnesisModalProps, Badge, C, ChangePasswordModalProps, HeroUserData, Icons, MetricsModalProps (+12 more)

### Community 10 - "Exercise Logging DTOs"
Cohesion: 0.06
Nodes (22): AuthContextValue, DAYS_LABELS, GEN_STEPS, GOAL_API_MAP, GoalDef, GOALS, GoalType, LEVEL_API_MAP (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (10): AGES, DAYS, DEFAULT_FORM, GOALS, HEIGHTS, K, LEVELS, STEPS (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (16): ForgotPasswordScreen(), Props, styles, Props, ResetPasswordScreen(), styles, CustomInput(), Props (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.28
Nodes (5): styles, AuthContext, AuthProvider(), ThemeContext, Drawer

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (10): AppHeader(), AppHeaderProps, styles, Props, SerieCard(), styles, SetData, styles (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (3): Ic, PF, USER

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (18): CommunityComparisonDTO, CreatePostRequest, CreateStoryRequest, FeedAuthor, GenerateWorkoutRequest, LogSessionRequestDTO, Page, PresenceStatus (+10 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (15): useSquadStatus(), SocialScreen(), styles, acceptConnection(), createStory(), getFeed(), getPendingRequests(), getSquad() (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (11): Props, styles, VerifyCodeScreen(), HeaderLogo(), Props, styles, styles, ThemeToggle() (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (17): 1. Overview & Creative North Star: "The Digital Kineticist", 2. Colors: Tonal Depth & The Neon Pulse, 3. Typography: Editorial Authority, 4. Elevation & Depth: Tonal Layering, 5. Components: The Athletic Kit, 6. Do’s and Don’ts, Buttons (The Kinetic Drivers), Cards & Lists (The Performance Modules) (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (4): Icons, INSIGHTS, PERIODS, T

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (3): A, FAKE_USER, Ic

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (11): WorkoutPlanItem, AppRoutes(), AuthContextShape, Stack, Tab, Exercise, MuscleStyle, Props (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (3): HK, MOCK, TAB_ICONS

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (11): Props, styles, Author, FeedPost(), Props, styles, addComment(), avatarFallback() (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (13): DAYS_LABELS, FREQUENCY_OPTIONS, GOAL_API_MAP, GOAL_OPTIONS, GoalDef, GOALS, GoalType, LEVEL_API_MAP (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (13): 1. Armazenamento seguro de tokens — novo módulo `tokenStorage`, 2. Conceito de "usuário lembrado" + desbloqueio — `AuthContext.tsx`, 3. Telas novas, 4. Roteamento — `AppRoutes.tsx`, 5. Ajuste no `LoginScreen.js`, 6. Bootstrap sem "piscar" de tela — Splash até estar pronto, code:block1 (npx expo install expo-local-authentication expo-secure-store), Contexto (+5 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Refatoração Back-end: Blindagem de Dados (Java), 3. Refatoração Front-end: ActiveSessionScreen.tsx (UX e Validações), 4. StatsScreen e Evolução Mensal (TypeScript & Gifted Charts), 5. Diretrizes Técnicas para o Agente (IDE), A. Atualização do `SetLogDto.java`, A. Dashboards Visuais (StatsScreen.tsx), A. Validação Individual de Série (Botão Check) (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Regras de Negócio e Lógica Matemática, 3. Back-end (Spring Boot 3.2.x - Java 17), 4. Front-end (React Native), A. Gerenciamento de Estado (useState), A. Nova Entidade e Tabela (`WorkoutSession`), B. Hook do Cronômetro (useEffect), B. Novo Endpoint de Registro (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.27
Nodes (9): DAY_A, DAY_B, DAY_C, ExerciseItem, FeedPostData, mockFeed, mockSquad, SquadMember (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (4): A, LoginScreen(), Props, styles

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (10): 1. Back-end: Ajuste na Entidade `User` (JPA/Hibernate), 1. Visão Geral, 2. Refatoração Back-end (Java Spring Boot), 3. Refatoração Front-end (React Native / TypeScript), 4. Diretrizes, A. Atualização de Entidades e DTOs, A. Nova Tela/Etapa no Onboarding (`MedicalHistoryScreen.tsx` ou Step equivalente), 🛠️ Adendo ao Plano: Persistência e Tratamento de Exceção da IA (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (3): LastActiveInterceptor, HandlerInterceptor, PresenceService

### Community 35 - "Community 35"
Cohesion: 0.2
Nodes (9): 1.1. Status de Onboarding do Usuário, 1.2. Lógica de "Próxima Ficha Disponível", 1. Back-end: Inteligência e Persistência (Java Spring Boot), 2.1. Reestruturação da Navegação, 2.2. Lógica de Redirecionamento (Conditional Rendering), 2.3. Refatoração Visual do Dashboard (Design Premium), 2. Front-end: UI/UX e Navegação (React Native + TS), 3. Checklist de Implementação (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (6): GRADIENT_COLORS, GRADIENT_LOCATIONS, IconName, ROUTE_META, styles, T

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (7): ACTION_LABEL, Props, styles, searchUsers(), sendConnection(), ConnectionState, UserCard

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (8): 📌 Contexto e Arquitetura, Fase 1: Fundação e Conexão com Supabase, Fase 2: Entidade de Autenticação (Traditional Login), Fase 3: Controllers de Entrada, 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App), 📐 Padrões de Código e Clean Architecture, 🗺️ Roadmap de Execução (Modo Agêntico), 🛠️ Stack Tecnológico Obrigatório

### Community 40 - "Community 40"
Cohesion: 0.25
Nodes (6): INTENSITY_LABELS, INTENSITY_OPTIONS, Props, styles, createPost(), PostIntensity

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (4): A, FEATURES, Props, styles

### Community 42 - "Community 42"
Cohesion: 0.25
Nodes (7): 1. Contexto do Problema, 2. Suspeitos Principais, 3. Ações Exigidas para a IA (Passo a Passo do Debug), A. Adicionar Logs de Rastreamento (Tracing), B. Blindar o Recebimento da Data, C. Expor a Exceção Raiz, 🐛 Plano de Debug: Resolução da Quebra Silenciosa na Geração de Treino

### Community 43 - "Community 43"
Cohesion: 0.25
Nodes (7): 1.1. Alterações na Entidade `User`, 1.2. Entidade de Log: `WorkoutExecutionLog`, 1. Persistência de Dados (JPA/Hibernate), 2.1. Lógica do Algoritmo "Próxima Ficha Pendente", 2. Motor de Busca de Treinos (`WorkoutService`), 3. Arquitetura do Contrato BFF (`HomeDashboardResponseDTO`), Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)

### Community 46 - "Community 46"
Cohesion: 0.29
Nodes (6): Diretrizes de Tipagem (Strict TypeScript), Objetivo, Plano de Refatoração: Onboarding Flow (React -> TSX Estrito), Tarefa 1: Substituição de "Idade" por "Data de Nascimento", Tarefa 2: Criação da Etapa de Anamnese, Tarefa 3: Atualização do Controlador Principal (`OnboardingFlow`)

### Community 48 - "Community 48"
Cohesion: 0.33
Nodes (3): EvolutionModalProps, styles, setSignOutHandler()

### Community 49 - "Community 49"
Cohesion: 0.4
Nodes (5): Props, StoryViewer(), styles, timeAgo(), { width }

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (6): ageFromBirthDate(), goalLabel(), hasMedicalInfo(), levelLabel(), AnamnesisModal(), ProtocolSection()

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (5): 1. Front-end: Camada de Contexto (`AuthContext.tsx`), 2.1. Tokens de Estilização e Specs Visuais (Image Reference), 2. Front-end: UI do Modal (ProfileScreen.tsx), 3.1. Controle de Estado do Modal, 3. Lógica de Integração e Fluxo

### Community 52 - "Community 52"
Cohesion: 0.4
Nodes (4): Exercise, ExerciseCard(), Props, styles

### Community 54 - "Community 54"
Cohesion: 0.4
Nodes (3): Props, styles, PendingRequest

### Community 55 - "Community 55"
Cohesion: 0.4
Nodes (4): useWorkoutPresence(), ActiveSessionScreen(), endWorkoutPresence(), startWorkoutPresence()

### Community 56 - "Community 56"
Cohesion: 0.5
Nodes (3): CustomButton(), Props, styles

### Community 58 - "Community 58"
Cohesion: 0.5
Nodes (3): config, { getDefaultConfig }, path

### Community 59 - "Community 59"
Cohesion: 0.67
Nodes (3): ProfileScreen(), formatMemberSince(), formatProfileName()

## Knowledge Gaps
- **329 isolated node(s):** `A`, `Ic`, `FAKE_USER`, `HK`, `MOCK` (+324 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Badge` connect `Social Feed & Mock Data` to `Home Screen & Evolution Modal`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `of()` connect `JWT Security & Auth Filters` to `Frontend Core & Auth UI`, `Stats & Dashboard Types`, `Home Screen & Evolution Modal`, `Workout Planning & Plans`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `Post` connect `JWT Security & Auth Filters` to `Community 26`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **What connects `A`, `Ic`, `FAKE_USER` to the rest of the system?**
  _329 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Core & Auth UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Stats & Dashboard Types` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Backend Auth & User Mgmt` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._