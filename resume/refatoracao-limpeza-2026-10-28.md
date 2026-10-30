# Sessão de 28/10/2026: limpeza e refatoração (backend, app e painel)

Relatório de tudo o que mudou na branch `implementacaoWeb`. **Nada foi commitado.** A única mudança de schema é a V53, descrita em [Migrations (V53)](#migrations-v53).

A sessão fez uma varredura nos três projetos atrás de código morto, complexidade e over-engineering, sempre com a regra de **zero regressão**. O comportamento só mudou nos bugs aprovados e nos pontos marcados como mudança de contrato.

O plano aprovado fica em `~/.claude/plans/atue-como-um-staff-moonlit-hamming.md`. Os itens usam a numeração do diagnóstico:

| Prefixo | Tipo de item |
|---|---|
| G | remoção segura |
| Y | simplificação |
| R | estrutural |
| B | bug |

**Fora do escopo, por decisão:**
- **B6:** paginação de empresas.
- **R4:** `FeedbackService`, que será usado depois do lançamento.
- **R10:** dependências nativas `reanimated`, `gesture-handler` e `worklets`.
- **R11:** as cerca de 11 páginas de gestão do painel continuam com `useState`/`useEffect`.

## Verificação

| Projeto | O que rodou | Resultado |
|---|---|---|
| Backend | `mvnw test` e `mvnw verify` (Testcontainers, Postgres descartável) | 116 testes unitários e 20 de integração verdes; `SchemaIT` confirma o schema |
| App | `tsc --noEmit --noUnusedLocals --noUnusedParameters`, bundle do Metro (`expo export`) | Limpo / gera o bundle |
| App | `expo install --check` | Só acusa patches de `expo` e `expo-sharing` que já existiam |
| Painel | `npm run build` (tsc + vite) | Verde |
| Painel | Smoke no navegador embutido com um mock da API na 8099 (papéis EMPRESA, PERSONAL e ROOT) | Sem erro no console |

O smoke no painel cobriu:
- Home e Analytics da empresa;
- lista de alunos;
- diálogo do WhatsApp e convite de aluno (foco, Tab e Esc);
- as três confirmações;
- login, cadastro e recuperação de senha.

**Não verificado:** o app nativo no aparelho. Fluxos para testar: login, pular o onboarding, Home, Social (squad e feed), câmera, Configurações e troca de senha.

## Mudanças de contrato da API

| Removido | Observação |
|---|---|
| `GET /api/sessions/monthly-stats` | Nenhum cliente usava |
| `GET /api/sessions/weekly-activity` | Nenhum cliente usava; os DTOs `WeeklyActivity*` saíram junto |
| `GET /api/trainer/students/{id}/monthly-stats` | O painel usa a versão em lote `/trainer/students/monthly-stats`, que continua |
| `GET /api/social/squad/status` | Igual a `/api/social/squad`; **uma versão já publicada do app que chame esse endpoint vai quebrar** |
| Campo `weeklyActivity` de `GET /api/home/dashboard` | Era calculado com uma query extra e ninguém lia |

Postman (`Kinetic.postman_collection.json`), `API_CHEATSHEET.txt` e o `README.md` foram atualizados.

## Bugs corrigidos

- **B1 (app):** a chave de cache `me/trainer` guardava dois formatos diferentes.
  - Protocolo e Anamnese guardam o vínculo inteiro.
  - Home, Perfil e Configurações guardavam só o par.
  - Esses três agora usam `me/trainer-peer`.
- **B2 (backend):** `POST /api/users/weight` com personal ativo devolvia 500. Agora devolve 409, pelo `GlobalExceptionHandler`.
- **B3/B4 (backend e app):** a regra de senha agora é única: 8 a 20 caracteres, com maiúscula, minúscula e caractere especial.
  - **Backend:** `dtos/ValidationRules.PASSWORD_REGEX` e `PASSWORD_MESSAGE`. As mensagens de `ChangePasswordDTO` e `ResetPasswordDTO` diziam "8 e 15".
  - **App:** `constants/password.ts`, usado em Register, Reset e `ChangePasswordDialog`.
  - **Requisito de número:** saiu, porque o backend e o painel não exigiam.
  - **Checklist:** mostra "8 a 20 caracteres".
- **B5 (app):** o switch de tema que não fazia nada saiu junto com o cluster legado (R6).
- **B7 (backend):** a aderência mensal agora tem teto de 100%, na Home e nas estatísticas mensais da lista de alunos do painel.
- **B8 (app):**
  - "NÃO, JÁ POSSUO TREINO" chamava `completeOnboarding({ level: 'INT' })`. Esse valor é inválido (os canônicos são `INICIANTE | INTERMEDIÁRIO | PRO`) e o botão não fazia nada para usuário novo. Agora usa `skipOnboarding()` no AuthContext, que marca `onboardingSkipped` no usuário salvo no aparelho.
  - O treino iniciado pela aba Treinos não enviava `workoutPlanId`, então a Home não avançava para o próximo treino. Agora envia.

## Backend (`kinetic-backend`)

**Removido (G1–G5)**
- **Métodos de repositório sem chamada:** `findLoginDatesByUserSince`, `findByNomeContainingIgnoreCaseAndIdNot`, `findAllByUserOrderByLoggedAtAsc`, `WorkoutPlanRepository.findByUserId` e `findByUserIdOrderByCreatedAtAsc`, `existsByUserIdAndSessionDate`.
- **Tipos sem referência:** `WorkoutSessionLogRequestDTO`, `enums/ConnectionStatus`, `enums/PostIntensity`, `TermsService.currentVersion()` e o catch morto em `SocialController.removeConnection`.
- **Comentários:** "10 MB" virou "3 MB"; o comentário de CORS voltou ao lugar em `application.properties`; saiu o "(Fase 3 básica)"; os itens feitos saíram do `todo.md`.
- **Dependência:** `springdoc-openapi-starter-webmvc-ui` trocado por `-webmvc-api`, e saiu `springdoc.swagger-ui.enabled`. A documentação continua via Scalar em `/docs.html`.

**Simplificado (Y1–Y9)**
- **Y1:** sem try/catch que repetiam o `GlobalExceptionHandler` em `WorkoutController`, `UserController`, `SocialController` e `WorkoutSessionController`. O `toggleSquad` mantém o 400 atual.
- **Y2:** os cinco handlers 409 viraram um `@ExceptionHandler({...})`.
- **Y3:** `CustomUserDetailsService` passou a devolver `KineticUserDetails`. Com isso, o `JwtAuthenticationFilter` não repete mais o `instanceof` nem o bloco 403.
- **Y4/R2:** o `int[]` da aderência virou `MonthlyStatsResponseDTO`.
- **Y5:** os dados de `StatsPeriodParam` passaram para o construtor; `id()` agora é `name().toLowerCase()`.
- **Y6:** saíram os repasses `avatarOf`, `findPair` (público) e os `findUserByEmail` de `WorkoutService` e `WorkoutSessionService`.
  - `SocialService.findByEmail` e `findById` ficaram, porque o `PublicProfileService` usa.
  - `AuthService` e `PresenceService` ficaram, porque trocar mudaria a mensagem de erro e quebraria os mocks dos testes.
- **Y7:** helpers únicos.
  - `utils/Strings.trimOrNull`: o `StudentProtocolService` ficou fora, porque o dele não faz trim.
  - `utils/Numbers.round1`.
  - `utils/Hashing.sha256Hex`.
  - `AppTime.ZONE` no `BillingService`.
  - Constantes `StudentRiskRules.ALTO` e `MEDIO` no `TrainerTodayService`.
  - `ValidationRules.HANDLE_REGEX`, usada em `CreateCompanyRequestDTO` e `UnitDTOs`.
- **Y8:** saiu o try/catch inútil do `DocumentValidator`.
- **Y9:** `@RequiredArgsConstructor` onde o construtor só atribuía (services e controllers). A ordem dos campos foi mantida para não quebrar os testes que constroem as classes.

**Estrutural**
- **R1:** `models/OneTimeCode` (`@MappedSuperclass`) vira a base de `EmailVerificationCode` e `PasswordResetCode`; tabelas e colunas não mudaram.
  - Repositório genérico `OneTimeCodeRepository<T>` (`@NoRepositoryBean`, consultas com `#{#entityName}`).
  - Fluxo comum em `services/OneTimeCodes` (`issue` e `consume`): cooldown de 60 s, 5 tentativas e 10 palpites por hora.
  - Os textos e e-mails continuam os mesmos.
- **R2:** uma fonte para cada regra de domínio.

  | Regra | Onde ficou |
  |---|---|
  | Aderência do mês | `TrainingSummaryService.monthlyAdherence` (usada pela Home e por `getMonthlyStats`) |
  | Sequência de dias | `TrainingSummaryService.streakEndingAt` (treinos e logins) |
  | Volume por grupo muscular | `TrainingSummaryService.volumeByMuscle` |
  | Números do ciclo | `PlanCycleSnapshotService.cycleStats` (snapshot e evolução do plano) |
  | Presença online | `SocialService.presenceOf` (Social e ranking da Home) |
  | Outro lado da conexão | `UserConnection.otherSide` |
  | Comparar progresso | Usa `canSeeActivity` |
  | Período → dias | `CompanyService.periodDays`, também usado pelo `EmpresaService` |
  | Vínculo ativo | Métodos default `TrainerClientRepository.getActiveOfStudent` e `getActiveLink`, com as mesmas mensagens 404 |

  A semana que começa na segunda em `StatsPeriodParam.WEEK` não mudou, porque é outra regra.
- **R3:** os endpoints e o campo da Home listados em "Mudanças de contrato da API".
- **R5:** saiu o `/squad/status`.

**Testes ajustados, sem mudar o que verificam**
- `PublicProfileServiceTest`: o compare agora mocka `canSeeActivity`.
- `PasswordResetServiceTest`: as constantes vêm de `OneTimeCodes`.
- `TrainerEngagementPauseTest` e `TrainerLinkServiceCompanyTest`: `thenCallRealMethod()` nos métodos default novos.

## App mobile (`KineticApp`)

**Removido (G6–G11)**
- **Arquivos:** `App.js` (cópia antiga), `AppHeader`, `CustomButton`, `ExerciseCard`, `PasswordRequirements`, `utils/jwt.ts`.
- **Exports, tipos e tokens:** `toggleInSquad`, `getSquadStatus`, `presenceColor`, `formatProfileName`, `formatMemberSince`, `MainStackNavigation`, os tipos `WeeklyActivity*` e `UpdateWeightRequestDTO`, `KINETIC.recordBg`, `TYPE.input`, `STATS_T.cardSoft` e `borderSoft`, os ícones `dot`, `key` e `more`.
- **Barrel `ui/index.ts`:** saíram as linhas que ninguém importava.
- **Locais e props mortos:** a prop `bare` do `FeedPost`, chaves de estilo sem uso, `ringColor`, `firstName`.
- **`RecurringUserScreen`:** saiu o bloco de diagnóstico do Face ID, que fazia `console.log` e 3 chamadas nativas a cada montagem.
- **Dependências:** `@react-navigation/drawer` e `react-native-dotenv`.

**Simplificado (Y10–Y18)**
- **Y10 — `AuthContext`:**
  - `apiErrorMessage` substitui 6 cópias;
  - `markOnboardedIfHasPlans` substitui 4;
  - `isLoggedIn` é derivado de `currentUser !== null`.
- **Y11:** `ActiveSessionScreen` usa `confirmedLogs()` e `sessionPayload()`. O `formatTime` **ficou**, porque o `formatClock` mostra `1:05:09` em vez de `65:09`.
- **Y12:** `WorkoutScreen` usa `formatThousands` e `musclesOf`, e a lista/detalhe é derivada de `selectedRoutineId`.
- **Y13:** o Onboarding importa `constants/protocol` e não usa mais o cast local do contexto.
- **Y14:** ternários aninhados viraram funções ou mapas.
  - `RecurringUser`: `initialsFor` mantém a regra atual (duas primeiras palavras) e `BIO_COPY` cobre os estados da biometria.
  - `HomeScreen`, `SerieCard` (`summarizeWeight`), `NewPostModal` (`renderRecent`) e `SocialScreen` (`renderTab`).
- **Y15:** `openWhatsApp()` em `utils/whatsapp.ts`, usado em 4 telas.
- **Y16:**
  - Ícones das telas de auth em `components/auth/AuthIcons.tsx`, e não no `Icon.tsx`: o traçado é diferente e o `Icon` escala com o tamanho de texto.
  - `components/auth/RequirementItem.tsx` serve Register e Reset.
- **Y17:**
  - `imageFormData()` em `utils/compressImage.ts`;
  - `services/workoutService.generateWorkout`, usado pelo Onboarding e pelo Protocolo;
  - tipos `PlanExercise` e `WorkoutPlanItem` em `types/index.ts`, usados pela Home e por Treinos.
- **Y18:** `AuthStackParamList` e `AuthScreenProps` tipam o stack de auth.

**Estrutural**
- **R5:** `useSquadStatus` passou a devolver `{ members, refresh }` e é a única fonte do squad no Social.
- **R6:** ConfirmEmail e Onboarding passaram a usar `ui/Button`, `ui/TextField`, `ui/StackHeader` e o `KINETIC`. **O visual dessas duas telas mudou.**
  - Apagados: `ThemeContext`, `HeaderLogo`, `ThemeToggle`, `CustomInput`, `PrimaryButton`, `theme/colors.ts` e o `ThemeProvider` do `App.tsx`.
- **R7:** saíram `workoutPlans` e `setWorkoutPlans` do AuthContext. As fichas ficam só no cache `useFocusResource('workouts/my-plans')`.
- **R8:**
  - `uploadAndCreate()` em `socialService`: upload, criação e limpeza da mídia órfã, usado por NewPost, NewStory e NewWorkoutPost.
  - O feed do Social passou a usar `usePaged`, que ganhou a opção `keepOnError` para o feed não sumir num refresh sem rede.
  - A câmera do treino **não** foi unificada com a comum: tem moldura com a tonelagem, texto próprio e não pede permissão sozinha.
- **R9:** as 8 telas de auth trocaram a paleta local `const A` pelo `KINETIC`, a mesma base do painel. Os alphas variaram em até 0,02.
  - O badge de sequência, que nunca aparecia, saiu junto com `RememberedUser.streak`.

## Painel web (`kinetic-desktop`)

**Removido (G12–G16)**
- **Arquivos:** `utils/jwt.ts`, `theme/colors.ts`, `theme/kinetic.ts` (R14), `ui/avatar`, `ui/card`, `ui/tabs`.
- **Exports e tipos sem uso:**
  - `ProgressRing`;
  - `MetricRow` e `DeltaChip`;
  - `PANEL_ROLES`;
  - `NAV_BY_ROLE.PERSONAL` (o tipo agora exclui `PERSONAL`);
  - `StatsPeriodOption`;
  - a prop `ring` do `Avatar`.
- **CSS morto em `theme.css`:** `.password-*`, `scaleUp`, `.k-live-dot` e `.k-badge-pulse` (sobras do chat), `--chart-1..5` e o bloco duplicado `:root --k-*`.
- **Dependência:** `next-themes`.
- **Comentários:** `/ws` no `.env.example` (o `.env` local não foi tocado), comentários fora do lugar e afirmações falsas.

**Simplificado (Y19–Y23)**
- **Y19:** `utils/errors.errorMessage()` substitui o `errorText` (5 cópias), o `billingErrorMessage` e as cópias inline.
  - O `bodyText` da geração por IA e o `errorMessage` do 2FA no AuthContext ficaram, porque a regra deles é diferente.
- **Y20:**
  - Em `utils/dates`: `dayMonth` (substitui 4 cópias e o `formatPauseDate`), `dateLabel`, `dayMonthLong` e `daysUntil` (os dois últimos saíram do `billingService`).
  - `utils/names.firstNameOf` substitui cerca de 10 cópias.
- **Y21:**
  - `components/chart-theme.ts` reúne `CHART` e `chartTooltipStyle`, usados por `RootHomePage` e `empresa-charts`.
  - O `DashboardTab` reaproveita a lista `PERIODS` do `PeriodTabs`, mas mantém o seletor animado próprio.
- **Y22:** ternários aninhados viraram funções: `checkoutItem`, `saveLabel`, `progressText` e `weightFootnote`.
- **Y23:**
  - `AppShell` calcula itens e home uma vez só;
  - `PersonalShell` usa `shortLabel`;
  - sai o interceptor de erro que não fazia nada no `api.ts`;
  - sai o reexport de `formatBRL`;
  - `isLoggedIn` é derivado de `currentUser`.

**Estrutural**
- **R12:** `pages/empresa/useEmpresaAnalytics.ts` (com `useState`/`useEffect`) é usado pela Visão Geral e por Analytics. Os gráficos continuam separados, porque o layout é diferente nas duas telas.
- **R13:**
  - `PhoneDialog` e `InviteStudentModal` passaram a usar o `ui/dialog` (Radix) no lugar do overlay e do focus trap feitos à mão.
  - As confirmações de Funcionários, Clientes e Compliance passaram a usar o `ConfirmDialog`. **Os botões agora dizem "Voltar" e "Aguarde…".**
- **R14:**
  - `Avatar` com classes Tailwind (`bg-k-surface2`, `text-k-primary`, `font-display`);
  - os `var(--k-*)` viraram `var(--color-k-*)`, do `@theme`;
  - conferido no CSS gerado que as variáveis continuam definidas.
- **R15:**
  - Telefone via `useMyPhone()` (react-query, chave `qk.myPhone`, sem expirar) em `layouts/PhoneGate.tsx`, sem o repasse por outlet context.
  - `tokenStorage` síncrono.
  - `confirmEmail`, `resendConfirmation`, `requestPasswordReset` e `resetPassword` foram para `services/authService.ts`, junto com o `accountError` usado também no cadastro.

## Arquivos novos

| Projeto | Arquivos |
|---|---|
| Backend | `utils/Strings.java`, `utils/Numbers.java`, `utils/Hashing.java`, `dtos/ValidationRules.java`, `models/OneTimeCode.java`, `repositories/OneTimeCodeRepository.java`, `services/OneTimeCodes.java` |
| App | `components/auth/AuthIcons.tsx`, `components/auth/RequirementItem.tsx`, `constants/password.ts`, `services/workoutService.ts` |
| Painel | `utils/errors.ts`, `utils/names.ts`, `components/chart-theme.ts`, `pages/empresa/useEmpresaAnalytics.ts`, `services/authService.ts` |

O grafo foi atualizado com `graphify update .`.

## Migrations (V53)

Segunda rodada, só nas migrations. As V3–V52 já aplicadas não mudam: qualquer byte altera o checksum e o Flyway recusa subir. A limpeza entrou numa migration nova, `V53__cleanup_and_session_plan.sql`, que **ainda não rodou no Supabase**.

| Item | O que mudou |
|---|---|
| G1–G3 | Saíram `idx_users_last_active` (sem uso e impedia o HOT update da presença), `idx_ai_plan_generations_trainer_student` (superado pela V33) e `idx_companies_parent` (coberto por `uq_companies_unit_slug`) |
| G4 | Saiu `chk_invite_code_label_length`, que repetia o `VARCHAR(80)` |
| G5 | Saiu `supabase/config.toml` (Supabase CLI com o `project_id` do projeto antigo) e a menção no README de `scripts/migracao-supabase` |
| Índices de FK | `workout_sessions (user_id, session_date)`, `exercise_set_logs (session_id)` e `(exercise_id)`, `exercises (workout_plan_id)`, `weight_history (user_id, logged_at)` |
| Y1 | `baseline-on-migrate`/`baseline-version=6` saíram do `application.properties`; o perfil de teste usa `baseline-on-migrate` com a V49 |
| Y2 | `REVOKE ... FROM anon, authenticated` em `shedlock`, `rate_limit_counters`, `trainer_events`, `deleted_accounts`, `access_logs` e nas duas sequences; o padrão das próximas migrations é `ENABLE ROW LEVEL SECURITY` + `REVOKE` direto |
| R1 | `workout_sessions` ganhou `workout_plan_id` e `created_at`; `workout_execution_logs` foi apagada |
| R2 | Não aplicado: V3–V49 ficam como estão |

**R1 em detalhe.** A ficha da sessão é a dos exercícios registrados (toda sessão tem ao menos uma série e cada exercício é de uma ficha); sessão que mistura fichas fica sem ficha. O backfill da V53 usa a mesma regra, e o `created_at` vem da primeira série (`logged_at`, gravado em UTC). Quem lia o log passou a ler a sessão: rodízio da Home (`HomeAggregatorService`), última execução por ficha (`WorkoutService`), perfil (`UserService`) e exportação (`DataExportService`). A exclusão de conta e a limpeza de cadastros não confirmados deixaram de citar a tabela.

**Mudanças de contrato**

| Onde | Mudança |
|---|---|
| `POST /api/sessions/log` | `workoutPlanId` é ignorado (a ficha sai dos exercícios); o app parou de enviar. Treinos feitos pela aba Treinos antes do B8, ou por versões antigas do app, passam a contar no rodízio da Home |
| `GET /api/users/profile` | `totalWorkoutsDone` conta todas as sessões, não só as com ficha |
| Exportação de dados (LGPD) | `formatVersion` 2: cada sessão traz `createdAt`, `planId` e `planTitle`; saiu `workoutExecutionLogs` |

Postman, `API_CHEATSHEET.txt` e `resume/banco-de-dados.md` foram atualizados.

**Verificação:**
- `mvnw verify` (Testcontainers): 116 testes unitários e 22 de integração verdes.
  - `SessionPlanBackfillIT` (novo) para na V52, grava sessões com séries de uma ficha, de duas fichas e sem série, e só então aplica a V53. Confere a ficha e a hora de cada sessão, os índices removidos e criados, a constraint e a tabela apagadas e o `REVOKE`.
  - `WorkoutSessionPlanIT` (novo) registra um treino sem `workoutPlanId` e confere a ficha gravada, o próximo treino da Home e o total do perfil.
  - `SchemaIT` confirma o `ddl-auto=validate` sobre a V53 e o RLS em todas as tabelas.
- App: `tsc --noEmit --noUnusedLocals --noUnusedParameters` limpo.
- O backend local não foi iniciado: a V53 só chega ao Supabase no próximo deploy.
