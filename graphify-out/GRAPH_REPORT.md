# Graph Report - KinectApp  (2026-10-16)

## Corpus Check
- 479 files · ~229,009 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3202 nodes · 7950 edges · 200 communities (138 shown, 62 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 512 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67d64db3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- org.springframework.transaction.annotation.Transactional
- sidebar.tsx
- StorageService
- class-variance-authority
- WorkoutSessionRepository
- socialService.ts
- org.slf4j.Logger
- Role
- TrainerAiPlanService
- HomeAggregatorService
- expo-image-picker
- UserRepository
- ProfileScreen.tsx
- HomeScreen.tsx
- react-native
- WorkoutPlanRepository
- lombok.Getter
- WorkoutSessionService.java
- FinancePage.tsx
- KineticApp/src/types/index.ts
- TrainerController
- PaymentGateway
- react-native-gesture-handler
- BillingService
- AsaasPaymentGateway
- AppRoutes.tsx
- src/App.tsx
- sonner
- PersonaisPage.tsx
- WorkoutPlan
- StudentFinanceService
- TrainerInviteCodeService
- EmpresaHomePage.tsx
- metro.config.js
- User
- TrainerFinanceController
- lombok.Data
- HandlerInterceptor
- StudentsListPage.tsx
- Icon.tsx
- RuntimeException
- io.swagger.v3.oas.annotations.tags.Tag
- org.springframework.data.jpa.repository.Query
- dependencies
- StudentEngagementDTO
- BillingPage.tsx
- ActiveSessionScreen.tsx
- react-native-svg
- BillingPlan
- Banco de dados do Kinetic
- CommandLineRunner
- PhoneGate.tsx
- .findByEmail
- KineticApp/src/contexts/AuthContext.tsx
- Override
- PlanEditor.tsx
- Sessão de 16/10/2026 — evolução do painel do personal
- protocol.ts
- expo-linear-gradient
- OnboardingScreen.tsx
- WorkoutScreen.tsx
- GlobalExceptionHandler
- PresenceStatus
- SocialService
- TrainerLinkDTO
- onboarding.jsx
- KineticApp/src/services/trainerService.ts
- TrainerBillingController
- devDependencies
- AiPlanFlow.tsx
- StatsController
- .avatarOf
- DashboardTab.tsx
- compilerOptions
- 🚀 Plano de Implementação: Blindagem de Dados, UX e Dashboard de Desempenho
- rootService.ts
- 🏋️ Plano — Painel Desktop do Personal (Kinetic)
- dependencies
- PostLikeRepository
- kinetic-desktop/package.json
- 4. Front-end (React Native)
- RegisterScreen.tsx
- compilerOptions
- AsaasWebhookController
- TrainerSubscription
- kinetic-desktop/src/types/index.ts
- Auditoria de segurança — KinectApp
- empresaService.ts
- StoryDTO
- KineticUserDetails
- Design System Specification: High-Performance Athleticism
- expo
- treino-detalhe.jsx
- profile.jsx
- RefreshTokenService
- scripts
- WorkoutPlansTab.tsx
- 🛡️ Plano de Refatoração: Onboarding Clínico e Blindagem do Prompt (IA)
- UserConnection
- PlanLimitExceededException
- stats.jsx
- treinar.jsx
- components.json
- cn
- Kinetic App
- OncePerRequestFilter
- org.springframework.http.ResponseEntity
- 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App)
- expo-secure-store
- expo-splash-screen
- .generateJson
- radix-ui
- BaseController
- auth.jsx
- tweaks-panel (1).jsx
- treino-sessao.jsx
- tweaks-panel.jsx
- SecurityConfig.java
- react-dom
- tailwind-merge
- tw-animate-css
- @react-navigation/bottom-tabs
- home.jsx
- AssessmentsTab.tsx
- expo-local-authentication
- react
- KineticApp/package.json
- GeminiRequestDto
- Mudanças
- Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)
- 3. Ações Exigidas para a IA (Passo a Passo do Debug)
- PresenceService
- JacksonConfig.java
- react-native-dotenv
- react-native-gifted-charts
- react-native-safe-area-context
- FeedbacksPage.tsx
- 2. Front-end: UI/UX e Navegação (React Native + TS)
- react-native-screens
- PerfilLogoffButton.md
- Pesquisa de mercado — MFIT, Tecnofit e Trainerize (out/2026)
- react-native-worklets
- @react-navigation/drawer
- @react-navigation/native
- @react-navigation/native-stack
- @types/react
- compilerOptions
- JwtAuthenticationFilter.java
- io.swagger.v3.oas.annotations.Operation
- Plano de Refatoração: Onboarding Flow (React -> TSX Estrito)
- typescript
- User
- UserDetailsService
- StoryViewer.tsx
- tailwind
- kinetic-desktop/src/utils/jwt.ts
- kinetic-desktop/tsconfig.json
- WebMvcConfigurer
- ConnectionRequestsModal.tsx
- .handleBillingGateway
- AiPlanPreviewException
- Plano de Implementação: Integração do Perfil Dinâmico (ProfileScreen)
- ExerciseCard.tsx
- KineticApplication
- PostIntensity
- AiQuotaExceededException
- 1. Banco de Dados (Flyway / PostgreSQL)
- CustomButton.tsx
- org.springframework.context.annotation.Configuration
- ConnectionStatus
- EmailNotVerifiedException
- TrainerManagedPlanException
- next-themes
- CreatePostRequest.java
- CreateStoryRequest.java
- WorkoutSessionLogRequestDTO.java
- kinetic-desktop/src/theme/colors.ts
- CLAUDE.md
- GEMINI.md
- orfaoPlan.md
- com.kinetic:kinetic-backend
- todo.md
- WebSocketMessageBrokerConfigurer
- ChannelInterceptor

