# Graph Report - KinectApp  (2026-10-16)

## Corpus Check
- 476 files · ~228,496 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3196 nodes · 7938 edges · 192 communities (134 shown, 58 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 511 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67d64db3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- org.springframework.transaction.annotation.Transactional
- cn
- StorageService
- class-variance-authority
- StatsService
- KineticApp/src/types/index.ts
- org.slf4j.Logger
- Role
- TrainerAiPlanService
- HomeAggregatorService.java
- expo-image-picker
- lombok.RequiredArgsConstructor
- ProfileScreen.tsx
- HomeScreen.tsx
- react-native
- WorkoutPlan
- lombok.Getter
- UserRepository
- FinancePage.tsx
- StatsScreen.tsx
- io.swagger.v3.oas.annotations.Operation
- PaymentGateway
- react-native-gesture-handler
- BillingService
- AsaasPaymentGateway
- AppRoutes.tsx
- src/App.tsx
- sonner
- PersonaisPage.tsx
- UserAdminDTO
- StudentFinanceService
- TrainerInviteCodeService
- EmpresaHomePage.tsx
- metro.config.js
- User
- TrainerFinanceController
- AuthController.java
- HandlerInterceptor
- StudentsListPage.tsx
- Icon.tsx
- RuntimeException
- WorkoutController.java
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
- KineticApp/src/contexts/AuthContext.tsx
- Override
- PlanEditor.tsx
- Sessão de 16/10/2026 — evolução do painel do personal
- .getFeed
- expo-linear-gradient
- OnboardingScreen.tsx
- WorkoutScreen.tsx
- org.springframework.http.ResponseEntity
- .getSquad
- SocialService
- org.springframework.security.access.prepost.PreAuthorize
- onboarding.jsx
- WorkoutSessionRepository
- BillingOverviewDTO
- devDependencies
- AiPlanFlow.tsx
- io.swagger.v3.oas.annotations.tags.Tag
- .addComment
- DashboardTab.tsx
- compilerOptions
- 🚀 Plano de Implementação: Blindagem de Dados, UX e Dashboard de Desempenho
- WorkoutSessionService
- 🏋️ Plano — Painel Desktop do Personal (Kinetic)
- dependencies
- .getAnalytics
- kinetic-desktop/package.json
- 4. Front-end (React Native)
- RegisterScreen.tsx
- compilerOptions
- GatewayEvent
- SubscriptionStatus
- kinetic-desktop/src/types/index.ts
- Auditoria de segurança — KinectApp
- AiPlanGeneration
- .getStories
- KineticUserDetails
- Design System Specification: High-Performance Athleticism
- expo
- treino-detalhe.jsx
- profile.jsx
- JwtUtil
- scripts
- WorkoutPlansTab.tsx
- 🛡️ Plano de Refatoração: Onboarding Clínico e Blindagem do Prompt (IA)
- VolumeByMuscleGroupDTO
- PlanLimitExceededException
- stats.jsx
- treinar.jsx
- components.json
- CompliancePage.tsx
- Kinetic App
- OncePerRequestFilter
- EmpresaController
- 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App)
- expo-secure-store
- expo-splash-screen
- .getPendingRequests
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
- GeminiService
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
- JwtAuthenticationFilter
- SocialController
- Plano de Refatoração: Onboarding Flow (React -> TSX Estrito)
- typescript
- User
- UserDetailsService
- axios
- kinetic-desktop/src/utils/jwt.ts
- kinetic-desktop/tsconfig.json
- WebMvcConfigurer
- Plano de Implementação: Integração do Perfil Dinâmico (ProfileScreen)
- ExerciseCard.tsx
- KineticApplication
- PostIntensity
- 1. Banco de Dados (Flyway / PostgreSQL)
- CustomButton.tsx
- org.springframework.context.annotation.Configuration
- ConnectionStatus
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
8. `WorkoutPlan` - 31 edges
9. `WorkoutSessionRepository` - 31 edges
10. `StatsService` - 31 edges

