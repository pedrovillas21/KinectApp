# Graph Report - Kinect  (2026-05-12)

## Corpus Check
- 99 files · ~27,802 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 407 nodes · 569 edges · 52 communities (33 shown, 19 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f565e7f1`
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
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]

## God Nodes (most connected - your core abstractions)
1. `COLORS` - 22 edges
2. `ThemeContext` - 19 edges
3. `JwtUtil` - 10 edges
4. `AuthContext` - 9 edges
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

## Communities (52 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (23): styles, styles, styles, styles, styles, styles, styles, styles (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (39): CardHeaderProps, chipStyles, ConsistencyCardProps, consistencyStyles, DeltaChip(), DeltaChipProps, InsightBlockProps, insightStyles (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (15): UserController, endDate(), fromString(), id(), insightTag(), previousEndDate(), previousStartDate(), startDate() (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (8): AuthController, UserRepository, WorkoutSessionRepository, CustomUserDetailsService, AuthService, CommunityStatsService, WorkoutSessionService, UserDetailsService

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (9): WorkoutController, json(), of(), getText(), WorkoutPlanRepository, RuntimeException, GeminiService, InvalidGeminiResponseException (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (16): EvolutionModalProps, styles, styles, SetData, styles, EMPTY_DASHBOARD, HomeScreenProps, LeaderboardEntry (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (17): 1. Overview & Creative North Star: "The Digital Kineticist", 2. Colors: Tonal Depth & The Neon Pulse, 3. Typography: Editorial Authority, 4. Elevation & Depth: Tonal Layering, 5. Components: The Athletic Kit, 6. Do’s and Don’ts, Buttons (The Kinetic Drivers), Cards & Lists (The Performance Modules) (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (9): styles, styles, styles, DAY_A, DAY_B, DAY_C, mockFeed, mockSquad (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (3): OncePerRequestFilter, JwtAuthenticationFilter, JwtUtil

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Refatoração Back-end: Blindagem de Dados (Java), 3. Refatoração Front-end: ActiveSessionScreen.tsx (UX e Validações), 4. StatsScreen e Evolução Mensal (TypeScript & Gifted Charts), 5. Diretrizes Técnicas para o Agente (IDE), A. Atualização do `SetLogDto.java`, A. Dashboards Visuais (StatsScreen.tsx), A. Validação Individual de Série (Botão Check) (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Regras de Negócio e Lógica Matemática, 3. Back-end (Spring Boot 3.2.x - Java 17), 4. Front-end (React Native), A. Gerenciamento de Estado (useState), A. Nova Entidade e Tabela (`WorkoutSession`), B. Hook do Cronômetro (useEffect), B. Novo Endpoint de Registro (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (8): 📌 Contexto e Arquitetura, Fase 1: Fundação e Conexão com Supabase, Fase 2: Entidade de Autenticação (Traditional Login), Fase 3: Controllers de Entrada, 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App), 📐 Padrões de Código e Clean Architecture, 🗺️ Roadmap de Execução (Modo Agêntico), 🛠️ Stack Tecnológico Obrigatório

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (7): 1. Contexto do Problema, 2. Suspeitos Principais, 3. Ações Exigidas para a IA (Passo a Passo do Debug), A. Adicionar Logs de Rastreamento (Tracing), B. Blindar o Recebimento da Data, C. Expor a Exceção Raiz, 🐛 Plano de Debug: Resolução da Quebra Silenciosa na Geração de Treino

## Knowledge Gaps
- **113 isolated node(s):** `LoginDTO`, `RegisterDTO`, `ResetPasswordDTO`, `VerifyEmailDTO`, `Exercise` (+108 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `LoginDTO`, `RegisterDTO`, `ResetPasswordDTO` to the rest of the system?**
  _113 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._