## God Nodes (most connected - your core abstractions)
1. `User` - 152 edges
2. `cn()` - 102 edges
3. `UserRepository` - 80 edges
4. `SocialService` - 44 edges
5. `TrainerClientRepository` - 35 edges
6. `TrainerController` - 34 edges
7. `BillingService` - 34 edges
8. `WorkoutSessionRepository` - 32 edges
9. `WorkoutPlan` - 31 edges
10. `StatsService` - 31 edges

## Surprising Connections (you probably didn't know these)
- `ExerciseRow()` --calls--> `muscleLabel()`  [EXTRACTED]
  kinetic-desktop/src/components/personal/PlanEditor.tsx → kinetic-desktop/src/components/personal/workoutVocab.ts
- `SheetOverlay()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/sheet.tsx → kinetic-desktop/src/utils/cn.ts
- `SheetFooter()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/sheet.tsx → kinetic-desktop/src/utils/cn.ts
- `SidebarInput()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/sidebar.tsx → kinetic-desktop/src/utils/cn.ts
- `SidebarSeparator()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/sidebar.tsx → kinetic-desktop/src/utils/cn.ts

## Import Cycles
- None detected.

## Communities (200 total, 62 thin omitted)

### Community 0 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.10
Nodes (11): EmpresaStudentLinkDTO, FeedbackDTO, PeerDTO, ActiveTrainerConflictException, SuppressWarnings, EmpresaService, SuppressWarnings, Feedback (+3 more)

### Community 1 - "sidebar.tsx"
Cohesion: 0.06
Nodes (41): ROLE_SUBTITLE, Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle() (+33 more)

### Community 2 - "StorageService"
Cohesion: 0.15
Nodes (7): com.fasterxml.jackson.annotation.JsonIgnoreProperties, CreateStoryRequest, SuppressWarnings, RemoteObject, SignedItem, StorageService, SupabaseListItem

### Community 4 - "WorkoutSessionRepository"
Cohesion: 0.06
Nodes (27): com.fasterxml.jackson.databind.ObjectMapper, AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table, PlanCycleSnapshot (+19 more)

### Community 5 - "socialService.ts"
Cohesion: 0.07
Nodes (53): CommentsSheet(), Props, styles, FeedPost(), Props, styles, INTENSITY_LABELS, INTENSITY_OPTIONS (+45 more)

### Community 6 - "org.slf4j.Logger"
Cohesion: 0.06
Nodes (22): Override, RootUserSeeder, AuthResponseDTO, GeneratedExerciseDto, GeneratedWorkoutPlanDto, RefreshResponseDTO, RegisterDTO, InvalidCodeException (+14 more)

### Community 7 - "Role"
Cohesion: 0.05
Nodes (28): PostMapping, CompanyDTO, CreateCompanyRequestDTO, CreatePersonalRequestDTO, GrowthPoint, RootMetricsDTO, UpdatePhoneRequestDTO, UpdateUserStatusRequestDTO (+20 more)

### Community 8 - "TrainerAiPlanService"
Cohesion: 0.06
Nodes (25): PostMapping, PutMapping, RequestMapping, RestController, TrainerAssessmentController, AiPlanDraftDTO, Exercise, Note (+17 more)

### Community 9 - "HomeAggregatorService"
Cohesion: 0.12
Nodes (9): HomeDashboardResponseDTO, NextWorkoutResponseDTO, RankingEntryDTO, WeeklyActivityPointDTO, HomeAggregatorService, HomeDashboardResponseDTO, RankingEntryDTO, SuppressWarnings (+1 more)

### Community 11 - "UserRepository"
Cohesion: 0.10
Nodes (24): jakarta.persistence.EntityNotFoundException, java.security.SecureRandom, EmpresaAnalyticsDTO, InstructorPerf, VolumePoint, TrainerLinkSource, COMPANY, INVITE (+16 more)

### Community 12 - "ProfileScreen.tsx"
Cohesion: 0.06
Nodes (21): ProtocolOption, AccountSectionProps, AnamnesisModalProps, Badge, C, ChangePasswordModalProps, HeroUserData, Icons (+13 more)

### Community 13 - "HomeScreen.tsx"
Cohesion: 0.07
Nodes (40): AppHeader(), AppHeaderProps, styles, AdherenceCard(), AdherenceCardProps, styles, getGreeting(), HomeGreeting() (+32 more)