## Surprising Connections (you probably didn't know these)
- `DialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/dialog.tsx → kinetic-desktop/src/utils/cn.ts
- `SelectLabel()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/select.tsx → kinetic-desktop/src/utils/cn.ts
- `SelectSeparator()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/select.tsx → kinetic-desktop/src/utils/cn.ts
- `SelectScrollUpButton()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/select.tsx → kinetic-desktop/src/utils/cn.ts
- `SelectScrollDownButton()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/select.tsx → kinetic-desktop/src/utils/cn.ts

## Import Cycles
- None detected.

## Communities (192 total, 58 thin omitted)

### Community 0 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.12
Nodes (13): GetMapping, RequestMapping, RestController, StudentTrainerController, EmpresaStudentLinkDTO, PeerDTO, TrainerLinkDTO, ActiveTrainerConflictException (+5 more)

### Community 1 - "cn"
Cohesion: 0.05
Nodes (71): AppSidebar(), ROLE_SUBTITLE, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+63 more)

### Community 2 - "StorageService"
Cohesion: 0.16
Nodes (8): com.fasterxml.jackson.annotation.JsonIgnoreProperties, CreatePostRequest, CreateStoryRequest, SuppressWarnings, RemoteObject, SignedItem, StorageService, SupabaseListItem

### Community 4 - "StatsService"
Cohesion: 0.07
Nodes (23): com.fasterxml.jackson.databind.ObjectMapper, WeightPointDTO, AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table (+15 more)

### Community 5 - "KineticApp/src/types/index.ts"
Cohesion: 0.05
Nodes (69): CommentsSheet(), Props, styles, FeedPost(), Props, styles, INTENSITY_LABELS, INTENSITY_OPTIONS (+61 more)

### Community 6 - "org.slf4j.Logger"
Cohesion: 0.05
Nodes (21): java.security.SecureRandom, Override, EmailNotVerifiedException, InvalidCodeException, EmailVerificationCode, Entity, Table, EmailVerificationCodeRepository (+13 more)

### Community 7 - "Role"
Cohesion: 0.08
Nodes (17): GrowthPoint, RootMetricsDTO, Role, ALUNO, EMPRESA, PERSONAL, ROOT, UserStatus (+9 more)

### Community 8 - "TrainerAiPlanService"
Cohesion: 0.06
Nodes (23): AiPlanDraftDTO, Exercise, Note, Plan, PhysicalAssessmentDTOs, Request, TrainerAiPlanRequestDTO, TrainerExerciseRequestDTO (+15 more)

### Community 9 - "HomeAggregatorService.java"
Cohesion: 0.09
Nodes (12): NextWorkoutResponseDTO, RankingEntryDTO, WeeklyActivityPointDTO, Entity, Table, UserConnection, UserConnectionRepository, HomeAggregatorService (+4 more)

### Community 11 - "lombok.RequiredArgsConstructor"
Cohesion: 0.11
Nodes (21): jakarta.persistence.EntityNotFoundException, FeedbackDTO, TrainerLinkSource, COMPANY, INVITE, INVITE_CODE, TrainerLinkStatus, ATIVO (+13 more)

### Community 12 - "ProfileScreen.tsx"
Cohesion: 0.04
Nodes (57): Props, ageFromBirthDate(), DAYS_LABELS, FREQUENCY_OPTIONS, GOAL_API_MAP, GOAL_OPTIONS, GoalDef, goalLabel() (+49 more)

### Community 13 - "HomeScreen.tsx"
Cohesion: 0.07
Nodes (40): AppHeader(), AppHeaderProps, styles, AdherenceCard(), AdherenceCardProps, styles, getGreeting(), HomeGreeting() (+32 more)

### Community 15 - "WorkoutPlan"
Cohesion: 0.10
Nodes (10): java.util.regex.Pattern, ExerciseResponseDTO, GenerateWorkoutRequestDto, WorkoutPlanResponseDTO, Entity, Table, WorkoutPlan, WorkoutPlanRepository (+2 more)

### Community 16 - "lombok.Getter"
Cohesion: 0.08
Nodes (38): jakarta.persistence.Entity, jakarta.persistence.Table, Company, Entity, Table, Exercise, Entity, Table (+30 more)

### Community 17 - "UserRepository"
Cohesion: 0.07
Nodes (15): RootUserSeeder, RefreshResponseDTO, RegisterDTO, UpdatePhoneRequestDTO, UpdateWeightRequestDTO, UserProfileResponseDTO, EmailAlreadyInUseException, PhoneAlreadyInUseException (+7 more)

### Community 18 - "FinancePage.tsx"
Cohesion: 0.13
Nodes (26): FormDialog(), formInputClass, formLabelClass, ChargeRow(), errorText(), FinancePage(), MoneyTile(), PlanTarget (+18 more)

### Community 19 - "StatsScreen.tsx"
Cohesion: 0.05
Nodes (50): cardS, chipS, DeltaChip(), emptyS, insightS, PlanEvolutionCard(), PlanEvolutionCardProps, rowS (+42 more)

### Community 20 - "io.swagger.v3.oas.annotations.Operation"
Cohesion: 0.14
Nodes (11): io.swagger.v3.oas.annotations.Operation, DeleteMapping, PostMapping, DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping (+3 more)

### Community 23 - "BillingService"
Cohesion: 0.17
Nodes (7): Entity, Table, TrainerSubscription, TrainerSubscriptionRepository, AiAllowance, BillingService, SuppressWarnings

### Community 24 - "AsaasPaymentGateway"
Cohesion: 0.15
Nodes (10): com.fasterxml.jackson.databind.JsonNode, AsaasPaymentGateway, Override, AsaasWebhookController, PostMapping, RequestMapping, RestController, org.springframework.beans.factory.ObjectProvider (+2 more)

### Community 25 - "AppRoutes.tsx"
Cohesion: 0.05
Nodes (25): BottomTabBar(), GRADIENT_COLORS, GRADIENT_LOCATIONS, IconName, ROUTE_META, styles, T, Stack (+17 more)

### Community 26 - "src/App.tsx"
Cohesion: 0.10
Nodes (31): App(), RoleAwareRedirect(), Toaster(), homeForRole(), isPanelRole(), NAV_BY_ROLE, NavItem, PANEL_ROLES (+23 more)

### Community 28 - "PersonaisPage.tsx"
Cohesion: 0.11
Nodes (41): Props, Props, Button(), buttonVariants, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+33 more)

### Community 29 - "UserAdminDTO"
Cohesion: 0.11
Nodes (13): DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, RootController, CompanyDTO, CreateCompanyRequestDTO (+5 more)

### Community 30 - "StudentFinanceService"
Cohesion: 0.15
Nodes (8): PlanDTO, ChargeDTO, FinanceOverviewDTO, PlanDTO, StudentRefDTO, StudentBillingPlanRepository, SuppressWarnings, StudentFinanceService

### Community 31 - "TrainerInviteCodeService"
Cohesion: 0.16
Nodes (7): Entity, Table, TrainerInviteCode, TrainerInviteCodeRepository, SuppressWarnings, TrainerInviteCode, TrainerInviteCodeService

### Community 32 - "EmpresaHomePage.tsx"
Cohesion: 0.11
Nodes (29): CHART, InstructorBarChart(), nf, shortDate(), tooltipStyle, VolumeLineChart(), PageHeader(), Props (+21 more)

### Community 33 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, path

### Community 34 - "User"
Cohesion: 0.17
Nodes (6): TodayItemDTO, Entity, SuppressWarnings, Table, User, TrainerTodayService

### Community 35 - "TrainerFinanceController"
Cohesion: 0.13
Nodes (12): java.time.YearMonth, DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TrainerFinanceController (+4 more)

### Community 36 - "AuthController.java"
Cohesion: 0.08
Nodes (21): jakarta.servlet.http.HttpServletResponse, jakarta.validation.constraints.Pattern, AuthController, PostMapping, RequestMapping, RestController, SuppressWarnings, AuthResponseDTO (+13 more)

### Community 38 - "StudentsListPage.tsx"
Cohesion: 0.06
Nodes (51): initialsOf(), Props, CountUp(), CountUpProps, EASE_OUT, ProgressRing(), ProgressRingProps, riseItem (+43 more)

### Community 39 - "Icon.tsx"
Cohesion: 0.07
Nodes (40): App(), ConnectionRequestsModal(), Props, styles, CustomInput(), Props, styles, HeaderLogo() (+32 more)

### Community 41 - "WorkoutController.java"
Cohesion: 0.06
Nodes (22): HomeController, PublicInviteController, UserController, WorkoutController, WorkoutSessionController, ChangePasswordDTO, HomeDashboardResponseDTO, InviteCodePreviewDTO (+14 more)

### Community 42 - "org.springframework.data.jpa.repository.Query"
Cohesion: 0.09
Nodes (21): Feedback, Entity, Table, Entity, Table, PostComment, Entity, Table (+13 more)

### Community 43 - "dependencies"
Cohesion: 0.15
Nodes (13): expo, expo-blur, expo-status-bar, dependencies, axios, expo, expo-blur, expo-status-bar (+5 more)

### Community 44 - "StudentEngagementDTO"
Cohesion: 0.20
Nodes (5): Alert, StudentEngagementDTO, StudentRiskRules, StudentRiskRulesTest, org.junit.jupiter.api.Test

### Community 45 - "BillingPage.tsx"
Cohesion: 0.24
Nodes (16): BillingPage(), openCheckout(), PlanCard(), StatusCard(), DemoCheckoutPage(), PlanChip(), billingErrorMessage(), cancelSubscription() (+8 more)

### Community 46 - "ActiveSessionScreen.tsx"
Cohesion: 0.15
Nodes (16): Icon(), Props, SerieCard(), SerieStatus, styles, useWorkoutPresence(), ActiveSessionScreen(), localDateString() (+8 more)

### Community 48 - "BillingPlan"
Cohesion: 0.16
Nodes (10): DemoPaymentGateway, Override, GatewaySubscription, PaymentGateway, BillingPlan, BUSINESS, MAX, PLUS (+2 more)

### Community 49 - "Banco de dados do Kinetic"
Cohesion: 0.08
Nodes (25): Banco de dados do Kinetic, Chat, `chat_messages`, Como evoluir o schema, `companies`, Convenções e inconsistências, Execução e métricas, `feedbacks` (+17 more)

### Community 51 - "PhoneGate.tsx"
Cohesion: 0.21
Nodes (14): PhoneDialog(), PhoneDialogProps, PhoneGate(), PhoneGateContext, PhoneState, formatCNPJ(), formatCPF(), isValidCNPJ() (+6 more)

### Community 53 - "KineticApp/src/contexts/AuthContext.tsx"
Cohesion: 0.13
Nodes (27): EvolutionModal(), EvolutionModalProps, styles, AuthContextValue, AuthProvider(), AuthResult, CompleteOnboardingData, KineticUser (+19 more)

### Community 54 - "Override"
Cohesion: 0.10
Nodes (13): endDate(), fromString(), Override, previousEndDate(), previousStartDate(), startDate(), StatsPeriodParam, MONTH (+5 more)

### Community 55 - "PlanEditor.tsx"
Cohesion: 0.11
Nodes (29): KineticSelect(), KineticSelectOption, Props, toRadix(), autoSubtitle(), blankExercise(), Draft, DraftExercise (+21 more)

### Community 56 - "Sessão de 16/10/2026 — evolução do painel do personal"
Cohesion: 0.12
Nodes (16): 10. Caixa de entrada "Hoje", 1. Pesquisa de mercado, 2. Link de convite para aluno sem conta, 3. Celular único, 4. Encerrar vínculo com aluno, 5. Cobrança do personal (assinatura do Kinetic), 6. Planos e cota de IA, 7. Painel de aderência com alerta de risco (+8 more)

### Community 57 - ".getFeed"
Cohesion: 0.23
Nodes (4): FeedAuthorDTO, FeedPostDTO, org.springframework.data.domain.Page, org.springframework.data.domain.Pageable

### Community 59 - "OnboardingScreen.tsx"
Cohesion: 0.07
Nodes (23): AuthContextValue, buildMedicalValue(), DAYS_LABELS, GEN_STEPS, GOAL_API_MAP, GoalDef, GOALS, GoalType (+15 more)

### Community 60 - "WorkoutScreen.tsx"
Cohesion: 0.08
Nodes (18): WorkoutPlanItem, Accent, ACCENTS, DAY_LETTERS, Exercise, firstName(), formatVolumeKg(), groupSections() (+10 more)

### Community 61 - "org.springframework.http.ResponseEntity"
Cohesion: 0.18
Nodes (7): BillingGatewayException, GlobalExceptionHandler, org.springframework.http.converter.HttpMessageNotReadableException, org.springframework.http.ResponseEntity, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException

### Community 62 - ".getSquad"
Cohesion: 0.18
Nodes (6): GetMapping, SquadMemberDTO, PresenceStatus, OFFLINE, ONLINE, TRAINING

### Community 63 - "SocialService"
Cohesion: 0.23
Nodes (3): UserCardDTO, SuppressWarnings, SocialService

### Community 64 - "org.springframework.security.access.prepost.PreAuthorize"
Cohesion: 0.19
Nodes (9): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, TrainerAssessmentController, Response (+1 more)

### Community 65 - "onboarding.jsx"
Cohesion: 0.07
Nodes (10): AGES, DAYS, DEFAULT_FORM, GOALS, HEIGHTS, K, LEVELS, STEPS (+2 more)

### Community 66 - "WorkoutSessionRepository"
Cohesion: 0.19
Nodes (3): WorkoutSessionRepository, CommunityStatsService, org.springframework.context.event.EventListener

### Community 67 - "BillingOverviewDTO"
Cohesion: 0.26
Nodes (6): GetMapping, PostMapping, RequestMapping, RestController, TrainerBillingController, BillingOverviewDTO

### Community 68 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+9 more)

### Community 69 - "AiPlanFlow.tsx"
Cohesion: 0.07
Nodes (49): AiRequestForm, attentionFor(), autoSubtitle(), bareTag(), dayLabel(), joinPt(), LETTERS, nameKey() (+41 more)

### Community 70 - "io.swagger.v3.oas.annotations.tags.Tag"
Cohesion: 0.09
Nodes (14): io.swagger.v3.oas.annotations.tags.Tag, GetMapping, RequestMapping, RestController, StatsController, AiPlanContextDTO, AiPlanPreviewDTO, CommunityComparisonDTO (+6 more)

### Community 72 - "DashboardTab.tsx"
Cohesion: 0.10
Nodes (16): Charts(), CycleComparison(), DashboardTab(), DeltaPill(), formatShortDate(), groupLabel(), nf0, nf1 (+8 more)

### Community 73 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+16 more)

### Community 74 - "🚀 Plano de Implementação: Blindagem de Dados, UX e Dashboard de Desempenho"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Refatoração Back-end: Blindagem de Dados (Java), 3. Refatoração Front-end: ActiveSessionScreen.tsx (UX e Validações), 4. StatsScreen e Evolução Mensal (TypeScript & Gifted Charts), 5. Diretrizes Técnicas para o Agente (IDE), A. Atualização do `SetLogDto.java`, A. Dashboards Visuais (StatsScreen.tsx), A. Validação Individual de Série (Botão Check) (+4 more)

### Community 75 - "WorkoutSessionService"
Cohesion: 0.28
Nodes (3): WeeklyActivityDayDTO, WeeklyActivityResponseDTO, WorkoutSessionService

### Community 76 - "🏋️ Plano — Painel Desktop do Personal (Kinetic)"
Cohesion: 0.17
Nodes (11): 📌 Decisão de Arquitetura (fechada), 🧭 Diretrizes de Execução, 📎 Estado atual do código (âncoras), Fase 0 — Identidade e Papéis (backend), Fase 1 — Vínculo + Convite (backend + **app mobile**), Fase 2 — Chat personal↔aluno (backend + app mobile), Fase 3+ — Dashboards do Personal e telas de EMPRESA (depois), 👥 Modelo de Papéis (4 roles) (+3 more)

### Community 77 - "dependencies"
Cohesion: 0.13
Nodes (15): clsx, dependencies, clsx, lucide-react, motion, next-themes, react, react-router-dom (+7 more)

### Community 78 - ".getAnalytics"
Cohesion: 0.28
Nodes (3): EmpresaAnalyticsDTO, InstructorPerf, VolumePoint

### Community 79 - "kinetic-desktop/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 80 - "4. Front-end (React Native)"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Regras de Negócio e Lógica Matemática, 3. Back-end (Spring Boot 3.2.x - Java 17), 4. Front-end (React Native), A. Gerenciamento de Estado (useState), A. Nova Entidade e Tabela (`WorkoutSession`), B. Hook do Cronômetro (useEffect), B. Novo Endpoint de Registro (+4 more)

### Community 81 - "RegisterScreen.tsx"
Cohesion: 0.12
Nodes (13): PhoneRequiredScreen(), styles, A, Props, RegisterScreen(), reqStyles, Requirement, styles (+5 more)

### Community 82 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+12 more)

### Community 83 - "GatewayEvent"
Cohesion: 0.29
Nodes (6): GatewayEvent, Type, IGNORED, PAYMENT_OVERDUE, PAYMENT_PAID, SUBSCRIPTION_ENDED

### Community 84 - "SubscriptionStatus"
Cohesion: 0.29
Nodes (6): SubscriptionStatus, ATIVA, ATRASADA, CANCELADA, PENDENTE, TRIAL

### Community 85 - "kinetic-desktop/src/types/index.ts"
Cohesion: 0.07
Nodes (48): InviteStudentModal(), Mode, MODES, Props, SPRING_PILL, InviteShare(), PendingInvites(), SEVERITY_DOT (+40 more)

### Community 86 - "Auditoria de segurança — KinectApp"
Cohesion: 0.10
Nodes (19): 1. Reset de senha sem prova de identidade — Crítica, 2. Vínculo empresa → aluno sem consentimento — Alta, 3. STOMP sem autorização de SUBSCRIBE — Alta, 4. Curtidas e comentários sem visibilidade — Média, 5. Ranking manipulável — Baixa, Achados confirmados, Ainda em aberto, ligado a essas mudanças, Auditoria de segurança — KinectApp (+11 more)

### Community 87 - "AiPlanGeneration"
Cohesion: 0.38
Nodes (4): AiPlanGeneration, Entity, Table, AiPlanGenerationRepository

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

### Community 95 - "JwtUtil"
Cohesion: 0.38
Nodes (3): io.jsonwebtoken.Claims, javax.crypto.SecretKey, JwtUtil

### Community 96 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, android, ios, start, web

### Community 97 - "WorkoutPlansTab.tsx"
Cohesion: 0.11
Nodes (20): ConfirmDialog(), EditorMode, ACCENTS, approvedLabel(), bareTag(), dayLabel(), lastDoneLabel(), nextTag() (+12 more)

### Community 98 - "🛡️ Plano de Refatoração: Onboarding Clínico e Blindagem do Prompt (IA)"
Cohesion: 0.18
Nodes (10): 1. Back-end: Ajuste na Entidade `User` (JPA/Hibernate), 1. Visão Geral, 2. Refatoração Back-end (Java Spring Boot), 3. Refatoração Front-end (React Native / TypeScript), 4. Diretrizes, A. Atualização de Entidades e DTOs, A. Nova Tela/Etapa no Onboarding (`MedicalHistoryScreen.tsx` ou Step equivalente), 🛠️ Adendo ao Plano: Persistência e Tratamento de Exceção da IA (+2 more)

### Community 101 - "stats.jsx"
Cohesion: 0.11
Nodes (5): DATA, Icons, INSIGHTS, PERIODS, T

### Community 102 - "treinar.jsx"
Cohesion: 0.11
Nodes (4): ACCENTS, FICHAS_DATA, HKT, TTAB_ICONS

### Community 103 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 104 - "CompliancePage.tsx"
Cohesion: 0.10
Nodes (26): MAP, StatusBadge(), Badge(), badgeVariants, DropdownMenu(), DropdownMenuTrigger(), Select(), SelectContent() (+18 more)

### Community 105 - "Kinetic App"
Cohesion: 0.12
Nodes (16): 1.1. Configurar variáveis de ambiente, 1.2. Rodar a aplicação, 1.3. Rodar o backend com Docker, 1. Subindo o backend (`kinetic-backend`), 2.1. Instalar dependências, 2.2. Configurar a URL da API, 2.3. Rodar o app, 2. Subindo o app mobile (`KineticApp`) (+8 more)

### Community 107 - "EmpresaController"
Cohesion: 0.13
Nodes (9): BaseController, EmpresaController, DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, VincularAlunoRequestDTO (+1 more)

### Community 108 - "🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App)"
Cohesion: 0.22
Nodes (8): 📌 Contexto e Arquitetura, Fase 1: Fundação e Conexão com Supabase, Fase 2: Entidade de Autenticação (Traditional Login), Fase 3: Controllers de Entrada, 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App), 📐 Padrões de Código e Clean Architecture, 🗺️ Roadmap de Execução (Modo Agêntico), 🛠️ Stack Tecnológico Obrigatório

### Community 114 - "auth.jsx"
Cohesion: 0.13
Nodes (3): A, FAKE_USER, Ic

### Community 118 - "SecurityConfig.java"
Cohesion: 0.28
Nodes (9): SecurityConfig, org.springframework.context.annotation.Bean, org.springframework.security.authentication.AuthenticationProvider, org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration, org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity, org.springframework.security.config.annotation.web.builders.HttpSecurity, org.springframework.security.config.annotation.web.configuration.EnableWebSecurity, org.springframework.security.web.SecurityFilterChain (+1 more)

### Community 123 - "home.jsx"
Cohesion: 0.15
Nodes (5): HK, MOCK, PosColor(), RankingSection(), TAB_ICONS

### Community 124 - "AssessmentsTab.tsx"
Cohesion: 0.14
Nodes (30): delta(), DERIVED_FIELDS, firstAndLast(), formatMeasure(), MEASURE_FIELDS, MeasureField, nf(), AssessmentsTab() (+22 more)

### Community 127 - "KineticApp/package.json"
Cohesion: 0.25
Nodes (7): main, name, overrides, glob, rimraf, private, version

### Community 128 - "GeminiService"
Cohesion: 0.11
Nodes (14): com.fasterxml.jackson.core.type.TypeReference, Content, GeminiRequestDto, GenerationConfig, Part, Candidate, Content, GeminiResponseDto (+6 more)

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
Cohesion: 0.24
Nodes (7): LastActiveInterceptor, Override, WebMvcConfig, PresenceService, org.springframework.web.servlet.config.annotation.InterceptorRegistry, org.springframework.web.servlet.config.annotation.WebMvcConfigurer, org.springframework.web.servlet.HandlerInterceptor

### Community 133 - "JacksonConfig.java"
Cohesion: 0.27
Nodes (7): com.fasterxml.jackson.core.JsonGenerator, com.fasterxml.jackson.databind.ser.std.StdSerializer, com.fasterxml.jackson.databind.SerializerProvider, JacksonConfig, Override, LocalDateTimeAsUtcSerializer, org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer

### Community 137 - "FeedbacksPage.tsx"
Cohesion: 0.48
Nodes (5): Avatar(), FeedbacksPage(), formatDate(), listCompanyFeedbacks(), Feedback

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

### Community 149 - "JwtAuthenticationFilter"
Cohesion: 0.26
Nodes (6): jakarta.servlet.FilterChain, jakarta.servlet.http.HttpServletRequest, Override, Override, JwtAuthenticationFilter, org.springframework.web.filter.OncePerRequestFilter

### Community 150 - "SocialController"
Cohesion: 0.15
Nodes (8): CreatePostRequest, CreateStoryRequest, PostMapping, RequestMapping, RestController, SocialController, MediaUploadResponse, org.springframework.web.multipart.MultipartFile

### Community 151 - "Plano de Refatoração: Onboarding Flow (React -> TSX Estrito)"
Cohesion: 0.29
Nodes (6): Diretrizes de Tipagem (Strict TypeScript), Objetivo, Plano de Refatoração: Onboarding Flow (React -> TSX Estrito), Tarefa 1: Substituição de "Idade" por "Data de Nascimento", Tarefa 2: Criação da Etapa de Anamnese, Tarefa 3: Atualização do Controlador Principal (`OnboardingFlow`)

### Community 157 - "kinetic-desktop/src/utils/jwt.ts"
Cohesion: 0.53
Nodes (5): base64Decode(), base64UrlDecode(), decodeJwt(), isJwtExpired(), JwtPayload

### Community 158 - "kinetic-desktop/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, baseUrl, paths, files, references

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
Cohesion: 0.47
Nodes (4): io.swagger.v3.oas.models.OpenAPI, OpenApiConfig, OpenAPI, org.springframework.context.annotation.Configuration

### Community 171 - "ConnectionStatus"
Cohesion: 0.50
Nodes (3): ConnectionStatus, ACCEPTED, PENDING

## Knowledge Gaps
- **660 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+655 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **58 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `org.springframework.transaction.annotation.Transactional`, `StatsService`, `org.slf4j.Logger`, `Role`, `TrainerAiPlanService`, `HomeAggregatorService.java`, `lombok.RequiredArgsConstructor`, `WorkoutPlan`, `lombok.Getter`, `UserRepository`, `BillingService`, `AsaasPaymentGateway`, `UserAdminDTO`, `StudentFinanceService`, `TrainerInviteCodeService`, `org.springframework.data.jpa.repository.Query`, `BillingPlan`, `.findByEmail`, `.getSquad`, `SocialService`, `WorkoutSessionService`, `AiPlanGeneration`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `UserRepository` connect `UserRepository` to `org.springframework.transaction.annotation.Transactional`, `PresenceService`, `StatsService`, `org.slf4j.Logger`, `Role`, `TrainerAiPlanService`, `HomeAggregatorService.java`, `lombok.RequiredArgsConstructor`, `WorkoutPlan`, `lombok.Getter`, `BillingService`, `StudentFinanceService`, `TrainerInviteCodeService`, `User`, `org.springframework.data.jpa.repository.Query`, `SocialService`, `WorkoutSessionRepository`, `WorkoutSessionService`, `.getAnalytics`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `CompliancePage.tsx`, `EmpresaHomePage.tsx`, `PersonaisPage.tsx`, `PlanEditor.tsx`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _660 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `org.springframework.transaction.annotation.Transactional` be split into smaller, more focused modules?**
  _Cohesion score 0.11945031712473574 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.04719101123595506 - nodes in this community are weakly interconnected._
- **Should `StatsService` be split into smaller, more focused modules?**
  _Cohesion score 0.0746606334841629 - nodes in this community are weakly interconnected._