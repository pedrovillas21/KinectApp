Plano — Painel Web do Personal (kinetic-desktop)
Context
O backend já tem as Fases 0, 1 e 2 do PainelPersonalPlan.md prontas na branch implementacaoWeb (papéis/JWT com claim role, @EnableMethodSecurity, endpoints de convite/alunos e chat REST+STOMP). Hoje isso só é consumido pelo app mobile (Expo/React Native). Não existe nenhum cliente web — o repositório tem apenas KineticApp/ (mobile) e kinetic-backend/.

O objetivo é habilitar o perfil PERSONAL na web: um painel desktop (kinetic-desktop, React/Vite/DOM) onde o personal faz login, lista seus alunos, convida por e-mail, conversa em tempo real e vê um dashboard básico de cada aluno. Decisões confirmadas com o usuário:

Stack: novo projeto Vite + React + TS (DOM), reusando as camadas puras do mobile. É o kinetic-desktop que o plano previa. Não usar Expo web (arrasta deps nativas e mistura UX de aluno).
Escopo: Fases 1+2 + dashboard básico — o que exige criar os endpoints Fase 3 (stats do aluno, escopados por posse do vínculo), pois hoje todo endpoint de stats é self-scoped pelo e-mail do logado.
Resultado esperado: o personal usa, no navegador, tudo que já foi construído para ele, mais uma visão de progresso do aluno.

Parte A — Ajustes no backend (kinetic-backend)
A1. Expor role na resposta de login (aditivo, necessário para o roteamento por papel)
Hoje AuthResponseDTO não traz o papel — ele só existe na claim do JWT. O painel precisa saber o papel para (a) barrar login de quem não é PERSONAL e (b) rotear.

dtos/AuthResponseDTO.java — adicionar campo String role.
services/AuthService.java (login, ~linhas 61–74) — preencher user.getRole().name() no DTO.
Mudança puramente aditiva; o mobile ignora o campo novo.
A2. Liberar a origem web no CORS (REST + WebSocket)
cors.allowed-origins hoje só tem as origens do Expo (8081, 19006).