### Community 15 - "WorkoutPlanRepository"
Cohesion: 0.15
Nodes (4): GenerateWorkoutRequestDto, WorkoutPlanRepository, WorkoutService, org.springframework.data.jpa.repository.EntityGraph

### Community 16 - "lombok.Getter"
Cohesion: 0.09
Nodes (36): Company, Entity, Table, EmailVerificationCode, Entity, Table, Feedback, Entity (+28 more)

### Community 17 - "WorkoutSessionService.java"
Cohesion: 0.13
Nodes (13): jakarta.persistence.Entity, jakarta.persistence.Table, LogSessionRequestDTO, SetLogDto, DuplicateWorkoutSessionException, ExerciseSetLog, Entity, Table (+5 more)

### Community 18 - "FinancePage.tsx"
Cohesion: 0.16
Nodes (25): ChargeRow(), errorText(), FinancePage(), MoneyTile(), PlanTarget, reminderMessage(), STATUS_META, getFinance() (+17 more)

### Community 19 - "KineticApp/src/types/index.ts"
Cohesion: 0.04
Nodes (64): EvolutionModal(), cardS, chipS, DeltaChip(), emptyS, insightS, PlanEvolutionCard(), PlanEvolutionCardProps (+56 more)

### Community 20 - "TrainerController"
Cohesion: 0.06
Nodes (17): DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, TrainerController, AiPlanContextDTO, CommunityComparisonDTO (+9 more)

### Community 23 - "BillingService"
Cohesion: 0.24
Nodes (4): BillingOverviewDTO, AiAllowance, BillingService, SuppressWarnings

### Community 24 - "AsaasPaymentGateway"
Cohesion: 0.28
Nodes (3): com.fasterxml.jackson.databind.JsonNode, AsaasPaymentGateway, Override

### Community 25 - "AppRoutes.tsx"
Cohesion: 0.05
Nodes (29): BottomTabBar(), GRADIENT_COLORS, GRADIENT_LOCATIONS, IconName, ROUTE_META, styles, T, Stack (+21 more)

### Community 26 - "src/App.tsx"
Cohesion: 0.11
Nodes (31): App(), RoleAwareRedirect(), AppSidebar(), Toaster(), homeForRole(), isPanelRole(), NAV_BY_ROLE, NavItem (+23 more)

### Community 28 - "PersonaisPage.tsx"
Cohesion: 0.17
Nodes (30): PageHeader(), Props, Props, Props, MAP, StatusBadge(), Button(), buttonVariants (+22 more)

### Community 29 - "WorkoutPlan"
Cohesion: 0.20
Nodes (9): java.util.regex.Pattern, ExerciseResponseDTO, WorkoutPlanResponseDTO, Exercise, Entity, Table, Entity, Table (+1 more)

### Community 30 - "StudentFinanceService"
Cohesion: 0.18
Nodes (8): java.time.YearMonth, PlanDTO, ChargeDTO, FinanceOverviewDTO, PlanDTO, StudentRefDTO, SuppressWarnings, StudentFinanceService

### Community 31 - "TrainerInviteCodeService"
Cohesion: 0.18
Nodes (7): Entity, Table, TrainerInviteCode, TrainerInviteCodeRepository, SuppressWarnings, TrainerInviteCode, TrainerInviteCodeService

### Community 32 - "EmpresaHomePage.tsx"
Cohesion: 0.10
Nodes (28): CHART, InstructorBarChart(), nf, shortDate(), tooltipStyle, VolumeLineChart(), PERIODS, PeriodTabs() (+20 more)

### Community 33 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, path

### Community 34 - "User"
Cohesion: 0.11
Nodes (11): com.fasterxml.jackson.core.type.TypeReference, TodayItemDTO, AiPlanGeneration, Entity, Table, Entity, Table, User (+3 more)

### Community 35 - "TrainerFinanceController"
Cohesion: 0.13
Nodes (11): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TrainerFinanceController, FinanceRequestDTOs (+3 more)

### Community 36 - "lombok.Data"
Cohesion: 0.10
Nodes (15): jakarta.servlet.http.HttpServletResponse, jakarta.validation.constraints.Pattern, AuthController, PostMapping, RequestMapping, RestController, SuppressWarnings, ConfirmEmailDTO (+7 more)

### Community 38 - "StudentsListPage.tsx"
Cohesion: 0.06
Nodes (59): Avatar(), initialsOf(), Props, CountUp(), CountUpProps, EASE_OUT, ProgressRing(), ProgressRingProps (+51 more)

### Community 39 - "Icon.tsx"
Cohesion: 0.11
Nodes (33): CustomInput(), Props, styles, EvolutionModalProps, styles, HeaderLogo(), Props, styles (+25 more)

### Community 41 - "io.swagger.v3.oas.annotations.tags.Tag"
Cohesion: 0.08
Nodes (22): io.swagger.v3.oas.annotations.tags.Tag, BaseController, HomeController, PublicInviteController, UserController, WorkoutController, WorkoutSessionController, ChangePasswordDTO (+14 more)

