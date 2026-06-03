# Graph Report - Kinect  (2026-06-03)

## Corpus Check
- 150 files · ~68,144 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 835 nodes · 1125 edges · 96 communities (63 shown, 33 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 83 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4b88d024`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
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
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]

## God Nodes (most connected - your core abstractions)
1. `COLORS` - 24 edges
2. `ThemeContext` - 20 edges
3. `AuthContext` - 14 edges
4. `JwtUtil` - 13 edges
5. `HomeAggregatorService` - 10 edges
6. `KINETIC` - 10 edges
7. `AuthService` - 8 edges
8. `StatsService` - 8 edges
9. `UserService` - 8 edges
10. `Kinetic App` - 8 edges

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

## Communities (96 total, 33 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (40): styles, styles, styles, styles, styles, AppHeader(), AppHeaderProps, styles (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (36): AdherenceCardProps, styles, getGreeting(), HomeGreeting(), HomeGreetingProps, styles, NextWorkoutCardProps, styles (+28 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (41): CardHeaderProps, chipStyles, ConsistencyCardProps, consistencyStyles, DeltaChip(), DeltaChipProps, InsightBlockProps, insightStyles (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (11): HomeController, json(), of(), getText(), WorkoutSessionRepository, RuntimeException, GeminiService, InvalidGeminiResponseException (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (8): WorkoutController, WorkoutPlanRepository, WorkoutService, DATA, Icons, INSIGHTS, PERIODS, T

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (22): AccountSectionProps, AnamnesisModalProps, Badge, C, ChangePasswordModalProps, HeroUserData, Icons, MetricsModalProps (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (22): AuthContextValue, DAYS_LABELS, GEN_STEPS, GOAL_API_MAP, GoalDef, GOALS, GoalType, LEVEL_API_MAP (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (10): AGES, DAYS, DEFAULT_FORM, GOALS, HEIGHTS, K, LEVELS, STEPS (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (12): endDate(), fromString(), id(), insightTag(), previousEndDate(), previousStartDate(), startDate(), targetSessions() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (21): 1.1. Configurar variáveis de ambiente, 1.2. Rodar a aplicação, 1. Subindo o backend (`kinetic-backend`), 2.1. Instalar dependências, 2.2. Configurar a URL da API, 2.3. Rodar o app, 2. Subindo o app mobile (`KineticApp`), code:bash (cd kinetic-backend) (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (3): AuthController, UserRepository, CommunityStatsService

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (3): Ic, PF, USER

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (17): 1. Overview & Creative North Star: "The Digital Kineticist", 2. Colors: Tonal Depth & The Neon Pulse, 3. Typography: Editorial Authority, 4. Elevation & Depth: Tonal Layering, 5. Components: The Athletic Kit, 6. Do’s and Don’ts, Buttons (The Kinetic Drivers), Cards & Lists (The Performance Modules) (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (3): HK, MOCK, TAB_ICONS

### Community 18 - "Community 18"
Cohesion: 0.19
Nodes (11): AuthContextValue, AuthResult, CompleteOnboardingData, KineticUser, WorkoutPlanItem, api, logoutUser(), original (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (13): DAYS_LABELS, FREQUENCY_OPTIONS, GOAL_API_MAP, GOAL_OPTIONS, GoalDef, GOALS, GoalType, LEVEL_API_MAP (+5 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Refatoração Back-end: Blindagem de Dados (Java), 3. Refatoração Front-end: ActiveSessionScreen.tsx (UX e Validações), 4. StatsScreen e Evolução Mensal (TypeScript & Gifted Charts), 5. Diretrizes Técnicas para o Agente (IDE), A. Atualização do `SetLogDto.java`, A. Dashboards Visuais (StatsScreen.tsx), A. Validação Individual de Série (Botão Check) (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Regras de Negócio e Lógica Matemática, 3. Back-end (Spring Boot 3.2.x - Java 17), 4. Front-end (React Native), A. Gerenciamento de Estado (useState), A. Nova Entidade e Tabela (`WorkoutSession`), B. Hook do Cronômetro (useEffect), B. Novo Endpoint de Registro (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (10): 1. Back-end: Ajuste na Entidade `User` (JPA/Hibernate), 1. Visão Geral, 2. Refatoração Back-end (Java Spring Boot), 3. Refatoração Front-end (React Native / TypeScript), 4. Diretrizes, A. Atualização de Entidades e DTOs, A. Nova Tela/Etapa no Onboarding (`MedicalHistoryScreen.tsx` ou Step equivalente), 🛠️ Adendo ao Plano: Persistência e Tratamento de Exceção da IA (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.2
Nodes (9): 1.1. Status de Onboarding do Usuário, 1.2. Lógica de "Próxima Ficha Disponível", 1. Back-end: Inteligência e Persistência (Java Spring Boot), 2.1. Reestruturação da Navegação, 2.2. Lógica de Redirecionamento (Conditional Rendering), 2.3. Refatoração Visual do Dashboard (Design Premium), 2. Front-end: UI/UX e Navegação (React Native + TS), 3. Checklist de Implementação (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (6): GRADIENT_COLORS, GRADIENT_LOCATIONS, IconName, ROUTE_META, styles, T

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (8): 📌 Contexto e Arquitetura, Fase 1: Fundação e Conexão com Supabase, Fase 2: Entidade de Autenticação (Traditional Login), Fase 3: Controllers de Entrada, 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App), 📐 Padrões de Código e Clean Architecture, 🗺️ Roadmap de Execução (Modo Agêntico), 🛠️ Stack Tecnológico Obrigatório

### Community 28 - "Community 28"
Cohesion: 0.32
Nodes (4): OncePerRequestFilter, CustomUserDetailsService, JwtAuthenticationFilter, UserDetailsService

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (7): 1. Contexto do Problema, 2. Suspeitos Principais, 3. Ações Exigidas para a IA (Passo a Passo do Debug), A. Adicionar Logs de Rastreamento (Tracing), B. Blindar o Recebimento da Data, C. Expor a Exceção Raiz, 🐛 Plano de Debug: Resolução da Quebra Silenciosa na Geração de Treino

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (7): 1.1. Alterações na Entidade `User`, 1.2. Entidade de Log: `WorkoutExecutionLog`, 1. Persistência de Dados (JPA/Hibernate), 2.1. Lógica do Algoritmo "Próxima Ficha Pendente", 2. Motor de Busca de Treinos (`WorkoutService`), 3. Arquitetura do Contrato BFF (`HomeDashboardResponseDTO`), Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (6): Diretrizes de Tipagem (Strict TypeScript), Objetivo, Plano de Refatoração: Onboarding Flow (React -> TSX Estrito), Tarefa 1: Substituição de "Idade" por "Data de Nascimento", Tarefa 2: Criação da Etapa de Anamnese, Tarefa 3: Atualização do Controlador Principal (`OnboardingFlow`)

### Community 35 - "Community 35"
Cohesion: 0.53
Nodes (5): base64Decode(), base64UrlDecode(), decodeJwt(), isJwtExpired(), JwtPayload

### Community 36 - "Community 36"
Cohesion: 0.33
Nodes (6): ageFromBirthDate(), goalLabel(), hasMedicalInfo(), levelLabel(), AnamnesisModal(), ProtocolSection()

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (5): 1. Front-end: Camada de Contexto (`AuthContext.tsx`), 2.1. Tokens de Estilização e Specs Visuais (Image Reference), 2. Front-end: UI do Modal (ProfileScreen.tsx), 3.1. Controle de Estado do Modal, 3. Lógica de Integração e Fluxo

### Community 40 - "Community 40"
Cohesion: 0.5
Nodes (3): config, { getDefaultConfig }, path

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): ProfileScreen(), formatMemberSince(), formatProfileName()

## Knowledge Gaps
- **259 isolated node(s):** `HK`, `MOCK`, `TAB_ICONS`, `K`, `GOALS` (+254 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthService` connect `Community 14` to `Community 17`, `Community 10`, `Community 13`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `UserRepository` connect `Community 10` to `Community 14`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `HK`, `MOCK`, `TAB_ICONS` to the rest of the system?**
  _259 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._