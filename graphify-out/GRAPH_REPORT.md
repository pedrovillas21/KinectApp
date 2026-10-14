# Graph Report - KinectApp  (2026-10-14)

## Corpus Check
- 391 files · ~189,627 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2672 nodes · 6200 edges · 171 communities (115 shown, 56 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 379 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b7447a34`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- org.springframework.transaction.annotation.Transactional
- KineticApp/src/types/index.ts
- org.springframework.stereotype.Service
- CompanyService
- org.springframework.http.ResponseEntity
- StatsScreen.tsx
- lombok.Getter
- TrainerAiPlanService
- AuthController.java
- GeminiService
- HomeScreen.tsx
- org.springframework.data.jpa.repository.Query
- Icon.tsx
- src/App.tsx
- StudentsListPage.tsx
- EmpresaHomePage.tsx
- Banco de dados do Kinetic
- CompliancePage.tsx
- User
- io.swagger.v3.oas.annotations.tags.Tag
- ProfileScreen.tsx
- Override
- PlanEditor.tsx
- KineticApp/src/contexts/AuthContext.tsx
- RuntimeException
- WorkoutScreen.tsx
- OnboardingScreen.tsx
- onboarding.jsx
- lombok.RequiredArgsConstructor
- WorkoutSessionRepository
- HomeAggregatorService
- DashboardTab.tsx
- HandlerInterceptor
- kinetic-desktop/src/types/index.ts
- compilerOptions
- TrainerController.java
- aiDraft.ts
- UserService
- metro.config.js
- kinetic-desktop/src/services/trainerService.ts
- Design System Specification: High-Performance Athleticism
- AiPlanComposer.tsx
- compilerOptions
- StorageService
- AppRoutes.tsx
- SocialService
- treino-detalhe.jsx
- profile.jsx
- WorkoutPlansTab.tsx
- expo
- ActiveSessionScreen.tsx
- stats.jsx
- treinar.jsx
- SecurityConfig.java
- components.json
- dependencies
- BaseController
- JwtChannelInterceptor
- devDependencies
- rootService.ts
- Kinetic App
- EmpresaController
- WebSocketConfig.java
- treino-sessao.jsx
- 🏋️ Plano — Painel Desktop do Personal (Kinetic)
- auth.jsx
- 🚀 Plano de Implementação: Blindagem de Dados, UX e Dashboard de Desempenho
- 4. Front-end (React Native)
- tweaks-panel.jsx
- tweaks-panel (1).jsx
- WebMvcConfigurer
- JwtUtil
- ChatPanel.tsx
- protocol.ts
- home.jsx
- 🛡️ Plano de Refatoração: Onboarding Clínico e Blindagem do Prompt (IA)
- PresenceService
- TrainerChatScreen.tsx
- dependencies
- org.springframework.context.annotation.Configuration
- RefreshTokenService
- ChannelInterceptor
- StudentDetailPage.tsx
- 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App)
- Mudanças
- JacksonConfig.java
- .findByEmail
- empresaService.ts
- 3. Ações Exigidas para a IA (Passo a Passo do Debug)
- Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)
- CommandLineRunner
- .avatarOf
- 2. Front-end: UI/UX e Navegação (React Native + TS)
- kinetic-desktop/package.json
- KineticApp/src/services/trainerService.ts
- PostLikeRepository
- KineticApp/package.json
- ProtocolSection
- compilerOptions
- Plano de Refatoração: Onboarding Flow (React -> TSX Estrito)
- PresenceStatus
- kinetic-desktop/src/utils/jwt.ts
- kinetic-desktop/tsconfig.json
- .getStories
- PostIntensity
- KineticApplication
- PerfilLogoffButton.md
- scripts
- ExerciseCard.tsx
- VolumeByMuscleGroupDTO
- WeightPointDTO
- ConnectionStatus
- CustomButton.tsx
- class-variance-authority
- CLAUDE.md
- expo
- expo-image-picker
- expo-linear-gradient
- OncePerRequestFilter
- expo-local-authentication
- expo-secure-store
- expo-splash-screen
- 1. Banco de Dados (Flyway / PostgreSQL)
- Plano de Implementação: Integração do Perfil Dinâmico (ProfileScreen)
- expo-status-bar
- GEMINI.md
- CreatePostRequest.java
- CreateStoryRequest.java
- WorkoutSessionLogRequestDTO.java
- lucide-react
- next-themes
- radix-ui
- react-router-dom
- sonner
- tw-animate-css
- kinetic-desktop/src/theme/colors.ts
- react
- react-native
- @react-native-async-storage/async-storage
- react-native-reanimated
- react-native-safe-area-context
- react-native-screens
- react-native-svg
- react-native-worklets
- @react-navigation/bottom-tabs
- @react-navigation/native
- @react-navigation/native-stack
- @stomp/stompjs
- @types/react
- typescript
- orfaoPlan.md
- com.kinetic:kinetic-backend
- UserDetailsService
- WebSocketMessageBrokerConfigurer

## God Nodes (most connected - your core abstractions)
1. `User` - 110 edges
2. `cn()` - 102 edges
3. `UserRepository` - 62 edges
4. `SocialService` - 44 edges
5. `WorkoutPlan` - 31 edges
6. `StatsService` - 31 edges
7. `TrainerAiPlanService` - 29 edges
8. `WorkoutPlanResponseDTO` - 27 edges
9. `WorkoutSessionRepository` - 27 edges
10. `SocialController` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `PendingRequest`  [EXTRACTED]
  KineticApp/src/components/ConnectionRequestsModal.tsx → KineticApp/src/types/index.ts
- `Props` --references--> `FeedPostData`  [EXTRACTED]
  KineticApp/src/components/FeedPost.tsx → KineticApp/src/types/index.ts
- `Props` --references--> `FeedPostData`  [EXTRACTED]
  KineticApp/src/components/NewPostModal.tsx → KineticApp/src/types/index.ts
- `DeltaChip()` --calls--> `formatNumberPtBR()`  [EXTRACTED]
  KineticApp/src/components/PlanEvolutionCard.tsx → KineticApp/src/utils/statsUtils.ts
- `Props` --references--> `SquadMember`  [EXTRACTED]
  KineticApp/src/components/SquadBar.tsx → KineticApp/src/types/index.ts

## Import Cycles
- None detected.

## Communities (171 total, 56 thin omitted)

### Community 0 - "cn"
Cohesion: 0.04
Nodes (80): AppSidebar(), ROLE_SUBTITLE, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+72 more)

### Community 1 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.06
Nodes (32): GetMapping, PostMapping, RequestMapping, RestController, StudentTrainerController, EmpresaAnalyticsDTO, InstructorPerf, VolumePoint (+24 more)

### Community 2 - "KineticApp/src/types/index.ts"
Cohesion: 0.05
Nodes (70): CommentsSheet(), Props, styles, ConnectionRequestsModal(), Props, FeedPost(), Props, styles (+62 more)

### Community 3 - "org.springframework.stereotype.Service"
Cohesion: 0.06
Nodes (28): com.fasterxml.jackson.databind.ObjectMapper, GenerateWorkoutRequestDto, AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table (+20 more)

### Community 4 - "CompanyService"
Cohesion: 0.06
Nodes (28): DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, RootController, CompanyDTO, CreatePersonalRequestDTO (+20 more)

### Community 5 - "org.springframework.http.ResponseEntity"
Cohesion: 0.10
Nodes (22): io.swagger.v3.oas.annotations.Operation, DeleteMapping, CreatePostRequest, CreateStoryRequest, DeleteMapping, GetMapping, PostMapping, RequestMapping (+14 more)

### Community 6 - "StatsScreen.tsx"
Cohesion: 0.05
Nodes (49): cardS, chipS, DeltaChip(), emptyS, insightS, PlanEvolutionCard(), PlanEvolutionCardProps, rowS (+41 more)

### Community 7 - "lombok.Getter"
Cohesion: 0.09
Nodes (38): jakarta.persistence.Entity, jakarta.persistence.Table, AiPlanGeneration, Entity, Table, ChatMessage, Entity, Table (+30 more)

### Community 8 - "TrainerAiPlanService"
Cohesion: 0.07
Nodes (18): java.util.regex.Pattern, AiPlanDraftDTO, Exercise, Note, Plan, AiPlanPreviewDTO, ExerciseResponseDTO, TrainerAiPlanRequestDTO (+10 more)

### Community 9 - "AuthController.java"
Cohesion: 0.08
Nodes (22): jakarta.servlet.http.HttpServletResponse, jakarta.validation.constraints.Pattern, AuthController, PostMapping, RequestMapping, RestController, SuppressWarnings, AuthResponseDTO (+14 more)

### Community 10 - "GeminiService"
Cohesion: 0.06
Nodes (24): com.fasterxml.jackson.core.type.TypeReference, Content, GeminiRequestDto, GenerationConfig, Part, Candidate, Content, GeminiResponseDto (+16 more)

### Community 11 - "HomeScreen.tsx"
Cohesion: 0.07
Nodes (40): AppHeader(), AppHeaderProps, styles, AdherenceCard(), AdherenceCardProps, styles, getGreeting(), HomeGreeting() (+32 more)

### Community 12 - "org.springframework.data.jpa.repository.Query"
Cohesion: 0.10
Nodes (17): Entity, Table, PostComment, Entity, Table, UserConnection, ChatMessageRepository, ExerciseRepository (+9 more)

### Community 13 - "Icon.tsx"
Cohesion: 0.09
Nodes (34): styles, CustomInput(), Props, styles, HeaderLogo(), Props, styles, Icon() (+26 more)

### Community 14 - "src/App.tsx"
Cohesion: 0.10
Nodes (34): App(), RoleAwareRedirect(), Toaster(), homeForRole(), isPanelRole(), NAV_BY_ROLE, NavItem, PANEL_ROLES (+26 more)

### Community 15 - "StudentsListPage.tsx"
Cohesion: 0.10
Nodes (35): InviteStudentModal(), Props, CountUp(), CountUpProps, EASE_OUT, ProgressRingProps, riseItem, SPRING_PILL (+27 more)

### Community 16 - "EmpresaHomePage.tsx"
Cohesion: 0.11
Nodes (29): CHART, InstructorBarChart(), nf, shortDate(), tooltipStyle, VolumeLineChart(), PageHeader(), Props (+21 more)

### Community 17 - "Banco de dados do Kinetic"
Cohesion: 0.08
Nodes (25): Banco de dados do Kinetic, Chat, `chat_messages`, Como evoluir o schema, `companies`, Convenções e inconsistências, Execução e métricas, `feedbacks` (+17 more)

### Community 18 - "CompliancePage.tsx"
Cohesion: 0.19
Nodes (27): Props, StatusBadge(), Button(), buttonVariants, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+19 more)

### Community 19 - "User"
Cohesion: 0.11
Nodes (15): jakarta.persistence.EntityNotFoundException, Override, RootUserSeeder, Role, ALUNO, EMPRESA, PERSONAL, ROOT (+7 more)

### Community 20 - "io.swagger.v3.oas.annotations.tags.Tag"
Cohesion: 0.13
Nodes (14): io.swagger.v3.oas.annotations.tags.Tag, BaseController, HomeController, UserController, WorkoutController, WorkoutSessionController, LogSessionRequestDTO, SetLogDto (+6 more)

### Community 21 - "ProfileScreen.tsx"
Cohesion: 0.06
Nodes (18): AccountSectionProps, AnamnesisModalProps, Badge, C, ChangePasswordModalProps, HeroUserData, Icons, MetricsModalProps (+10 more)

### Community 22 - "Override"
Cohesion: 0.10
Nodes (13): endDate(), fromString(), Override, previousEndDate(), previousStartDate(), startDate(), StatsPeriodParam, MONTH (+5 more)

### Community 23 - "PlanEditor.tsx"
Cohesion: 0.12
Nodes (29): autoSubtitle(), blankExercise(), Draft, DraftExercise, draftFromInput(), draftFromPlan(), Errors, ExerciseField (+21 more)

### Community 24 - "KineticApp/src/contexts/AuthContext.tsx"
Cohesion: 0.13
Nodes (26): EvolutionModal(), EvolutionModalProps, styles, AuthContextValue, AuthProvider(), AuthResult, CompleteOnboardingData, KineticUser (+18 more)

### Community 26 - "WorkoutScreen.tsx"
Cohesion: 0.08
Nodes (18): WorkoutPlanItem, Accent, ACCENTS, DAY_LETTERS, Exercise, firstName(), formatVolumeKg(), groupSections() (+10 more)

### Community 27 - "OnboardingScreen.tsx"
Cohesion: 0.07
Nodes (23): AuthContextValue, buildMedicalValue(), DAYS_LABELS, GEN_STEPS, GOAL_API_MAP, GoalDef, GOALS, GoalType (+15 more)

### Community 28 - "onboarding.jsx"
Cohesion: 0.07
Nodes (10): AGES, DAYS, DEFAULT_FORM, GOALS, HEIGHTS, K, LEVELS, STEPS (+2 more)

### Community 29 - "lombok.RequiredArgsConstructor"
Cohesion: 0.13
Nodes (16): java.security.Principal, ChatController, GetMapping, PostMapping, RequestMapping, RestController, ChatWsController, ChatMessageDTO (+8 more)

### Community 30 - "WorkoutSessionRepository"
Cohesion: 0.11
Nodes (9): WeeklyActivityDayDTO, WeeklyActivityResponseDTO, WorkoutSessionRepository, CommunityStatsService, OrphanMediaCleanupService, WorkoutSessionService, org.slf4j.Logger, org.springframework.context.event.EventListener (+1 more)

### Community 31 - "HomeAggregatorService"
Cohesion: 0.12
Nodes (9): HomeDashboardResponseDTO, NextWorkoutResponseDTO, RankingEntryDTO, WeeklyActivityPointDTO, HomeAggregatorService, HomeDashboardResponseDTO, RankingEntryDTO, SuppressWarnings (+1 more)

### Community 32 - "DashboardTab.tsx"
Cohesion: 0.09
Nodes (17): Charts(), CycleComparison(), DashboardTab(), DeltaPill(), formatShortDate(), groupLabel(), nf0, nf1 (+9 more)

### Community 34 - "kinetic-desktop/src/types/index.ts"
Cohesion: 0.12
Nodes (20): MAP, Badge(), badgeVariants, FeedbacksPage(), formatDate(), listCompanyFeedbacks(), AiDraftExercise, AiDraftPlan (+12 more)

### Community 35 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+16 more)

### Community 36 - "TrainerController.java"
Cohesion: 0.09
Nodes (12): RequestMapping, RestController, StatsController, AiPlanContextDTO, CommunityComparisonDTO, MetricDeltaDTO, MonthlyStatsResponseDTO, PlanEvolutionResponseDTO (+4 more)

### Community 37 - "aiDraft.ts"
Cohesion: 0.18
Nodes (22): attentionFor(), autoSubtitle(), bareTag(), dayLabel(), nameKey(), PreviewPlan, setsByMuscle(), tagsFor() (+14 more)

### Community 38 - "UserService"
Cohesion: 0.17
Nodes (7): UpdateWeightRequestDTO, UserProfileResponseDTO, WeightHistory, WeightHistoryRepository, WorkoutExecutionLogRepository, UserService, org.springframework.security.crypto.password.PasswordEncoder

### Community 39 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, path

### Community 40 - "kinetic-desktop/src/services/trainerService.ts"
Cohesion: 0.13
Nodes (20): AiPlanFlow(), bodyText(), HttpError, Props, Step, AiPlanGenerating(), Props, SKELETON_ACCENTS (+12 more)

### Community 41 - "Design System Specification: High-Performance Athleticism"
Cohesion: 0.11
Nodes (17): 1. Overview & Creative North Star: "The Digital Kineticist", 2. Colors: Tonal Depth & The Neon Pulse, 3. Typography: Editorial Authority, 4. Elevation & Depth: Tonal Layering, 5. Components: The Athletic Kit, 6. Do’s and Don’ts, Buttons (The Kinetic Drivers), Cards & Lists (The Performance Modules) (+9 more)

### Community 42 - "AiPlanComposer.tsx"
Cohesion: 0.12
Nodes (15): KineticSelect(), KineticSelectOption, Props, toRadix(), AiRequestForm, joinPt(), LETTERS, AiPlanComposer() (+7 more)

### Community 43 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+12 more)

### Community 44 - "StorageService"
Cohesion: 0.15
Nodes (7): com.fasterxml.jackson.annotation.JsonIgnoreProperties, CreateStoryRequest, SuppressWarnings, RemoteObject, SignedItem, StorageService, SupabaseListItem

### Community 45 - "AppRoutes.tsx"
Cohesion: 0.03
Nodes (38): App(), BottomTabBar(), GRADIENT_COLORS, GRADIENT_LOCATIONS, IconName, ROUTE_META, styles, T (+30 more)

### Community 46 - "SocialService"
Cohesion: 0.17
Nodes (5): FeedAuthorDTO, FeedPostDTO, CreatePostRequest, SuppressWarnings, SocialService

### Community 47 - "treino-detalhe.jsx"
Cohesion: 0.11
Nodes (7): DAY_ACCENT, FICHA, HKT, SECOES, TOTAL_EXERCICIOS, TOTAL_VOLUME_KG, TTAB_ICONS

### Community 48 - "profile.jsx"
Cohesion: 0.11
Nodes (3): Ic, PF, USER

### Community 49 - "WorkoutPlansTab.tsx"
Cohesion: 0.15
Nodes (14): ConfirmDialog(), EditorMode, ACCENTS, approvedLabel(), bareTag(), dayLabel(), lastDoneLabel(), nextTag() (+6 more)

### Community 50 - "expo"
Cohesion: 0.11
Nodes (18): backgroundColor, foregroundImage, adaptiveIcon, expo, android, icon, ios, name (+10 more)

### Community 51 - "ActiveSessionScreen.tsx"
Cohesion: 0.16
Nodes (15): Props, SerieCard(), SerieStatus, styles, useWorkoutPresence(), ActiveSessionScreen(), localDateString(), requiresWeight() (+7 more)

### Community 52 - "stats.jsx"
Cohesion: 0.11
Nodes (5): DATA, Icons, INSIGHTS, PERIODS, T

### Community 53 - "treinar.jsx"
Cohesion: 0.11
Nodes (4): ACCENTS, FICHAS_DATA, HKT, TTAB_ICONS

### Community 54 - "SecurityConfig.java"
Cohesion: 0.23
Nodes (12): SecurityConfig, CustomUserDetailsService, JwtAuthenticationFilter, org.springframework.context.annotation.Bean, org.springframework.security.authentication.AuthenticationProvider, org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration, org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity, org.springframework.security.config.annotation.web.builders.HttpSecurity (+4 more)

### Community 55 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 56 - "dependencies"
Cohesion: 0.12
Nodes (17): clsx, dependencies, axios, clsx, motion, react, react-dom, recharts (+9 more)

### Community 58 - "JwtChannelInterceptor"
Cohesion: 0.18
Nodes (12): jakarta.servlet.FilterChain, Override, Override, SuppressWarnings, JwtChannelInterceptor, org.springframework.messaging.Message, org.springframework.messaging.MessageChannel, org.springframework.messaging.simp.stomp.StompHeaderAccessor (+4 more)

### Community 59 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+9 more)

### Community 60 - "rootService.ts"
Cohesion: 0.15
Nodes (16): CompaniesPage(), formatDate(), CompliancePage(), formatDate(), PersonaisPage(), createCompany(), CreateCompanyPayload, createPersonal() (+8 more)

### Community 61 - "Kinetic App"
Cohesion: 0.12
Nodes (16): 1.1. Configurar variáveis de ambiente, 1.2. Rodar a aplicação, 1.3. Rodar o backend com Docker, 1. Subindo o backend (`kinetic-backend`), 2.1. Instalar dependências, 2.2. Configurar a URL da API, 2.3. Rodar o app, 2. Subindo o app mobile (`KineticApp`) (+8 more)

### Community 62 - "EmpresaController"
Cohesion: 0.17
Nodes (7): EmpresaController, GetMapping, PostMapping, RequestMapping, RestController, VincularAlunoRequestDTO, VincularFuncionarioRequestDTO

### Community 63 - "WebSocketConfig.java"
Cohesion: 0.22
Nodes (10): HandshakeInterceptor, Override, SuppressWarnings, WebSocketConfig, org.springframework.messaging.simp.config.ChannelRegistration, org.springframework.messaging.simp.config.MessageBrokerRegistry, org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker, org.springframework.web.socket.config.annotation.StompEndpointRegistry (+2 more)

### Community 65 - "🏋️ Plano — Painel Desktop do Personal (Kinetic)"
Cohesion: 0.17
Nodes (11): 📌 Decisão de Arquitetura (fechada), 🧭 Diretrizes de Execução, 📎 Estado atual do código (âncoras), Fase 0 — Identidade e Papéis (backend), Fase 1 — Vínculo + Convite (backend + **app mobile**), Fase 2 — Chat personal↔aluno (backend + app mobile), Fase 3+ — Dashboards do Personal e telas de EMPRESA (depois), 👥 Modelo de Papéis (4 roles) (+3 more)

### Community 66 - "auth.jsx"
Cohesion: 0.13
Nodes (3): A, FAKE_USER, Ic

### Community 67 - "🚀 Plano de Implementação: Blindagem de Dados, UX e Dashboard de Desempenho"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Refatoração Back-end: Blindagem de Dados (Java), 3. Refatoração Front-end: ActiveSessionScreen.tsx (UX e Validações), 4. StatsScreen e Evolução Mensal (TypeScript & Gifted Charts), 5. Diretrizes Técnicas para o Agente (IDE), A. Atualização do `SetLogDto.java`, A. Dashboards Visuais (StatsScreen.tsx), A. Validação Individual de Série (Botão Check) (+4 more)

### Community 68 - "4. Front-end (React Native)"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Regras de Negócio e Lógica Matemática, 3. Back-end (Spring Boot 3.2.x - Java 17), 4. Front-end (React Native), A. Gerenciamento de Estado (useState), A. Nova Entidade e Tabela (`WorkoutSession`), B. Hook do Cronômetro (useEffect), B. Novo Endpoint de Registro (+4 more)

### Community 72 - "JwtUtil"
Cohesion: 0.26
Nodes (4): io.jsonwebtoken.Claims, javax.crypto.SecretKey, Override, JwtUtil

### Community 73 - "ChatPanel.tsx"
Cohesion: 0.28
Nodes (13): ChatPanel(), dayKey(), dayLabel(), formatTime(), Props, QUICK_REPLIES, ChatSocket, connectChatSocket() (+5 more)

### Community 74 - "protocol.ts"
Cohesion: 0.13
Nodes (14): DAYS_LABELS, FREQUENCY_OPTIONS, GOAL_API_MAP, GOAL_OPTIONS, GoalDef, GOALS, GoalType, LEVEL_API_MAP (+6 more)

### Community 75 - "home.jsx"
Cohesion: 0.15
Nodes (5): HK, MOCK, PosColor(), RankingSection(), TAB_ICONS

### Community 76 - "🛡️ Plano de Refatoração: Onboarding Clínico e Blindagem do Prompt (IA)"
Cohesion: 0.18
Nodes (10): 1. Back-end: Ajuste na Entidade `User` (JPA/Hibernate), 1. Visão Geral, 2. Refatoração Back-end (Java Spring Boot), 3. Refatoração Front-end (React Native / TypeScript), 4. Diretrizes, A. Atualização de Entidades e DTOs, A. Nova Tela/Etapa no Onboarding (`MedicalHistoryScreen.tsx` ou Step equivalente), 🛠️ Adendo ao Plano: Persistência e Tratamento de Exceção da IA (+2 more)

### Community 77 - "PresenceService"
Cohesion: 0.22
Nodes (5): jakarta.servlet.http.HttpServletRequest, Override, LastActiveInterceptor, PresenceService, org.springframework.web.servlet.HandlerInterceptor

### Community 78 - "TrainerChatScreen.tsx"
Cohesion: 0.27
Nodes (11): formatTime(), RouteParams, st, TrainerChatScreen(), ChatSocket, connectChatSocket(), getMessages(), markConversationRead() (+3 more)

### Community 79 - "dependencies"
Cohesion: 0.15
Nodes (13): expo-blur, dependencies, axios, expo-blur, react-native-dotenv, react-native-gesture-handler, react-native-gifted-charts, @react-navigation/drawer (+5 more)

### Community 80 - "org.springframework.context.annotation.Configuration"
Cohesion: 0.22
Nodes (8): io.swagger.v3.oas.models.OpenAPI, OpenApiConfig, Override, WebMvcConfig, OpenAPI, org.springframework.context.annotation.Configuration, org.springframework.web.servlet.config.annotation.InterceptorRegistry, org.springframework.web.servlet.config.annotation.WebMvcConfigurer

### Community 81 - "RefreshTokenService"
Cohesion: 0.27
Nodes (4): java.security.SecureRandom, RefreshTokenRepository, RefreshTokenService, RotationResult

### Community 83 - "StudentDetailPage.tsx"
Cohesion: 0.23
Nodes (10): Avatar(), initialsOf(), Props, sinceLabel(), StudentDetailPage(), TabId, TABS, useMediaQuery() (+2 more)

### Community 84 - "🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App)"
Cohesion: 0.22
Nodes (8): 📌 Contexto e Arquitetura, Fase 1: Fundação e Conexão com Supabase, Fase 2: Entidade de Autenticação (Traditional Login), Fase 3: Controllers de Entrada, 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App), 📐 Padrões de Código e Clean Architecture, 🗺️ Roadmap de Execução (Modo Agêntico), 🛠️ Stack Tecnológico Obrigatório

### Community 85 - "Mudanças"
Cohesion: 0.15
Nodes (12): 1. Armazenamento seguro de tokens — novo módulo `tokenStorage`, 2. Conceito de "usuário lembrado" + desbloqueio — `AuthContext.tsx`, 3. Telas novas, 4. Roteamento — `AppRoutes.tsx`, 5. Ajuste no `LoginScreen.js`, 6. Bootstrap sem "piscar" de tela — Splash até estar pronto, Contexto, Dependências novas (frontend) (+4 more)

### Community 86 - "JacksonConfig.java"
Cohesion: 0.27
Nodes (7): com.fasterxml.jackson.core.JsonGenerator, com.fasterxml.jackson.databind.ser.std.StdSerializer, com.fasterxml.jackson.databind.SerializerProvider, JacksonConfig, Override, LocalDateTimeAsUtcSerializer, org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer

### Community 88 - "empresaService.ts"
Cohesion: 0.25
Nodes (10): ClientesPage(), formatDate(), FuncionariosPage(), desvincularAluno(), desvincularFuncionario(), listClientes(), listFuncionarios(), vincularAluno() (+2 more)

### Community 89 - "3. Ações Exigidas para a IA (Passo a Passo do Debug)"
Cohesion: 0.25
Nodes (7): 1. Contexto do Problema, 2. Suspeitos Principais, 3. Ações Exigidas para a IA (Passo a Passo do Debug), A. Adicionar Logs de Rastreamento (Tracing), B. Blindar o Recebimento da Data, C. Expor a Exceção Raiz, 🐛 Plano de Debug: Resolução da Quebra Silenciosa na Geração de Treino

### Community 90 - "Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)"
Cohesion: 0.25
Nodes (7): 1.1. Alterações na Entidade `User`, 1.2. Entidade de Log: `WorkoutExecutionLog`, 1. Persistência de Dados (JPA/Hibernate), 2.1. Lógica do Algoritmo "Próxima Ficha Pendente", 2. Motor de Busca de Treinos (`WorkoutService`), 3. Arquitetura do Contrato BFF (`HomeDashboardResponseDTO`), Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)

### Community 92 - ".avatarOf"
Cohesion: 0.22
Nodes (3): AddCommentRequest, CommentDTO, PendingRequestDTO

### Community 93 - "2. Front-end: UI/UX e Navegação (React Native + TS)"
Cohesion: 0.20
Nodes (9): 1.1. Status de Onboarding do Usuário, 1.2. Lógica de "Próxima Ficha Disponível", 1. Back-end: Inteligência e Persistência (Java Spring Boot), 2.1. Reestruturação da Navegação, 2.2. Lógica de Redirecionamento (Conditional Rendering), 2.3. Refatoração Visual do Dashboard (Design Premium), 2. Front-end: UI/UX e Navegação (React Native + TS), 3. Checklist de Implementação (+1 more)

### Community 94 - "kinetic-desktop/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 95 - "KineticApp/src/services/trainerService.ts"
Cohesion: 0.33
Nodes (7): ProfileScreen(), acceptInvite(), declineInvite(), getMyTrainer(), getPendingInvites(), formatMemberSince(), formatProfileName()

### Community 98 - "KineticApp/package.json"
Cohesion: 0.25
Nodes (7): main, name, overrides, glob, rimraf, private, version

### Community 99 - "ProtocolSection"
Cohesion: 0.25
Nodes (8): ageFromBirthDate(), goalLabel(), hasMedicalInfo(), levelLabel(), AnamnesisModal(), isoToDisplay(), MetricsModal(), ProtocolSection()

### Community 100 - "compilerOptions"
Cohesion: 0.29
Nodes (6): compilerOptions, allowJs, jsx, strict, extends, expo/tsconfig.base

### Community 101 - "Plano de Refatoração: Onboarding Flow (React -> TSX Estrito)"
Cohesion: 0.29
Nodes (6): Diretrizes de Tipagem (Strict TypeScript), Objetivo, Plano de Refatoração: Onboarding Flow (React -> TSX Estrito), Tarefa 1: Substituição de "Idade" por "Data de Nascimento", Tarefa 2: Criação da Etapa de Anamnese, Tarefa 3: Atualização do Controlador Principal (`OnboardingFlow`)

### Community 102 - "PresenceStatus"
Cohesion: 0.33
Nodes (4): PresenceStatus, OFFLINE, ONLINE, TRAINING

### Community 103 - "kinetic-desktop/src/utils/jwt.ts"
Cohesion: 0.53
Nodes (5): base64Decode(), base64UrlDecode(), decodeJwt(), isJwtExpired(), JwtPayload

### Community 104 - "kinetic-desktop/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, baseUrl, paths, files, references

### Community 106 - "PostIntensity"
Cohesion: 0.40
Nodes (4): PostIntensity, ALTA, LEVE, MODERADO

### Community 107 - "KineticApplication"
Cohesion: 0.60
Nodes (3): KineticApplication, org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.scheduling.annotation.EnableScheduling

### Community 108 - "PerfilLogoffButton.md"
Cohesion: 0.33
Nodes (5): 1. Front-end: Camada de Contexto (`AuthContext.tsx`), 2.1. Tokens de Estilização e Specs Visuais (Image Reference), 2. Front-end: UI do Modal (ProfileScreen.tsx), 3.1. Controle de Estado do Modal, 3. Lógica de Integração e Fluxo

### Community 109 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, android, ios, start, web

### Community 110 - "ExerciseCard.tsx"
Cohesion: 0.40
Nodes (3): Exercise, Props, styles

### Community 113 - "ConnectionStatus"
Cohesion: 0.50
Nodes (3): ConnectionStatus, ACCEPTED, PENDING

## Knowledge Gaps
- **587 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+582 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `org.springframework.transaction.annotation.Transactional`, `org.springframework.stereotype.Service`, `CompanyService`, `UserService`, `lombok.Getter`, `PresenceStatus`, `AuthController.java`, `TrainerAiPlanService`, `org.springframework.data.jpa.repository.Query`, `PresenceService`, `SocialService`, `RefreshTokenService`, `.findByEmail`, `JwtChannelInterceptor`, `.avatarOf`, `WorkoutSessionRepository`, `HomeAggregatorService`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `UserRepository` connect `User` to `org.springframework.transaction.annotation.Transactional`, `org.springframework.stereotype.Service`, `CompanyService`, `UserService`, `lombok.Getter`, `TrainerAiPlanService`, `AuthController.java`, `org.springframework.data.jpa.repository.Query`, `PresenceService`, `SocialService`, `SecurityConfig.java`, `lombok.RequiredArgsConstructor`, `WorkoutSessionRepository`, `HomeAggregatorService`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `StatsPeriodParam` connect `Override` to `org.springframework.stereotype.Service`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `User` (e.g. with `.run()` and `.loadUserByUsername()`) actually correct?**
  _`User` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _587 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.040594059405940595 - nodes in this community are weakly interconnected._
- **Should `org.springframework.transaction.annotation.Transactional` be split into smaller, more focused modules?**
  _Cohesion score 0.05929989550679206 - nodes in this community are weakly interconnected._