### Community 42 - "org.springframework.data.jpa.repository.Query"
Cohesion: 0.08
Nodes (14): EmailVerificationCodeRepository, ExerciseRepository, FeedbackRepository, PasswordResetCodeRepository, SocialPostRepository, StudentBillingPlanRepository, StudentChargeRepository, UserLoginStreakRepository (+6 more)

### Community 43 - "dependencies"
Cohesion: 0.15
Nodes (13): expo, expo-blur, expo-status-bar, dependencies, axios, expo, expo-blur, expo-status-bar (+5 more)

### Community 44 - "StudentEngagementDTO"
Cohesion: 0.20
Nodes (5): Alert, StudentEngagementDTO, StudentRiskRules, StudentRiskRulesTest, org.junit.jupiter.api.Test

### Community 45 - "BillingPage.tsx"
Cohesion: 0.25
Nodes (14): BillingPage(), openCheckout(), PlanCard(), StatusCard(), DemoCheckoutPage(), PlanChip(), billingErrorMessage(), cancelSubscription() (+6 more)

### Community 46 - "ActiveSessionScreen.tsx"
Cohesion: 0.15
Nodes (16): Props, SerieCard(), SerieStatus, styles, useWorkoutPresence(), ActiveSessionScreen(), localDateString(), requiresWeight() (+8 more)

### Community 48 - "BillingPlan"
Cohesion: 0.15
Nodes (10): DemoPaymentGateway, Override, GatewaySubscription, PaymentGateway, BillingPlan, BUSINESS, MAX, PLUS (+2 more)

### Community 49 - "Banco de dados do Kinetic"
Cohesion: 0.08
Nodes (25): Banco de dados do Kinetic, Chat, `chat_messages`, Como evoluir o schema, `companies`, Convenções e inconsistências, Execução e métricas, `feedbacks` (+17 more)

### Community 51 - "PhoneGate.tsx"
Cohesion: 0.21
Nodes (14): PhoneDialog(), PhoneDialogProps, PhoneGate(), PhoneGateContext, PhoneState, formatCNPJ(), formatCPF(), isValidCNPJ() (+6 more)

### Community 53 - "KineticApp/src/contexts/AuthContext.tsx"
Cohesion: 0.11
Nodes (28): App(), AuthContextValue, AuthProvider(), AuthResult, CompleteOnboardingData, KineticUser, RememberedUser, WorkoutPlanItem (+20 more)

### Community 54 - "Override"
Cohesion: 0.10
Nodes (13): endDate(), fromString(), Override, previousEndDate(), previousStartDate(), startDate(), StatsPeriodParam, MONTH (+5 more)

### Community 55 - "PlanEditor.tsx"
Cohesion: 0.09
Nodes (32): KineticSelect(), KineticSelectOption, Props, toRadix(), autoSubtitle(), blankExercise(), Draft, DraftExercise (+24 more)

### Community 56 - "Sessão de 16/10/2026 — evolução do painel do personal"
Cohesion: 0.12
Nodes (16): 10. Caixa de entrada "Hoje", 1. Pesquisa de mercado, 2. Link de convite para aluno sem conta, 3. Celular único, 4. Encerrar vínculo com aluno, 5. Cobrança do personal (assinatura do Kinetic), 6. Planos e cota de IA, 7. Painel de aderência com alerta de risco (+8 more)

### Community 57 - "protocol.ts"
Cohesion: 0.11
Nodes (20): ageFromBirthDate(), DAYS_LABELS, FREQUENCY_OPTIONS, GOAL_API_MAP, GOAL_OPTIONS, GoalDef, goalLabel(), GOALS (+12 more)

### Community 59 - "OnboardingScreen.tsx"
Cohesion: 0.07
Nodes (23): AuthContextValue, buildMedicalValue(), DAYS_LABELS, GEN_STEPS, GOAL_API_MAP, GoalDef, GOALS, GoalType (+15 more)

### Community 60 - "WorkoutScreen.tsx"
Cohesion: 0.08
Nodes (17): Accent, ACCENTS, DAY_LETTERS, Exercise, firstName(), formatVolumeKg(), groupSections(), Props (+9 more)

### Community 61 - "GlobalExceptionHandler"
Cohesion: 0.25
Nodes (5): GlobalExceptionHandler, org.springframework.http.converter.HttpMessageNotReadableException, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException

### Community 62 - "PresenceStatus"
Cohesion: 0.33
Nodes (4): PresenceStatus, OFFLINE, ONLINE, TRAINING

### Community 63 - "SocialService"
Cohesion: 0.20
Nodes (5): FeedAuthorDTO, FeedPostDTO, CreatePostRequest, SuppressWarnings, SocialService

### Community 64 - "TrainerLinkDTO"
Cohesion: 0.18
Nodes (8): GetMapping, PostMapping, RequestMapping, RestController, StudentTrainerController, InviteCodeRedeemRequestDTO, TrainerLinkDTO, org.springframework.security.access.prepost.PreAuthorize