src/main/resources/application.properties:43 — incluir a origem do Vite no default: ...:http://localhost:8081,http://localhost:19006,http://localhost:5173.
Documentar que em produção se usa a env CORS_ALLOWED_ORIGINS.
REST: SecurityConfig.corsConfigurationSource() já lê a property → coberto ao adicionar a origem.
STOMP/WebSocket (verificado): config/WebSocketConfig.java:41-49 já injeta ${cors.allowed-origins} (@Value, linha 36-37) e chama .setAllowedOrigins(origins) no registerStompEndpoints — logo adicionar a origem à property já resolve o 403 do handshake, sem mudança de código. ⚠️ Não adicionar .withSockJS(): o cliente (chatService.ts) usa WebSocket nativo (brokerURL ws://…/ws), não SockJS — habilitar SockJS quebraria a conexão atual. Só confirmar que a property nova propagou aqui.
A3. Endpoints Fase 3 do personal (dashboard básico, escopados por posse)
Reaproveitar os services existentes, que são keyed por e-mail, resolvendo o aluno por studentId e validando o vínculo ATIVO antes de delegar. Adicionar em controllers/TrainerController.java (já guardado por @PreAuthorize("hasRole('PERSONAL')")):

GET /api/trainer/students/{studentId}/stats?period=... → StatsService.getSummary(studentEmail, period) (volume, tempo de treino, evolução de peso vs. meta).
GET /api/trainer/students/{studentId}/plan-evolution → StatsService.getPlanEvolution(studentEmail).
(opcional, se sobrar tempo) GET /api/trainer/students/{studentId}/monthly-stats → WorkoutSessionService.getMonthlyStats(studentEmail).
Peça de lógica nova (a proteção): em services/TrainerLinkService.java, um método String resolveOwnedStudentEmail(trainerEmail, studentId) que:

Confirma via TrainerClientRepository que existe vínculo ATIVO entre o personal logado e o aluno (reusar/expandir existsBy...Status(...ATIVO)), lançando 403/404 caso contrário (não vazar existência);
Resolve o e-mail do aluno via UserRepository.findById(studentId) (repositories/UserRepository.java). Os controllers chamam esse método e repassam o e-mail aos services existentes — zero mudança em StatsService/WorkoutSessionService.
mvn clean package no kinetic-backend após A1–A3 para garantir BUILD SUCCESS.

Parte B — Novo app web kinetic-desktop/ (Vite + React + TS)
Criar na raiz do repositório (irmão de KineticApp/ e kinetic-backend/). Scaffold Vite react-ts + react-router-dom, axios, @stomp/stompjs, e recharts para os gráficos (o mobile usa react-native-gifted-charts, que é RN-only — na web trocamos por Recharts). Env única VITE_API_URL (base http; /api e /ws derivados em código).

B1. Camadas portadas do mobile (copiar/adaptar — lógica idêntica)
De KineticApp/src/ para kinetic-desktop/src/, trocando só a fronteira nativa e o env:

services/tokenStorage.ts — reimplementar com localStorage (mesma interface pública: getAccessToken/setAccessToken/getRefreshToken/setRefreshToken/setTokens/clearTokens). É a única dependência nativa (expo-secure-store) — este módulo é o "encaixe" limpo.
services/api.ts — copiar quase igual (interceptors de Bearer + refresh 401 coalescido já são web-safe); trocar process.env.EXPO_PUBLIC_API_URL por import.meta.env.VITE_API_URL.
services/chatService.ts — copiar como está (REST + STOMP via @stomp/stompjs, que é browser-native; token no connectHeaders + ?token= de fallback já cobre o handshake do browser); só trocar o env.
utils/jwt.ts — copiar (útil para checar expiração; decoder próprio, sem atob).
types/index.ts — copiar os tipos relevantes: TrainerPeer, TrainerLink, ChatMessage, Page<T>, e os DTOs de stats (StatsSummary..., PlanEvolution...).
theme/kinetic.ts + theme/colors.ts — copiar os tokens KINETIC/COLORS (objetos JS puros) e expô-los como CSS variables num theme.css global + manter o objeto TS para estilos inline. ⚠️ O mobile usa layout Yoga/flex por densidade (DP) — na web o theme.css precisa também de um reset de desktop SPA: html,body,#root { height:100vh } e um shell principal overflow:hidden, deixando o scroll só na lista de mensagens do chat e no conteúdo das abas; cabeçalho do detalhe do aluno fixo (sticky). Mapear o ciano #00E5FF (KINETIC.primary) para bordas/estados ativos sobre o dark mode, como no mobile.
B2. Código novo (web)
services/trainerService.ts — wrappers do lado personal (não existem em lugar nenhum ainda):
listStudents(): Promise<TrainerLink[]> → GET /trainer/students
inviteStudent(email): Promise<TrainerLink> → POST /trainer/invites (tratar 409 = aluno já tem personal ativo, e 404 = aluno não cadastrado)
getStudentStats(id, period) / getStudentPlanEvolution(id) → endpoints da Parte A3
contexts/AuthContext.tsx — versão web enxuta: signIn(email, senha) → POST /auth/login, persiste tokens no localStorage e guarda o usuário com role; barra login de quem não é PERSONAL (mensagem clara); signOut; register opcional enviando role: 'PERSONAL' no POST /auth/register. Registrar o setSignOutHandler do api.ts (mesmo padrão do mobile).
routes/ — react-router-dom com ProtectedRoute (exige logado + PERSONAL): /login, /students (lista), /students/:id (detalhe com abas Dashboard/Chat).
B3. Telas (DOM/CSS, reescritas — a lógica vem das telas RN)
LoginPage — form e-mail/senha; erro amigável para papel≠PERSONAL.
StudentsListPage — listStudents(); botão "Convidar aluno" → InviteStudentModal (porta a lógica do TrainerInvitesModal/invite: guard de duplo-clique, tratamento de 409/404); cada linha abre o detalhe.
StudentDetailPage — cabeçalho com peer (nome/e-mail/avatar via inicial) + abas:
DashboardTab — getStudentStats/getStudentPlanEvolution; gráficos com Recharts (volume, tempo, peso vs. meta), cada um envolto em <ResponsiveContainer width="100%" height={...}>. Ao construir os gráficos, carregar a skill dataviz antes de escolher cores/tipos de gráfico. ⚠️ Estado vazio: aluno recém-vinculado retorna arrays vazios ou com 1 ponto. Tratar isso explicitamente — em vez de renderizar gráfico quebrado, exibir placeholder no padrão Kinetic ("Nenhum treino registrado por este aluno no período selecionado") com KINETIC.textMuted/opacidade reduzida. Vale para cada card do dashboard.
ChatPanel — porta o state machine do TrainerChatScreen.tsx (paginação por PAGE_SIZE=30, mergeMessage dedupe por id, envio STOMP-first com fallback REST, polling de 10s só enquanto o socket está fora, filtro do /user/queue/chat pelo peer atual), usando currentUser.id para distinguir "minhas" mensagens. UI em bolhas DOM.
Ordem de execução
Backend A1 (role no login) → A2 (CORS) → A3 (endpoints Fase 3) + mvn clean package.
Scaffold kinetic-desktop/ (Vite) + deps; portar B1 (camadas puras) e validar tsc.
B2 (auth web + trainerService + rotas) → LoginPage → StudentsListPage + invite.
ChatPanel (reusa chatService inteiro).
DashboardTab (Recharts + skill dataviz).
graphify update . para manter o knowledge graph atualizado.
Verificação (ponta a ponta, dois usuários)
Subir kinetic-backend (com CORS_ALLOWED_ORIGINS incluindo http://localhost:5173) e o kinetic-desktop (npm run dev).
Registrar um PERSONAL (POST /auth/register com role:'PERSONAL') e um ALUNO.
Personal loga na web → convida o aluno; aluno aceita (pelo app mobile ou via API) → vínculo ATIVO.
Web: aluno aparece em /students; abrir detalhe → Chat: enviar mensagem e confirmar entrega em tempo real nos dois lados (checar que o STOMP conecta; derrubar o socket e confirmar o fallback REST+polling).
Dashboard: confirmar que stats/plan-evolution do aluno renderizam e que um personal sem vínculo recebe 403 ao tentar GET /api/trainer/students/{outroAluno}/stats.
Confirmar que login de um ALUNO no painel web é bloqueado com mensagem clara.
Notas
Fica de fora (Fase 3+ completa / EMPRESA): CRUD manual de ficha pelo personal, alertas de inatividade, telas de empresa/ROOT. O dashboard aqui é o subconjunto "básico" reusando os services existentes.
Não commitar sem o usuário pedir; branch atual implementacaoWeb.