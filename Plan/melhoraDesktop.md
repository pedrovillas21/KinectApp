Plano — Fechar a frente ROOT + EMPRESA no kinetic-desktop
Context
O Plan/melhoraDesktop.md é um brief de UI/UX pedindo o desenho da Sidebar e dos widgets de Home para dois papéis novos no painel web desktop: ROOT (admin global) e EMPRESA (academia/estúdio). Hoje o kinetic-desktop é um SPA exclusivo de PERSONAL: o AuthContext barra qualquer papel ≠ PERSONAL no login e no bootstrap, o ProtectedRoute só checa "logado", o App.tsx roteia tudo para /students, e não existe sidebar nem app-shell — cada página pinta seu próprio header.

O backend, por outro lado, já tem a fundação dos 4 papéis pronta desde a Fase 0: enum Role { ALUNO, PERSONAL, EMPRESA, ROOT }, users.role (JWT claim role, authorities ROLE_*, @EnableMethodSecurity ligado), entidade Company + companies + users.company_id, e — a peça-chave — TrainerClient.source (INVITE vs COMPANY) + companyId, que já codifica o "corporativo vs particular" exigido pela regra de feedback condicional. ROOT é semeado no boot (RootUserSeeder).

O que falta é aditivo: controllers/endpoints de ROOT e EMPRESA, o write-path de vínculo corporativo (source=COMPANY, hoje TrainerLinkService.invite() fixa INVITE), a feature de feedback (não existe nada), e no desktop um app-shell + sidebar + roteamento por papel + as telas de ROOT e EMPRESA.

Decisões travadas com o usuário (2026-07-10):

