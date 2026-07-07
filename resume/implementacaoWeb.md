Fases 0, 1 e 2 do plano implementadas na branch implementacaoWeb (a Fase 3+ — dashboards e desktop — o próprio plano marca como "depois"). Backend compila com BUILD SUCCESS e o tsc do app mobile está limpo. Nada foi commitado ainda.

Backend (Fase 0 — identidade e papéis)
Role.java (ALUNO/PERSONAL/EMPRESA/ROOT), campo role + company_id no User.java e Company.java mínima. Migração V15 faz o backfill via DEFAULT 'ALUNO' e cria o índice em users.role (blindagem).
JWT agora carrega a claim role (JwtUtil.java), o CustomUserDetailsService.java emite ROLE_*, e o SecurityConfig.java ganhou @EnableMethodSecurity.
Registro aceita role opcional com whitelist ALUNO|PERSONAL (EMPRESA/ROOT nunca nascem por auto-cadastro) e o RootUserSeeder.java semeia o ROOT a partir de ROOT_USER_EMAIL/ROOT_USER_PASSWORD — sem as variáveis, não faz nada.
Backend (Fase 1 — vínculo + convite)
TrainerClient.java + migração V16 com o índice único parcial (student_id) WHERE status='ATIVO' da blindagem, mais um segundo unique parcial que impede convite PENDENTE duplicado do mesmo par.
TrainerLinkService.java valida com existsByStudentIdAndStatus(..., ATIVO) e, sob corrida, captura a DataIntegrityViolationException do banco e responde 409 (via ActiveTrainerConflictException no GlobalExceptionHandler). Convites alheios retornam 404 (não vaza existência).
Endpoints exatamente como no plano: POST /api/trainer/invites e GET /api/trainer/students (guard hasRole('PERSONAL')); GET /api/me/invites, accept/decline e GET /api/me/trainer (guard hasRole('ALUNO')).
Backend (Fase 2 — chat STOMP)
ChatMessage.java + V17 (índice do par + índice parcial de não-lidas).
STOMP em /ws (WebSocketConfig.java): a blindagem do handshake está no JwtChannelInterceptor.java — JWT lido do header STOMP CONNECT (com ?token= como fallback via handshake interceptor) e injetado como Principal; sem token válido a conexão cai ali.
ChatService.java só permite conversa entre par com vínculo ATIVO e entrega em /user/queue/chat dos dois lados. REST: histórico paginado, marcar lido e unread-count, além de um POST de envio que o plano não listava — adicionei como fallback para quando o WebSocket do cliente não conecta (o push em tempo real acontece igual).
App mobile (parte da Fase 1 e 2)
trainerService.ts e chatService.ts (este com cliente STOMP via @stomp/stompjs, instalado, token no connectHeaders).
No perfil: seção "Seu Personal" com card do personal ativo e linha de convites com badge, abrindo o novo TrainerInvitesModal.tsx (aceitar/recusar, com tratamento do 409).
TrainerChatScreen.tsx (rota TrainerChat no AppRoutes.tsx): bolhas invertidas com paginação, envio por STOMP com fallback REST e polling de 10s enquanto o socket estiver fora.
Duas escolhas que fiz onde o plano era ambíguo: o enum Role foi para enums/ (convenção do projeto, o plano dizia models/), e GET /api/me/trainer responde 404 quando não há personal ativo (o service mobile traduz para null). O knowledge graph foi atualizado com graphify update .. Próximos passos naturais: commit, testar o fluxo ponta a ponta com dois usuários (registrar um PERSONAL via role no register), e então a Fase 3 (dashboards + kinetic-desktop).