### Community 65 - "onboarding.jsx"
Cohesion: 0.07
Nodes (10): AGES, DAYS, DEFAULT_FORM, GOALS, HEIGHTS, K, LEVELS, STEPS (+2 more)

### Community 66 - "KineticApp/src/services/trainerService.ts"
Cohesion: 0.24
Nodes (13): usePendingInviteRedeem(), ProfileScreen(), acceptInvite(), clearPendingInviteCode(), declineInvite(), getMyTrainer(), getPendingInviteCode(), getPendingInvites() (+5 more)

### Community 67 - "TrainerBillingController"
Cohesion: 0.21
Nodes (6): GetMapping, PostMapping, RequestMapping, RestController, TrainerBillingController, SubscribeRequestDTO

### Community 68 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+9 more)

### Community 69 - "AiPlanFlow.tsx"
Cohesion: 0.08
Nodes (45): AiRequestForm, attentionFor(), autoSubtitle(), bareTag(), dayLabel(), joinPt(), LETTERS, nameKey() (+37 more)

### Community 70 - "StatsController"
Cohesion: 0.16
Nodes (7): GetMapping, RequestMapping, RestController, StatsController, MetricDeltaDTO, PlanEvolutionResponseDTO, StatsInsightDTO

### Community 71 - ".avatarOf"
Cohesion: 0.20
Nodes (3): AddCommentRequest, CommentDTO, PendingRequestDTO

### Community 72 - "DashboardTab.tsx"
Cohesion: 0.10
Nodes (16): Charts(), CycleComparison(), DashboardTab(), DeltaPill(), formatShortDate(), groupLabel(), nf0, nf1 (+8 more)

### Community 73 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+16 more)

### Community 74 - "🚀 Plano de Implementação: Blindagem de Dados, UX e Dashboard de Desempenho"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Refatoração Back-end: Blindagem de Dados (Java), 3. Refatoração Front-end: ActiveSessionScreen.tsx (UX e Validações), 4. StatsScreen e Evolução Mensal (TypeScript & Gifted Charts), 5. Diretrizes Técnicas para o Agente (IDE), A. Atualização do `SetLogDto.java`, A. Dashboards Visuais (StatsScreen.tsx), A. Validação Individual de Série (Botão Check) (+4 more)

### Community 75 - "rootService.ts"
Cohesion: 0.18
Nodes (14): CompaniesPage(), formatDate(), CompliancePage(), formatDate(), PersonaisPage(), createCompany(), CreateCompanyPayload, createPersonal() (+6 more)

### Community 76 - "🏋️ Plano — Painel Desktop do Personal (Kinetic)"
Cohesion: 0.17
Nodes (11): 📌 Decisão de Arquitetura (fechada), 🧭 Diretrizes de Execução, 📎 Estado atual do código (âncoras), Fase 0 — Identidade e Papéis (backend), Fase 1 — Vínculo + Convite (backend + **app mobile**), Fase 2 — Chat personal↔aluno (backend + app mobile), Fase 3+ — Dashboards do Personal e telas de EMPRESA (depois), 👥 Modelo de Papéis (4 roles) (+3 more)

### Community 77 - "dependencies"
Cohesion: 0.13
Nodes (15): clsx, dependencies, axios, clsx, lucide-react, motion, react, react-router-dom (+7 more)

### Community 79 - "kinetic-desktop/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 80 - "4. Front-end (React Native)"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Regras de Negócio e Lógica Matemática, 3. Back-end (Spring Boot 3.2.x - Java 17), 4. Front-end (React Native), A. Gerenciamento de Estado (useState), A. Nova Entidade e Tabela (`WorkoutSession`), B. Hook do Cronômetro (useEffect), B. Novo Endpoint de Registro (+4 more)

### Community 81 - "RegisterScreen.tsx"
Cohesion: 0.12
Nodes (12): PhoneRequiredScreen(), A, Props, RegisterScreen(), reqStyles, Requirement, styles, AccountSection() (+4 more)

### Community 82 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+12 more)

### Community 83 - "AsaasWebhookController"
Cohesion: 0.13
Nodes (11): GatewayEvent, Type, IGNORED, PAYMENT_OVERDUE, PAYMENT_PAID, SUBSCRIPTION_ENDED, AsaasWebhookController, PostMapping (+3 more)

### Community 84 - "TrainerSubscription"
Cohesion: 0.18
Nodes (10): SubscriptionStatus, ATIVA, ATRASADA, CANCELADA, PENDENTE, TRIAL, Entity, Table (+2 more)

### Community 85 - "kinetic-desktop/src/types/index.ts"
Cohesion: 0.07
Nodes (46): InviteStudentModal(), Mode, MODES, Props, InviteShare(), PendingInvites(), APP_STORE_URL, InvitePage() (+38 more)