Implementação completa (backend + frontend), não só spec.
ROOT primeiro, depois EMPRESA.
KPIs sem fonte de dados → real no barato (contagens, vínculos, provisionamento, compliance), placeholder "em breve" no caro (faturamento macro, logs de auditoria) com estado vazio no padrão Kinetic.
Feedback → backend + leitura no desktop (entidade + gate + painel da EMPRESA). Envio pelo app mobile fica para uma frente posterior.
Design com Tailwind + shadcn/ui para um visual responsivo e coeso. Nuance verificada: o Tailwind v4 já está no projeto (@tailwindcss/vite) e o helper cn (clsx + tailwind-merge) também — mas o shadcn ainda não foi inicializado (não há components.json nem src/components/ui/, nem os @radix-ui/*/class-variance-authority). A Fase 0 passa a inicializá-lo e adicionar os componentes.
Resultado esperado: ROOT e EMPRESA logam no painel web, cada um com sua sidebar e Home; ROOT provisiona empresas/personais e aplica compliance; EMPRESA gere funcionários/clientes, vê analytics de retenção e recebe feedbacks respeitando o filtro corporativo vs particular.

Especificação de UI (o que o brief pede)
Sidebar — ROOT
Visão Geral (Home / dashboard macro) — /root
Empresas (CRUD + provisionamento) — /root/empresas
Personais (lista global, provisionamento, status) — /root/personais
Usuários & Compliance (bloquear/suspender/excluir contas) — /root/usuarios
Auditoria (logs de sistema, histórico de acessos) — /root/auditoria (placeholder "em breve")
Faturamento (métricas de negócio macro) — /root/faturamento (placeholder "em breve")
Rodapé: usuário logado + logout.
Sidebar — EMPRESA
Visão Geral (Home corporativa) — /empresa
Funcionários (personais: vincular/desvincular) — /empresa/funcionarios
Clientes (alunos: vincular/desvincular, acessos) — /empresa/clientes
Feedbacks (feedbacks recebidos, filtrados pela regra) — /empresa/feedbacks
Analytics (retenção, volume por unidade) — /empresa/analytics
Rodapé: empresa + logout.
Widgets / Home — ROOT
KPIs (reais): Total de Empresas, Total de Personais, Total de Alunos, Novos no período (segmented control reusando o PERIODS do dashboard atual).
Atalhos de clique único: + Nova Empresa, + Novo Personal, Ir para Compliance.
Gráfico (real, barato): crescimento de contas por período (LineChart).
Widgets placeholder com estado vazio Kinetic ("Em breve"): Faturamento macro, Auditoria recente.
Widgets / Home — EMPRESA (foco Personal × Aluno × Retenção)
KPIs (reais): Personais ativos, Alunos ativos, Alunos vinculados no período, Taxa de retenção (alunos com vínculo ATIVO / total no período — cálculo barato sobre TrainerClient).
Gráfico: Volume de treinos na unidade (soma sobre alunos da empresa, reusa WorkoutSessionService); Desempenho por instrutor (nº de alunos ativos por personal).
Painel de Feedbacks Recebidos: mostra só feedbacks cujo vínculo é source=COMPANY da empresa; visualmente, um badge "Corporativo" nos elegíveis e um empty-state explicando que vínculos particulares não geram feedback (a regra é aplicada no backend; o front só rotula).
Atalhos: + Vincular Personal, + Vincular Aluno.
Fase 0 — Fundação compartilhada do desktop (pré-requisito de ROOT e EMPRESA)
Generalizar o app de "PERSONAL-only" para multi-papel e estabelecer o design system Tailwind + shadcn. Sem isso nem ROOT nem EMPRESA conseguem logar.

0a. Inicializar shadcn/ui (ainda não existe no projeto):

Rodar npx shadcn@latest init no kinetic-desktop (compatível com Tailwind v4 + o @theme que o theme/theme.css já usa). Gera components.json, ajusta o CSS e traz class-variance-authority + @radix-ui/*. O helper cn já existe em utils/cn.ts — apontar o components.json para ele.
Mapear os tokens Kinetic → variáveis de tema do shadcn: os tokens de marca já vivem como CSS vars em theme.css (--k-primary #00E5FF, --k-bg, --k-text, etc.). Ligar --background/--foreground/--primary/--card/--border/--ring do shadcn a esses valores para que os componentes nasçam no visual dark "athletic" da marca, sem retrabalho de estilo. Modo dark é o default do painel.
Adicionar os componentes que as telas usam: button, card, dialog, input, label, table, badge, dropdown-menu, tabs, sidebar (o bloco Sidebar oficial do shadcn), avatar, sonner (toasts), skeleton (loading), select, separator, tooltip.
0b. Multi-papel (auth + rotas):

contexts/AuthContext.tsx: remover o gate role !== 'PERSONAL' do signIn (linhas 130-133) e do bootstrap (81-84); passar a persistir qualquer papel autorizado do painel (PERSONAL, EMPRESA, ROOT — ALUNO continua barrado, com mensagem clara de usar o app). Guardar role no KineticWebUser (já existe o campo). Manter refresh/rotação intactos.
routes/ProtectedRoute.tsx: adicionar prop allowedRoles?: string[]; se o papel não estiver na lista → <Navigate> para a home do papel dele (ou /login). Mantém o splash de isLoadingAuth (trocar por Skeleton).
Novo src/config/nav.ts: mapa de itens de sidebar keyed por Role (label, ícone lucide-react, path, flag comingSoon). Fonte única da navegação (é o "menu dinâmico" que o brief pede).
Novo src/layouts/AppShell.tsx + src/components/AppSidebar.tsx: usar o Sidebar do shadcn (SidebarProvider/SidebarMenu/SidebarMenuItem + colapsável e responsivo por padrão) alimentado por nav.ts, com <Outlet/> (react-router v7) na área de conteúdo. Item ativo via NavLink/isActive. Isso substitui os headers hand-made e dá responsividade (drawer no mobile) de graça.
App.tsx: trocar rotas planas por rotas de layout aninhadas: /login solto; um bloco PERSONAL (AppShell + /students, /students/:id), um bloco ROOT (allowedRoles={['ROOT']} + filhos /root/*), um bloco EMPRESA (allowedRoles={['EMPRESA']} + /empresa/*). Catch-all * e o redirect pós-login viram role-aware (mapa role → home: PERSONAL→/students, ROOT→/root, EMPRESA→/empresa); ajustar os redirects hardcoded em LoginPage.tsx.
0c. Primitivos de dados compartilhados:

Extrair de DashboardTab.tsx e reconstruir sobre shadcn Card: StatTile (104-136), DeltaChip (79-102 → vira Badge), MetricRow (138-152), EmptyCard (70-77 → Card com estado vazio). Reusados nas Homes de ROOT e EMPRESA; DashboardTab passa a importá-los.
Token de cor de gráfico: em theme.css/theme/kinetic.ts, série --k-chart-series: #00A5B8 (ciano escurecido validado pela skill dataviz para a banda de luminosidade em dark — ver memória web-panel-implemented). #00E5FF segue como acento de UI. Usar #00A5B8 em toda série nova (Recharts continua sendo a lib de gráficos; shadcn cobre chrome/layout, não os charts).
Verificação Fase 0: logar com o ROOT semeado (ROOT_USER_EMAIL) → cai em /root com a sidebar de ROOT; logar com PERSONAL → continua em /students sem regressão; ALUNO → bloqueado.

Fase 1 — Backend ROOT (provisionamento + compliance)
Reusar o padrão de controller guardado (@PreAuthorize por papel) de TrainerController.java. Blindar tudo com DTOs.

Novo repositories/CompanyRepository.java, services/CompanyService.java, controllers/RootController.java (@PreAuthorize("hasRole('ROOT')"), base /api/root):
POST /api/root/companies — cria Company + o usuário EMPRESA dono (User role=EMPRESA, company_id apontando pra ela, senha inicial). Reusa o encoder de senha do AuthService.
GET /api/root/companies — lista paginada (Page<T>, já usado em types).
POST /api/root/personais — provisiona um PERSONAL (opcionalmente já vinculado a uma empresa via company_id).
GET /api/root/personais, GET /api/root/users — listas com filtro por papel/status.
GET /api/root/metrics — contagens (empresas, personais, alunos, novos no período) via count queries. Barato/real.
Compliance (real): adicionar enums/UserStatus.java (ATIVO, SUSPENSO, BLOQUEADO) + coluna users.status via migração V18. Endpoints PATCH /api/root/users/{id}/status (bloquear/suspender/reativar) e DELETE /api/root/users/{id} (exclusão/soft-delete). Enforcar no login (AuthService.login) e/ou no JwtAuthenticationFilter: status ≠ ATIVO → 403 com mensagem.
Auditoria/Faturamento: não construir backend agora (decisão "placeholder no caro"). Os endpoints/telas ficam como stub; documentar como frente futura.
mvn clean package no kinetic-backend → BUILD SUCCESS.
Fase 2 — Frontend ROOT
Novo src/services/rootService.ts — wrappers tipados sobre o axios api (padrão de trainerService.ts): listCompanies, createCompany, listPersonais, createPersonal, getMetrics, setUserStatus, deleteUser.
Novo src/pages/root/ (tudo sobre shadcn + Tailwind):
RootHomePage.tsx — Home com StatTile/Card (KPIs de getMetrics), LineChart de crescimento (Recharts + série #00A5B8), atalhos (Button), e cards placeholder "em breve" (Faturamento, Auditoria) no padrão EmptyCard.
CompaniesPage.tsx — lista em Table do shadcn (evolui o card-grid atual para tabela responsiva) com Skeleton/empty-state; criação via Dialog + Input/Label + Button, portando a lógica de InviteStudentModal.tsx (guard de duplo-clique, tratamento por status HTTP, feedback via Sonner).
PersonaisPage.tsx — mesma estrutura, provisionamento de personal.
CompliancePage.tsx — Table de usuários + DropdownMenu de ações (bloquear/suspender/excluir) com Dialog de confirmação; status via Badge.
Registrar as rotas no bloco ROOT do App.tsx; itens no nav.ts.
Carregar a skill dataviz antes de definir cores/tipos de gráfico.
Fase 3 — Backend EMPRESA (gestão + analytics + feedback)
Write-path corporativo (a peça de lógica realmente nova): em services/TrainerLinkService.java, método assignStudentToTrainer(companyId, trainerId, studentId) que cria TrainerClient com source=COMPANY, companyId=<empresa>, status ATIVO (respeitando o índice único parcial de 1 personal ATIVO/aluno → traduzir DataIntegrityViolation em 409, como o invite() já faz).
Novo controllers/EmpresaController.java (@PreAuthorize("hasRole('EMPRESA')"), base /api/empresa), escopado pela company_id do usuário logado (BaseController.currentUserEmail() → resolve company):
GET /api/empresa/personais / POST vincular / DELETE desvincular funcionário.
GET /api/empresa/alunos / POST vincular (usa assignStudentToTrainer) / DELETE desvincular.
GET /api/empresa/analytics — contagens + retenção + volume por unidade (reusa WorkoutSessionService/StatsService agregando sobre os alunos da empresa). Barato/real.
Feedback (novo, do zero):
models/Feedback.java + migração V19 (id, student_id, personal_id, company_id, content, anonymous bool, created_at).
repositories/FeedbackRepository.java, services/FeedbackService.java.
Gate de ownership (a regra de negócio crítica): um feedback aluno→empresa só é válido/visível se o vínculo ATIVO do aluno com aquele personal tem source=COMPANY e companyId == empresa. Predicado central no FeedbackService (reusa TrainerClientRepository). Cenário B (particular, source=INVITE) → recurso desabilitado.
Endpoint de leitura GET /api/empresa/feedbacks (empresa lê os recebidos; respeita anônimo/nominal). O endpoint de escrita (aluno→empresa) fica modelado mas o envio pelo mobile é frente posterior.
mvn clean package → BUILD SUCCESS.
Fase 4 — Frontend EMPRESA
Novo src/services/empresaService.ts + src/services/feedbackService.ts.
Novo src/pages/empresa/ (sobre shadcn + Tailwind):
EmpresaHomePage.tsx — KPIs de retenção/instrutores (StatTile/Card), gráficos Personal×Aluno×Retenção e Volume por unidade (Recharts, série #00A5B8), atalhos (Button).
FuncionariosPage.tsx / ClientesPage.tsx — Table + Dialog de vincular/desvincular (mesmos padrões da Fase 2).
FeedbacksPage.tsx — painel de feedbacks recebidos em Card/Table; Badge "Corporativo" nos elegíveis e empty-state explicando o filtro (a elegibilidade vem do backend; o front só rotula/explica). Anônimo vs nominal via Avatar/Badge.
AnalyticsPage.tsx — visão ampliada dos gráficos.
Registrar rotas no bloco EMPRESA do App.tsx + nav.ts.
Fase 5 — Verificação e fechamento
e2e (backend real + Supabase dev), na linha do que já foi feito para o PERSONAL:
Logar com o ROOT semeado → criar uma Empresa (gera user EMPRESA) → criar um Personal.
Aplicar compliance: suspender um usuário e confirmar 403 no login dele.
Logar como a EMPRESA criada → vincular o Personal (funcionário) e vincular um Aluno (source=COMPANY) → ver os dois nas listas e nos KPIs de retenção.
Inserir um feedback via API para um vínculo source=COMPANY → aparece no painel da EMPRESA; inserir um para um vínculo source=INVITE → não aparece (gate).
Confirmar isolamento: uma EMPRESA não vê dados de outra (company_id scoping); um PERSONAL/ALUNO não acessa /api/root/* nem /api/empresa/* (403).
Regressão: fluxo PERSONAL (/students, chat, dashboard) intacto.
Confirmar que os widgets placeholder (Faturamento/Auditoria) renderizam o estado "em breve" sem quebrar.
graphify update . para manter o knowledge graph atualizado (AST-only, sem custo).
Não commitar sem o usuário pedir; branch atual implementacaoWeb.
Arquivos-âncora
Frontend (reusar/estender): App.tsx, contexts/AuthContext.tsx, routes/ProtectedRoute.tsx, components/DashboardTab.tsx (extrair primitivos), pages/StudentsListPage.tsx (padrão de lista), components/InviteStudentModal.tsx (padrão de modal/form), services/trainerService.ts (padrão de service), components/Avatar.tsx, theme/theme.css. Frontend (novo): components.json + src/components/ui/* (shadcn), config/nav.ts, layouts/AppShell.tsx, components/AppSidebar.tsx, pages/root/*, pages/empresa/*, services/rootService.ts|empresaService.ts|feedbackService.ts. Design: Tailwind v4 (já no projeto) + shadcn/ui inicializado na Fase 0, com tokens do shadcn mapeados aos CSS vars Kinetic de theme.css; Recharts segue para gráficos. Backend (reusar/estender): enums/Role.java, models/Company.java, models/TrainerClient.java, services/TrainerLinkService.java (write-path COMPANY), services/AuthService.java (status no login), controllers/TrainerController.java (padrão), config/SecurityConfig.java (sem mudança — method security já ligado). Backend (novo): controllers/RootController.java, controllers/EmpresaController.java, repositories/CompanyRepository.java, services/CompanyService.java, enums/UserStatus.java, models/Feedback.java + repo/service, migrações V18 (status) e V19 (feedback).