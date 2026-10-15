# Graph Report - KinectApp  (2026-10-15)

## Corpus Check
- 400 files · ~194,059 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2680 nodes · 6277 edges · 174 communities (119 shown, 55 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 382 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bcf3cd61`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- RootController.java
- lombok.RequiredArgsConstructor
- radix-ui
- expo-image-picker
- lombok.Getter
- KineticApp/src/types/index.ts
- cn
- org.springframework.http.ResponseEntity
- UserRepository
- ProfileScreen.tsx
- .findByEmail
- sonner
- StatsService
- BaseController
- .getByEmailOrThrow
- AppRoutes.tsx
- TrainerPlanService
- StatsScreen.tsx
- AuthController.java
- react-native
- org.springframework.transaction.annotation.Transactional
- WorkoutPlanResponseDTO
- WorkoutService
- io.swagger.v3.oas.annotations.tags.Tag
- PersonaisPage.tsx
- protocol.ts
- dependencies
- Icon.tsx
- HomeScreen.tsx
- react-native-svg
- org.springframework.data.jpa.repository.Query
- kinetic-desktop/src/types/index.ts
- KineticApp/src/contexts/AuthContext.tsx
- Auditoria de segurança — KinectApp
- RegisterScreen.tsx
- StudentsListPage.tsx
- GeminiService.java
- RuntimeException
- Banco de dados do Kinetic
- dropdown-menu.tsx
- NewPostModal.tsx
- org.springframework.context.annotation.Configuration
- PlanEditor.tsx
- .avatarOf
- WorkoutPlan
- Override
- EmpresaService
- GlobalExceptionHandler
- WorkoutScreen.tsx
- OnboardingScreen.tsx
- User
- SocialService
- kinetic-desktop/package.json
- ProfileScreen
- CustomUserDetailsService
- onboarding.jsx
- .getSquad
- HomeAggregatorService
- src/App.tsx
- scripts
- devDependencies
- DashboardTab.tsx
- .getStories
- StorageService
- TrainerAiPlanService
- aiDraft.ts
- .getMonthlyStats
- compilerOptions
- ChannelInterceptor
- 🚀 Plano de Implementação: Blindagem de Dados, UX e Dashboard de Desempenho
- dependencies
- JwtUtil
- 🏋️ Plano — Painel Desktop do Personal (Kinetic)
- metro.config.js
- class-variance-authority
- expo-secure-store
- WorkoutPlansTab.tsx
- expo-splash-screen
- 4. Front-end (React Native)
- kinetic-desktop/src/services/trainerService.ts
- compilerOptions
- next-themes
- SecurityConfig.java
- AiPlanComposer.tsx
- react-dom
- tailwind-merge
- tw-animate-css
- Design System Specification: High-Performance Athleticism
- expo
- ActiveSessionScreen.tsx
- treino-detalhe.jsx
- profile.jsx
- 🛡️ Plano de Refatoração: Onboarding Clínico e Blindagem do Prompt (IA)
- react
- react-native-dotenv
- stats.jsx
- treinar.jsx
- components.json
- react-native-gesture-handler
- rootService.ts
- react-native-gifted-charts
- react-native-safe-area-context
- Kinetic App
- react-native-screens
- react-native-worklets
- 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App)
- @react-navigation/bottom-tabs
- @react-navigation/drawer
- @react-navigation/native
- @react-navigation/native-stack
- @types/react
- auth.jsx
- tweaks-panel (1).jsx
- treino-sessao.jsx
- tweaks-panel.jsx
- typescript
- OncePerRequestFilter
- UserDetailsService
- home.jsx
- WebSocketMessageBrokerConfigurer
- StatsController
- StudentDetailPage.tsx
- expo-local-authentication
- KineticApp/package.json
- JacksonConfig.java
- WebMvcConfigurer
- Mudanças
- Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)
- RegisterPage.tsx
- 3. Ações Exigidas para a IA (Passo a Passo do Debug)
- StoryViewer.tsx
- AiPlanPreviewException
- HandlerInterceptor
- MediaUploadResponse
- 2. Front-end: UI/UX e Navegação (React Native + TS)
- axios
- PerfilLogoffButton.md
- FeedbacksPage.tsx
- CommandLineRunner
- compilerOptions
- Plano de Refatoração: Onboarding Flow (React -> TSX Estrito)
- kinetic-desktop/src/utils/jwt.ts
- kinetic-desktop/tsconfig.json
- ExerciseCard.tsx
- KineticApplication
- PostIntensity
- Plano de Implementação: Integração do Perfil Dinâmico (ProfileScreen)
- 1. Banco de Dados (Flyway / PostgreSQL)
- CustomButton.tsx
- ConnectionStatus
- CreatePostRequest.java
- CreateStoryRequest.java
- WorkoutSessionLogRequestDTO.java
- kinetic-desktop/src/theme/colors.ts
- CLAUDE.md
- GEMINI.md
- orfaoPlan.md
- com.kinetic:kinetic-backend

## God Nodes (most connected - your core abstractions)
1. `User` - 119 edges
2. `cn()` - 102 edges
3. `UserRepository` - 64 edges
4. `SocialService` - 44 edges
5. `WorkoutPlan` - 31 edges
6. `StatsService` - 31 edges
7. `TrainerAiPlanService` - 29 edges
8. `WorkoutPlanResponseDTO` - 27 edges
9. `WorkoutSessionRepository` - 27 edges
10. `SocialController` - 26 edges

## Surprising Connections (you probably didn't know these)
- `DropdownMenuCheckboxItem()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/dropdown-menu.tsx → kinetic-desktop/src/utils/cn.ts
- `DropdownMenuRadioItem()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/dropdown-menu.tsx → kinetic-desktop/src/utils/cn.ts
- `DropdownMenuLabel()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/dropdown-menu.tsx → kinetic-desktop/src/utils/cn.ts
- `DropdownMenuSeparator()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/dropdown-menu.tsx → kinetic-desktop/src/utils/cn.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  kinetic-desktop/src/components/ui/dropdown-menu.tsx → kinetic-desktop/src/utils/cn.ts

## Import Cycles
- None detected.

## Communities (174 total, 55 thin omitted)

### Community 0 - "RootController.java"
Cohesion: 0.10
Nodes (14): DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, RootController, CompanyDTO, CreateCompanyRequestDTO (+6 more)

### Community 1 - "lombok.RequiredArgsConstructor"
Cohesion: 0.07
Nodes (29): jakarta.persistence.EntityNotFoundException, RootUserSeeder, EmpresaAnalyticsDTO, InstructorPerf, VolumePoint, FeedbackDTO, Role, ALUNO (+21 more)

### Community 4 - "lombok.Getter"
Cohesion: 0.07
Nodes (48): jakarta.persistence.Entity, jakarta.persistence.Table, LogSessionRequestDTO, SetLogDto, AiPlanGeneration, Entity, Table, Company (+40 more)

### Community 5 - "KineticApp/src/types/index.ts"
Cohesion: 0.07
Nodes (55): CommentsSheet(), Props, styles, ConnectionRequestsModal(), Props, styles, FeedPost(), Props (+47 more)

### Community 6 - "cn"
Cohesion: 0.05
Nodes (71): ROLE_SUBTITLE, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), Card() (+63 more)

### Community 7 - "org.springframework.http.ResponseEntity"
Cohesion: 0.12
Nodes (19): io.swagger.v3.oas.annotations.Operation, CreatePostRequest, CreateStoryRequest, DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController (+11 more)

### Community 8 - "UserRepository"
Cohesion: 0.08
Nodes (9): UserStatus, ATIVO, BLOQUEADO, SUSPENSO, UserRepository, CompanyService, SuppressWarnings, PresenceService (+1 more)

### Community 9 - "ProfileScreen.tsx"
Cohesion: 0.06
Nodes (21): ProtocolOption, AccountSectionProps, AnamnesisModalProps, Badge, C, ChangePasswordModalProps, HeroUserData, Icons (+13 more)

### Community 12 - "StatsService"
Cohesion: 0.07
Nodes (24): com.fasterxml.jackson.databind.ObjectMapper, WeightPointDTO, AllArgsConstructor, Entity, Getter, NoArgsConstructor, Setter, Table (+16 more)

### Community 14 - ".getByEmailOrThrow"
Cohesion: 0.13
Nodes (11): GetMapping, PostMapping, RequestMapping, RestController, StudentTrainerController, AiPlanContextDTO, TrainerLinkDTO, ActiveTrainerConflictException (+3 more)

### Community 15 - "AppRoutes.tsx"
Cohesion: 0.05
Nodes (29): App(), BottomTabBar(), GRADIENT_COLORS, GRADIENT_LOCATIONS, IconName, ROUTE_META, styles, T (+21 more)

### Community 16 - "TrainerPlanService"
Cohesion: 0.19
Nodes (7): TrainerAiPlanApproveRequestDTO, TrainerExerciseRequestDTO, TrainerWorkoutPlanRequestDTO, Exercise, SuppressWarnings, WorkoutPlan, TrainerPlanService

### Community 17 - "StatsScreen.tsx"
Cohesion: 0.05
Nodes (50): cardS, chipS, DeltaChip(), emptyS, insightS, PlanEvolutionCard(), PlanEvolutionCardProps, rowS (+42 more)

### Community 18 - "AuthController.java"
Cohesion: 0.07
Nodes (23): jakarta.servlet.http.HttpServletRequest, jakarta.servlet.http.HttpServletResponse, jakarta.validation.constraints.Pattern, Override, LastActiveInterceptor, AuthController, PostMapping, RequestMapping (+15 more)

### Community 20 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.06
Nodes (21): java.security.SecureRandom, Override, RefreshResponseDTO, InvalidCodeException, Entity, Table, PasswordResetCode, SuppressWarnings (+13 more)

### Community 21 - "WorkoutPlanResponseDTO"
Cohesion: 0.21
Nodes (3): java.util.regex.Pattern, ExerciseResponseDTO, WorkoutPlanResponseDTO

### Community 22 - "WorkoutService"
Cohesion: 0.15
Nodes (5): GenerateWorkoutRequestDto, TrainerManagedPlanException, GeminiService, WorkoutService, TypeReference

### Community 23 - "io.swagger.v3.oas.annotations.tags.Tag"
Cohesion: 0.12
Nodes (16): io.swagger.v3.oas.annotations.tags.Tag, BaseController, HomeController, UserController, WorkoutController, WorkoutSessionController, ChangePasswordDTO, StartSessionResponseDTO (+8 more)

### Community 24 - "PersonaisPage.tsx"
Cohesion: 0.18
Nodes (29): PageHeader(), Props, Props, PhoneDialogProps, EmptyCard(), MAP, StatusBadge(), Button() (+21 more)

### Community 25 - "protocol.ts"
Cohesion: 0.11
Nodes (20): ageFromBirthDate(), DAYS_LABELS, FREQUENCY_OPTIONS, GOAL_API_MAP, GOAL_OPTIONS, GoalDef, goalLabel(), GOALS (+12 more)

### Community 26 - "dependencies"
Cohesion: 0.15
Nodes (13): expo, expo-blur, expo-linear-gradient, expo-status-bar, dependencies, expo, expo-blur, expo-linear-gradient (+5 more)

### Community 27 - "Icon.tsx"
Cohesion: 0.09
Nodes (36): CustomInput(), Props, styles, EvolutionModal(), EvolutionModalProps, styles, HeaderLogo(), Props (+28 more)

### Community 28 - "HomeScreen.tsx"
Cohesion: 0.07
Nodes (40): AppHeader(), AppHeaderProps, styles, AdherenceCard(), AdherenceCardProps, styles, getGreeting(), HomeGreeting() (+32 more)

### Community 30 - "org.springframework.data.jpa.repository.Query"
Cohesion: 0.10
Nodes (14): AiPlanGenerationRepository, CompanyRepository, EmailVerificationCodeRepository, ExerciseRepository, FeedbackRepository, PostCommentRepository, PostLikeRepository, SocialPostRepository (+6 more)

### Community 31 - "kinetic-desktop/src/types/index.ts"
Cohesion: 0.06
Nodes (46): CHART, InstructorBarChart(), nf, shortDate(), tooltipStyle, VolumeLineChart(), PERIODS, PeriodTabs() (+38 more)

### Community 32 - "KineticApp/src/contexts/AuthContext.tsx"
Cohesion: 0.16
Nodes (24): AuthContextValue, AuthProvider(), AuthResult, CompleteOnboardingData, KineticUser, RememberedUser, api, logoutUser() (+16 more)

### Community 33 - "Auditoria de segurança — KinectApp"
Cohesion: 0.10
Nodes (19): 1. Reset de senha sem prova de identidade — Crítica, 2. Vínculo empresa → aluno sem consentimento — Alta, 3. STOMP sem autorização de SUBSCRIBE — Alta, 4. Curtidas e comentários sem visibilidade — Média, 5. Ranking manipulável — Baixa, Achados confirmados, Ainda em aberto, ligado a essas mudanças, Auditoria de segurança — KinectApp (+11 more)

### Community 34 - "RegisterScreen.tsx"
Cohesion: 0.12
Nodes (11): A, Props, RegisterScreen(), reqStyles, Requirement, styles, AccountSection(), PhoneModal() (+3 more)

### Community 35 - "StudentsListPage.tsx"
Cohesion: 0.09
Nodes (38): InviteStudentModal(), Props, CountUp(), CountUpProps, EASE_OUT, ProgressRing(), ProgressRingProps, riseItem (+30 more)

### Community 36 - "GeminiService.java"
Cohesion: 0.12
Nodes (12): com.fasterxml.jackson.core.type.TypeReference, Content, GeminiRequestDto, GenerationConfig, Part, Candidate, Content, GeminiResponseDto (+4 more)

### Community 38 - "Banco de dados do Kinetic"
Cohesion: 0.08
Nodes (25): Banco de dados do Kinetic, Chat, `chat_messages`, Como evoluir o schema, `companies`, Convenções e inconsistências, Execução e métricas, `feedbacks` (+17 more)

### Community 39 - "dropdown-menu.tsx"
Cohesion: 0.12
Nodes (11): DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut() (+3 more)

### Community 40 - "NewPostModal.tsx"
Cohesion: 0.22
Nodes (12): INTENSITY_LABELS, INTENSITY_OPTIONS, NewPostModal(), styles, NewStoryModal(), Props, styles, createPost() (+4 more)

### Community 41 - "org.springframework.context.annotation.Configuration"
Cohesion: 0.22
Nodes (8): io.swagger.v3.oas.models.OpenAPI, OpenApiConfig, Override, WebMvcConfig, OpenAPI, org.springframework.context.annotation.Configuration, org.springframework.web.servlet.config.annotation.InterceptorRegistry, org.springframework.web.servlet.config.annotation.WebMvcConfigurer

### Community 42 - "PlanEditor.tsx"
Cohesion: 0.12
Nodes (29): autoSubtitle(), blankExercise(), Draft, DraftExercise, draftFromInput(), draftFromPlan(), Errors, ExerciseField (+21 more)

### Community 43 - ".avatarOf"
Cohesion: 0.20
Nodes (3): AddCommentRequest, CommentDTO, PendingRequestDTO

### Community 44 - "WorkoutPlan"
Cohesion: 0.28
Nodes (5): Entity, Table, WorkoutPlan, WorkoutPlanRepository, org.springframework.data.jpa.repository.EntityGraph

### Community 45 - "Override"
Cohesion: 0.10
Nodes (13): endDate(), fromString(), Override, previousEndDate(), previousStartDate(), startDate(), StatsPeriodParam, MONTH (+5 more)

### Community 46 - "EmpresaService"
Cohesion: 0.11
Nodes (13): EmpresaController, DeleteMapping, GetMapping, PostMapping, RequestMapping, RestController, EmpresaStudentLinkDTO, PeerDTO (+5 more)

### Community 47 - "GlobalExceptionHandler"
Cohesion: 0.13
Nodes (9): EmailAlreadyInUseException, EmailNotVerifiedException, GlobalExceptionHandler, GeminiUnavailableException, InvalidGeminiResponseException, org.springframework.http.converter.HttpMessageNotReadableException, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice (+1 more)

### Community 48 - "WorkoutScreen.tsx"
Cohesion: 0.08
Nodes (18): WorkoutPlanItem, Accent, ACCENTS, DAY_LETTERS, Exercise, firstName(), formatVolumeKg(), groupSections() (+10 more)

### Community 49 - "OnboardingScreen.tsx"
Cohesion: 0.07
Nodes (23): AuthContextValue, buildMedicalValue(), DAYS_LABELS, GEN_STEPS, GOAL_API_MAP, GoalDef, GOALS, GoalType (+15 more)

### Community 50 - "User"
Cohesion: 0.14
Nodes (12): UserProfileResponseDTO, Entity, Table, User, WeightHistory, UserLoginStreakRepository, WeightHistoryRepository, WorkoutExecutionLogRepository (+4 more)

### Community 51 - "SocialService"
Cohesion: 0.23
Nodes (5): FeedAuthorDTO, FeedPostDTO, CreatePostRequest, SuppressWarnings, SocialService

### Community 52 - "kinetic-desktop/package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 53 - "ProfileScreen"
Cohesion: 0.23
Nodes (10): Props, ProfileScreen(), TrainerSectionProps, acceptInvite(), declineInvite(), getMyTrainer(), getPendingInvites(), TrainerLink (+2 more)

### Community 54 - "CustomUserDetailsService"
Cohesion: 0.24
Nodes (9): jakarta.servlet.FilterChain, CustomUserDetailsService, Override, Override, JwtAuthenticationFilter, org.springframework.security.core.userdetails.UserDetails, org.springframework.security.core.userdetails.UserDetailsService, org.springframework.stereotype.Component (+1 more)

### Community 55 - "onboarding.jsx"
Cohesion: 0.07
Nodes (10): AGES, DAYS, DEFAULT_FORM, GOALS, HEIGHTS, K, LEVELS, STEPS (+2 more)

### Community 56 - ".getSquad"
Cohesion: 0.18
Nodes (4): PresenceStatus, OFFLINE, ONLINE, TRAINING

### Community 57 - "HomeAggregatorService"
Cohesion: 0.09
Nodes (11): HomeDashboardResponseDTO, NextWorkoutResponseDTO, RankingEntryDTO, WeeklyActivityDayDTO, WeeklyActivityPointDTO, WeeklyActivityResponseDTO, HomeAggregatorService, HomeDashboardResponseDTO (+3 more)

### Community 58 - "src/App.tsx"
Cohesion: 0.09
Nodes (34): App(), RoleAwareRedirect(), AppSidebar(), Toaster(), homeForRole(), isPanelRole(), NAV_BY_ROLE, NavItem (+26 more)

### Community 59 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, android, ios, start, web

### Community 60 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+9 more)

### Community 61 - "DashboardTab.tsx"
Cohesion: 0.10
Nodes (15): Charts(), CycleComparison(), DashboardTab(), DeltaPill(), formatShortDate(), groupLabel(), nf0, nf1 (+7 more)

### Community 63 - "StorageService"
Cohesion: 0.13
Nodes (9): com.fasterxml.jackson.annotation.JsonIgnoreProperties, OrphanMediaCleanupService, CreateStoryRequest, SuppressWarnings, RemoteObject, SignedItem, StorageService, SupabaseListItem (+1 more)

### Community 64 - "TrainerAiPlanService"
Cohesion: 0.15
Nodes (9): AiPlanDraftDTO, Exercise, Note, Plan, AiPlanPreviewDTO, TrainerAiPlanRequestDTO, Exercise, SuppressWarnings (+1 more)

### Community 65 - "aiDraft.ts"
Cohesion: 0.16
Nodes (24): attentionFor(), autoSubtitle(), bareTag(), dayLabel(), nameKey(), PreviewPlan, setsByMuscle(), tagsFor() (+16 more)

### Community 67 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+16 more)

### Community 69 - "🚀 Plano de Implementação: Blindagem de Dados, UX e Dashboard de Desempenho"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Refatoração Back-end: Blindagem de Dados (Java), 3. Refatoração Front-end: ActiveSessionScreen.tsx (UX e Validações), 4. StatsScreen e Evolução Mensal (TypeScript & Gifted Charts), 5. Diretrizes Técnicas para o Agente (IDE), A. Atualização do `SetLogDto.java`, A. Dashboards Visuais (StatsScreen.tsx), A. Validação Individual de Série (Botão Check) (+4 more)

### Community 70 - "dependencies"
Cohesion: 0.13
Nodes (15): clsx, dependencies, axios, clsx, lucide-react, motion, react, react-router-dom (+7 more)

### Community 71 - "JwtUtil"
Cohesion: 0.33
Nodes (3): io.jsonwebtoken.Claims, javax.crypto.SecretKey, JwtUtil

### Community 72 - "🏋️ Plano — Painel Desktop do Personal (Kinetic)"
Cohesion: 0.17
Nodes (11): 📌 Decisão de Arquitetura (fechada), 🧭 Diretrizes de Execução, 📎 Estado atual do código (âncoras), Fase 0 — Identidade e Papéis (backend), Fase 1 — Vínculo + Convite (backend + **app mobile**), Fase 2 — Chat personal↔aluno (backend + app mobile), Fase 3+ — Dashboards do Personal e telas de EMPRESA (depois), 👥 Modelo de Papéis (4 roles) (+3 more)

### Community 73 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, path

### Community 76 - "WorkoutPlansTab.tsx"
Cohesion: 0.15
Nodes (14): ConfirmDialog(), EditorMode, ACCENTS, approvedLabel(), bareTag(), dayLabel(), lastDoneLabel(), nextTag() (+6 more)

### Community 78 - "4. Front-end (React Native)"
Cohesion: 0.15
Nodes (12): 1. Visão Geral, 2. Regras de Negócio e Lógica Matemática, 3. Back-end (Spring Boot 3.2.x - Java 17), 4. Front-end (React Native), A. Gerenciamento de Estado (useState), A. Nova Entidade e Tabela (`WorkoutSession`), B. Hook do Cronômetro (useEffect), B. Novo Endpoint de Registro (+4 more)

### Community 79 - "kinetic-desktop/src/services/trainerService.ts"
Cohesion: 0.16
Nodes (19): AiRequestForm, Props, AiPlanFlow(), bodyText(), HttpError, Props, Step, Props (+11 more)

### Community 80 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+12 more)

### Community 82 - "SecurityConfig.java"
Cohesion: 0.28
Nodes (9): SecurityConfig, org.springframework.context.annotation.Bean, org.springframework.security.authentication.AuthenticationProvider, org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration, org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity, org.springframework.security.config.annotation.web.builders.HttpSecurity, org.springframework.security.config.annotation.web.configuration.EnableWebSecurity, org.springframework.security.web.SecurityFilterChain (+1 more)

### Community 83 - "AiPlanComposer.tsx"
Cohesion: 0.13
Nodes (12): KineticSelect(), KineticSelectOption, Props, toRadix(), joinPt(), LETTERS, AiPlanComposer(), CHIPS (+4 more)

### Community 87 - "Design System Specification: High-Performance Athleticism"
Cohesion: 0.11
Nodes (17): 1. Overview & Creative North Star: "The Digital Kineticist", 2. Colors: Tonal Depth & The Neon Pulse, 3. Typography: Editorial Authority, 4. Elevation & Depth: Tonal Layering, 5. Components: The Athletic Kit, 6. Do’s and Don’ts, Buttons (The Kinetic Drivers), Cards & Lists (The Performance Modules) (+9 more)

### Community 88 - "expo"
Cohesion: 0.11
Nodes (18): backgroundColor, foregroundImage, adaptiveIcon, expo, android, icon, ios, name (+10 more)

### Community 89 - "ActiveSessionScreen.tsx"
Cohesion: 0.16
Nodes (15): Props, SerieCard(), SerieStatus, styles, useWorkoutPresence(), ActiveSessionScreen(), localDateString(), requiresWeight() (+7 more)

### Community 90 - "treino-detalhe.jsx"
Cohesion: 0.11
Nodes (7): DAY_ACCENT, FICHA, HKT, SECOES, TOTAL_EXERCICIOS, TOTAL_VOLUME_KG, TTAB_ICONS

### Community 91 - "profile.jsx"
Cohesion: 0.11
Nodes (3): Ic, PF, USER

### Community 92 - "🛡️ Plano de Refatoração: Onboarding Clínico e Blindagem do Prompt (IA)"
Cohesion: 0.18
Nodes (10): 1. Back-end: Ajuste na Entidade `User` (JPA/Hibernate), 1. Visão Geral, 2. Refatoração Back-end (Java Spring Boot), 3. Refatoração Front-end (React Native / TypeScript), 4. Diretrizes, A. Atualização de Entidades e DTOs, A. Nova Tela/Etapa no Onboarding (`MedicalHistoryScreen.tsx` ou Step equivalente), 🛠️ Adendo ao Plano: Persistência e Tratamento de Exceção da IA (+2 more)

### Community 95 - "stats.jsx"
Cohesion: 0.11
Nodes (5): DATA, Icons, INSIGHTS, PERIODS, T

### Community 96 - "treinar.jsx"
Cohesion: 0.11
Nodes (4): ACCENTS, FICHAS_DATA, HKT, TTAB_ICONS

### Community 97 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 99 - "rootService.ts"
Cohesion: 0.14
Nodes (17): CompaniesPage(), formatDate(), CompliancePage(), formatDate(), PersonaisPage(), createCompany(), CreateCompanyPayload, createPersonal() (+9 more)

### Community 102 - "Kinetic App"
Cohesion: 0.12
Nodes (16): 1.1. Configurar variáveis de ambiente, 1.2. Rodar a aplicação, 1.3. Rodar o backend com Docker, 1. Subindo o backend (`kinetic-backend`), 2.1. Instalar dependências, 2.2. Configurar a URL da API, 2.3. Rodar o app, 2. Subindo o app mobile (`KineticApp`) (+8 more)

### Community 105 - "🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App)"
Cohesion: 0.22
Nodes (8): 📌 Contexto e Arquitetura, Fase 1: Fundação e Conexão com Supabase, Fase 2: Entidade de Autenticação (Traditional Login), Fase 3: Controllers de Entrada, 🤖 Instruções de Sistema - Arquiteto Back-end Java (Kinetic App), 📐 Padrões de Código e Clean Architecture, 🗺️ Roadmap de Execução (Modo Agêntico), 🛠️ Stack Tecnológico Obrigatório

### Community 111 - "auth.jsx"
Cohesion: 0.13
Nodes (3): A, FAKE_USER, Ic

### Community 118 - "home.jsx"
Cohesion: 0.15
Nodes (5): HK, MOCK, PosColor(), RankingSection(), TAB_ICONS

### Community 120 - "StatsController"
Cohesion: 0.10
Nodes (12): GetMapping, RequestMapping, RestController, StatsController, CommunityComparisonDTO, MetricDeltaDTO, PlanEvolutionResponseDTO, StatsInsightDTO (+4 more)

### Community 121 - "StudentDetailPage.tsx"
Cohesion: 0.21
Nodes (11): Avatar(), initialsOf(), Props, SPRING_PILL, sinceLabel(), StudentDetailPage(), TabId, TABS (+3 more)

### Community 123 - "KineticApp/package.json"
Cohesion: 0.25
Nodes (7): main, name, overrides, glob, rimraf, private, version

### Community 124 - "JacksonConfig.java"
Cohesion: 0.27
Nodes (7): com.fasterxml.jackson.core.JsonGenerator, com.fasterxml.jackson.databind.ser.std.StdSerializer, com.fasterxml.jackson.databind.SerializerProvider, JacksonConfig, Override, LocalDateTimeAsUtcSerializer, org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer

### Community 126 - "Mudanças"
Cohesion: 0.15
Nodes (12): 1. Armazenamento seguro de tokens — novo módulo `tokenStorage`, 2. Conceito de "usuário lembrado" + desbloqueio — `AuthContext.tsx`, 3. Telas novas, 4. Roteamento — `AppRoutes.tsx`, 5. Ajuste no `LoginScreen.js`, 6. Bootstrap sem "piscar" de tela — Splash até estar pronto, Contexto, Dependências novas (frontend) (+4 more)

### Community 127 - "Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)"
Cohesion: 0.25
Nodes (7): 1.1. Alterações na Entidade `User`, 1.2. Entidade de Log: `WorkoutExecutionLog`, 1. Persistência de Dados (JPA/Hibernate), 2.1. Lógica do Algoritmo "Próxima Ficha Pendente", 2. Motor de Busca de Treinos (`WorkoutService`), 3. Arquitetura do Contrato BFF (`HomeDashboardResponseDTO`), Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)

### Community 128 - "RegisterPage.tsx"
Cohesion: 0.35
Nodes (9): PhoneDialog(), formatCNPJ(), formatCPF(), isValidCNPJ(), isValidCPF(), RegisterPage(), updateMyPhone(), isValidCellPhone() (+1 more)

### Community 129 - "3. Ações Exigidas para a IA (Passo a Passo do Debug)"
Cohesion: 0.25
Nodes (7): 1. Contexto do Problema, 2. Suspeitos Principais, 3. Ações Exigidas para a IA (Passo a Passo do Debug), A. Adicionar Logs de Rastreamento (Tracing), B. Blindar o Recebimento da Data, C. Expor a Exceção Raiz, 🐛 Plano de Debug: Resolução da Quebra Silenciosa na Geração de Treino

### Community 130 - "StoryViewer.tsx"
Cohesion: 0.38
Nodes (6): Props, StoryViewer(), styles, timeAgo(), { width }, StoryGroup

### Community 134 - "2. Front-end: UI/UX e Navegação (React Native + TS)"
Cohesion: 0.20
Nodes (9): 1.1. Status de Onboarding do Usuário, 1.2. Lógica de "Próxima Ficha Disponível", 1. Back-end: Inteligência e Persistência (Java Spring Boot), 2.1. Reestruturação da Navegação, 2.2. Lógica de Redirecionamento (Conditional Rendering), 2.3. Refatoração Visual do Dashboard (Design Premium), 2. Front-end: UI/UX e Navegação (React Native + TS), 3. Checklist de Implementação (+1 more)

### Community 136 - "PerfilLogoffButton.md"
Cohesion: 0.33
Nodes (5): 1. Front-end: Camada de Contexto (`AuthContext.tsx`), 2.1. Tokens de Estilização e Specs Visuais (Image Reference), 2. Front-end: UI do Modal (ProfileScreen.tsx), 3.1. Controle de Estado do Modal, 3. Lógica de Integração e Fluxo

### Community 137 - "FeedbacksPage.tsx"
Cohesion: 0.39
Nodes (6): Badge(), badgeVariants, FeedbacksPage(), formatDate(), listCompanyFeedbacks(), Feedback

### Community 147 - "compilerOptions"
Cohesion: 0.29
Nodes (6): compilerOptions, allowJs, jsx, strict, extends, expo/tsconfig.base

### Community 149 - "Plano de Refatoração: Onboarding Flow (React -> TSX Estrito)"
Cohesion: 0.29
Nodes (6): Diretrizes de Tipagem (Strict TypeScript), Objetivo, Plano de Refatoração: Onboarding Flow (React -> TSX Estrito), Tarefa 1: Substituição de "Idade" por "Data de Nascimento", Tarefa 2: Criação da Etapa de Anamnese, Tarefa 3: Atualização do Controlador Principal (`OnboardingFlow`)

### Community 152 - "kinetic-desktop/src/utils/jwt.ts"
Cohesion: 0.53
Nodes (5): base64Decode(), base64UrlDecode(), decodeJwt(), isJwtExpired(), JwtPayload

### Community 153 - "kinetic-desktop/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, baseUrl, paths, files, references

### Community 157 - "ExerciseCard.tsx"
Cohesion: 0.40
Nodes (3): Exercise, Props, styles

### Community 158 - "KineticApplication"
Cohesion: 0.60
Nodes (3): KineticApplication, org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.scheduling.annotation.EnableScheduling

### Community 159 - "PostIntensity"
Cohesion: 0.40
Nodes (4): PostIntensity, ALTA, LEVE, MODERADO

### Community 169 - "ConnectionStatus"
Cohesion: 0.50
Nodes (3): ConnectionStatus, ACCEPTED, PENDING

## Knowledge Gaps
- **601 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+596 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `RootController.java`, `lombok.RequiredArgsConstructor`, `lombok.Getter`, `UserRepository`, `.findByEmail`, `StatsService`, `.getByEmailOrThrow`, `TrainerPlanService`, `AuthController.java`, `org.springframework.transaction.annotation.Transactional`, `WorkoutService`, `org.springframework.data.jpa.repository.Query`, `.avatarOf`, `WorkoutPlan`, `EmpresaService`, `CustomUserDetailsService`, `.getSquad`, `HomeAggregatorService`, `TrainerAiPlanService`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `UserRepository` connect `UserRepository` to `TrainerAiPlanService`, `lombok.RequiredArgsConstructor`, `lombok.Getter`, `StatsService`, `WorkoutPlan`, `.getByEmailOrThrow`, `EmpresaService`, `TrainerPlanService`, `User`, `AuthController.java`, `org.springframework.transaction.annotation.Transactional`, `SocialService`, `CustomUserDetailsService`, `WorkoutService`, `HomeAggregatorService`, `org.springframework.data.jpa.repository.Query`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `StatsPeriodParam` connect `Override` to `StatsService`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `User` (e.g. with `.run()` and `.loadUserByUsername()`) actually correct?**
  _`User` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _601 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RootController.java` be split into smaller, more focused modules?**
  _Cohesion score 0.09885057471264368 - nodes in this community are weakly interconnected._
- **Should `lombok.RequiredArgsConstructor` be split into smaller, more focused modules?**
  _Cohesion score 0.06830601092896176 - nodes in this community are weakly interconnected._