### Community 86 - "Auditoria de segurança — KinectApp"
Cohesion: 0.10
Nodes (19): 1. Reset de senha sem prova de identidade — Crítica, 2. Vínculo empresa → aluno sem consentimento — Alta, 3. STOMP sem autorização de SUBSCRIBE — Alta, 4. Curtidas e comentários sem visibilidade — Média, 5. Ranking manipulável — Baixa, Achados confirmados, Ainda em aberto, ligado a essas mudanças, Auditoria de segurança — KinectApp (+11 more)

### Community 87 - "empresaService.ts"
Cohesion: 0.25
Nodes (10): ClientesPage(), formatDate(), FuncionariosPage(), desvincularAluno(), desvincularFuncionario(), listClientes(), listFuncionarios(), vincularAluno() (+2 more)

### Community 90 - "KineticUserDetails"
Cohesion: 0.47
Nodes (3): KineticUserDetails, org.springframework.security.core.GrantedAuthority, org.springframework.security.core.userdetails.User

### Community 91 - "Design System Specification: High-Performance Athleticism"
Cohesion: 0.11
Nodes (17): 1. Overview & Creative North Star: "The Digital Kineticist", 2. Colors: Tonal Depth & The Neon Pulse, 3. Typography: Editorial Authority, 4. Elevation & Depth: Tonal Layering, 5. Components: The Athletic Kit, 6. Do’s and Don’ts, Buttons (The Kinetic Drivers), Cards & Lists (The Performance Modules) (+9 more)

### Community 92 - "expo"
Cohesion: 0.11
Nodes (18): backgroundColor, foregroundImage, adaptiveIcon, expo, android, icon, ios, name (+10 more)

### Community 93 - "treino-detalhe.jsx"
Cohesion: 0.11
Nodes (7): DAY_ACCENT, FICHA, HKT, SECOES, TOTAL_EXERCICIOS, TOTAL_VOLUME_KG, TTAB_ICONS

### Community 94 - "profile.jsx"
Cohesion: 0.11
Nodes (3): Ic, PF, USER

### Community 95 - "RefreshTokenService"
Cohesion: 0.11
Nodes (10): io.jsonwebtoken.Claims, javax.crypto.SecretKey, Entity, Table, RefreshToken, RefreshTokenRepository, JwtUtil, RefreshTokenService (+2 more)

### Community 96 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, android, ios, start, web

### Community 97 - "WorkoutPlansTab.tsx"
Cohesion: 0.12
Nodes (20): ConfirmDialog(), ACCENTS, approvedLabel(), bareTag(), dayLabel(), lastDoneLabel(), nextTag(), nf0 (+12 more)

### Community 98 - "🛡️ Plano de Refatoração: Onboarding Clínico e Blindagem do Prompt (IA)"
Cohesion: 0.18
Nodes (10): 1. Back-end: Ajuste na Entidade `User` (JPA/Hibernate), 1. Visão Geral, 2. Refatoração Back-end (Java Spring Boot), 3. Refatoração Front-end (React Native / TypeScript), 4. Diretrizes, A. Atualização de Entidades e DTOs, A. Nova Tela/Etapa no Onboarding (`MedicalHistoryScreen.tsx` ou Step equivalente), 🛠️ Adendo ao Plano: Persistência e Tratamento de Exceção da IA (+2 more)

### Community 99 - "UserConnection"
Cohesion: 0.29
Nodes (4): Entity, Table, UserConnection, UserConnectionRepository

### Community 101 - "stats.jsx"
Cohesion: 0.11
Nodes (5): DATA, Icons, INSIGHTS, PERIODS, T

### Community 102 - "treinar.jsx"
Cohesion: 0.11
Nodes (4): ACCENTS, FICHAS_DATA, HKT, TTAB_ICONS

### Community 103 - "components.json"
Cohesion: 0.17
Nodes (11): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+3 more)

### Community 104 - "cn"
Cohesion: 0.07
Nodes (41): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), Card(), CardAction() (+33 more)

### Community 105 - "Kinetic App"
Cohesion: 0.12
Nodes (16): 1.1. Configurar variáveis de ambiente, 1.2. Rodar a aplicação, 1.3. Rodar o backend com Docker, 1. Subindo o backend (`kinetic-backend`), 2.1. Instalar dependências, 2.2. Configurar a URL da API, 2.3. Rodar o app, 2. Subindo o app mobile (`KineticApp`) (+8 more)

### Community 107 - "org.springframework.http.ResponseEntity"
Cohesion: 0.10
Nodes (15): EmpresaController, DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, DeleteMapping, GetMapping (+7 more)

### Community 108 - "🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App)"
Cohesion: 0.22
Nodes (8): 📌 Contexto e Arquitetura, Fase 1: Fundação e Conexão com Supabase, Fase 2: Entidade de Autenticação (Traditional Login), Fase 3: Controllers de Entrada, 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App), 📐 Padrões de Código e Clean Architecture, 🗺️ Roadmap de Execução (Modo Agêntico), 🛠️ Stack Tecnológico Obrigatório

### Community 111 - ".generateJson"
Cohesion: 0.22
Nodes (3): GeminiResult, GeminiUnavailableException, InvalidGeminiResponseException

### Community 114 - "auth.jsx"
Cohesion: 0.13
Nodes (3): A, FAKE_USER, Ic

### Community 118 - "SecurityConfig.java"
Cohesion: 0.23
Nodes (12): SecurityConfig, CustomUserDetailsService, JwtAuthenticationFilter, org.springframework.context.annotation.Bean, org.springframework.security.authentication.AuthenticationProvider, org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration, org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity, org.springframework.security.config.annotation.web.builders.HttpSecurity (+4 more)

### Community 123 - "home.jsx"
Cohesion: 0.15
Nodes (5): HK, MOCK, PosColor(), RankingSection(), TAB_ICONS

### Community 124 - "AssessmentsTab.tsx"
Cohesion: 0.13
Nodes (30): delta(), DERIVED_FIELDS, firstAndLast(), formatMeasure(), MEASURE_FIELDS, MeasureField, nf(), AssessmentsTab() (+22 more)

### Community 127 - "KineticApp/package.json"
Cohesion: 0.25
Nodes (7): main, name, overrides, glob, rimraf, private, version

### Community 128 - "GeminiRequestDto"
Cohesion: 0.21
Nodes (8): Content, GeminiRequestDto, GenerationConfig, Part, Candidate, Content, GeminiResponseDto, Part

### Community 129 - "Mudanças"
Cohesion: 0.15
Nodes (12): 1. Armazenamento seguro de tokens — novo módulo `tokenStorage`, 2. Conceito de "usuário lembrado" + desbloqueio — `AuthContext.tsx`, 3. Telas novas, 4. Roteamento — `AppRoutes.tsx`, 5. Ajuste no `LoginScreen.js`, 6. Bootstrap sem "piscar" de tela — Splash até estar pronto, Contexto, Dependências novas (frontend) (+4 more)

### Community 130 - "Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)"
Cohesion: 0.25
Nodes (7): 1.1. Alterações na Entidade `User`, 1.2. Entidade de Log: `WorkoutExecutionLog`, 1. Persistência de Dados (JPA/Hibernate), 2.1. Lógica do Algoritmo "Próxima Ficha Pendente", 2. Motor de Busca de Treinos (`WorkoutService`), 3. Arquitetura do Contrato BFF (`HomeDashboardResponseDTO`), Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)

### Community 131 - "3. Ações Exigidas para a IA (Passo a Passo do Debug)"
Cohesion: 0.25
Nodes (7): 1. Contexto do Problema, 2. Suspeitos Principais, 3. Ações Exigidas para a IA (Passo a Passo do Debug), A. Adicionar Logs de Rastreamento (Tracing), B. Blindar o Recebimento da Data, C. Expor a Exceção Raiz, 🐛 Plano de Debug: Resolução da Quebra Silenciosa na Geração de Treino

### Community 132 - "PresenceService"
Cohesion: 0.27
Nodes (4): Override, LastActiveInterceptor, PresenceService, org.springframework.web.servlet.HandlerInterceptor

### Community 133 - "JacksonConfig.java"
Cohesion: 0.27
Nodes (7): com.fasterxml.jackson.core.JsonGenerator, com.fasterxml.jackson.databind.ser.std.StdSerializer, com.fasterxml.jackson.databind.SerializerProvider, JacksonConfig, Override, LocalDateTimeAsUtcSerializer, org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer

### Community 137 - "FeedbacksPage.tsx"
Cohesion: 0.39
Nodes (6): Badge(), badgeVariants, FeedbacksPage(), formatDate(), listCompanyFeedbacks(), Feedback

### Community 138 - "2. Front-end: UI/UX e Navegação (React Native + TS)"
Cohesion: 0.20
Nodes (9): 1.1. Status de Onboarding do Usuário, 1.2. Lógica de "Próxima Ficha Disponível", 1. Back-end: Inteligência e Persistência (Java Spring Boot), 2.1. Reestruturação da Navegação, 2.2. Lógica de Redirecionamento (Conditional Rendering), 2.3. Refatoração Visual do Dashboard (Design Premium), 2. Front-end: UI/UX e Navegação (React Native + TS), 3. Checklist de Implementação (+1 more)

### Community 140 - "PerfilLogoffButton.md"
Cohesion: 0.33
Nodes (5): 1. Front-end: Camada de Contexto (`AuthContext.tsx`), 2.1. Tokens de Estilização e Specs Visuais (Image Reference), 2. Front-end: UI do Modal (ProfileScreen.tsx), 3.1. Controle de Estado do Modal, 3. Lógica de Integração e Fluxo

### Community 141 - "Pesquisa de mercado — MFIT, Tecnofit e Trainerize (out/2026)"
Cohesion: 0.22
Nodes (8): 1. O que cada um oferece, 2. Do que as pessoas reclamam, 3. O que isso significa para o Kinetic, Fontes, MFIT, Pesquisa de mercado — MFIT, Tecnofit e Trainerize (out/2026), Tecnofit, Trainerize

### Community 148 - "compilerOptions"
Cohesion: 0.29
Nodes (6): compilerOptions, allowJs, jsx, strict, extends, expo/tsconfig.base

### Community 149 - "JwtAuthenticationFilter.java"
Cohesion: 0.27
Nodes (6): jakarta.servlet.FilterChain, jakarta.servlet.http.HttpServletRequest, Override, Override, org.springframework.security.core.userdetails.UserDetails, org.springframework.web.filter.OncePerRequestFilter

### Community 150 - "io.swagger.v3.oas.annotations.Operation"
Cohesion: 0.12
Nodes (15): io.swagger.v3.oas.annotations.Operation, CreatePostRequest, CreateStoryRequest, DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController (+7 more)

### Community 151 - "Plano de Refatoração: Onboarding Flow (React -> TSX Estrito)"
Cohesion: 0.29
Nodes (6): Diretrizes de Tipagem (Strict TypeScript), Objetivo, Plano de Refatoração: Onboarding Flow (React -> TSX Estrito), Tarefa 1: Substituição de "Idade" por "Data de Nascimento", Tarefa 2: Criação da Etapa de Anamnese, Tarefa 3: Atualização do Controlador Principal (`OnboardingFlow`)

### Community 155 - "StoryViewer.tsx"
Cohesion: 0.38
Nodes (6): Props, StoryViewer(), styles, timeAgo(), { width }, StoryGroup

### Community 156 - "tailwind"
Cohesion: 0.33
Nodes (6): tailwind, baseColor, config, css, cssVariables, prefix

### Community 157 - "kinetic-desktop/src/utils/jwt.ts"
Cohesion: 0.53
Nodes (5): base64Decode(), base64UrlDecode(), decodeJwt(), isJwtExpired(), JwtPayload

### Community 158 - "kinetic-desktop/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, baseUrl, paths, files, references

### Community 160 - "ConnectionRequestsModal.tsx"
Cohesion: 0.50
Nodes (4): ConnectionRequestsModal(), Props, styles, PendingRequest

### Community 164 - "ExerciseCard.tsx"
Cohesion: 0.40
Nodes (3): Exercise, Props, styles

### Community 165 - "KineticApplication"
Cohesion: 0.60
Nodes (3): KineticApplication, org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.scheduling.annotation.EnableScheduling

### Community 166 - "PostIntensity"
Cohesion: 0.40
Nodes (4): PostIntensity, ALTA, LEVE, MODERADO

### Community 170 - "org.springframework.context.annotation.Configuration"
Cohesion: 0.24
Nodes (8): io.swagger.v3.oas.models.OpenAPI, OpenApiConfig, Override, WebMvcConfig, OpenAPI, org.springframework.context.annotation.Configuration, org.springframework.web.servlet.config.annotation.InterceptorRegistry, org.springframework.web.servlet.config.annotation.WebMvcConfigurer

### Community 171 - "ConnectionStatus"
Cohesion: 0.50
Nodes (3): ConnectionStatus, ACCEPTED, PENDING

## Knowledge Gaps
- **660 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+655 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `org.springframework.transaction.annotation.Transactional`, `WorkoutSessionRepository`, `org.slf4j.Logger`, `Role`, `TrainerAiPlanService`, `HomeAggregatorService`, `UserRepository`, `WorkoutPlanRepository`, `lombok.Getter`, `WorkoutSessionService.java`, `BillingService`, `AsaasPaymentGateway`, `WorkoutPlan`, `StudentFinanceService`, `TrainerInviteCodeService`, `io.swagger.v3.oas.annotations.tags.Tag`, `org.springframework.data.jpa.repository.Query`, `BillingPlan`, `.findByEmail`, `PresenceStatus`, `SocialService`, `.avatarOf`, `TrainerSubscription`, `RefreshTokenService`, `UserConnection`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `UserRepository` connect `UserRepository` to `org.springframework.transaction.annotation.Transactional`, `WorkoutSessionRepository`, `PresenceService`, `org.slf4j.Logger`, `Role`, `TrainerAiPlanService`, `HomeAggregatorService`, `WorkoutPlanRepository`, `WorkoutSessionService.java`, `BillingService`, `WorkoutPlan`, `StudentFinanceService`, `TrainerInviteCodeService`, `User`, `io.swagger.v3.oas.annotations.tags.Tag`, `org.springframework.data.jpa.repository.Query`, `SocialService`, `PostLikeRepository`, `SecurityConfig.java`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `PresenceService` connect `PresenceService` to `org.slf4j.Logger`, `io.swagger.v3.oas.annotations.tags.Tag`, `org.springframework.context.annotation.Configuration`, `UserRepository`, `org.springframework.data.jpa.repository.Query`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _660 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `org.springframework.transaction.annotation.Transactional` be split into smaller, more focused modules?**
  _Cohesion score 0.0977891156462585 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0636734693877551 - nodes in this community are weakly interconnected._
- **Should `WorkoutSessionRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.0579476861167002 - nodes in this community are weakly interconnected._