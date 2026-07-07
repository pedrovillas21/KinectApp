# 🏋️ Plano — Painel Desktop do Personal (Kinetic)

> **Objetivo:** Habilitar um painel **desktop web** onde o profissional (personal) gerencia alunos — fichas, evolução, volume, tempo de treino, peso vs. meta — reutilizando o backend e o banco atuais. O desktop é **apenas mais um cliente web** do `kinetic-backend`.

## 📌 Decisão de Arquitetura (fechada)
- **Mesmo backend, mesmo banco.** Nada de servidor novo. Criar outro servidor exigiria duplicar/sincronizar dados (fonte de bugs). O dado é o mesmo → o servidor é o mesmo.
- **Desktop = cliente web** (React) que consome a mesma API REST/WS, reaproveitando tipos, services e design system do `KineticApp`.
- Tudo abaixo é **aditivo**: o app mobile atual não quebra. Todo usuário existente vira `ALUNO` automaticamente.

```
   App Mobile (aluno)  ─┐
                        ├──▶  kinetic-backend (Spring Boot)  ──▶  PostgreSQL (mesmo banco)
   Desktop (personal)  ─┘
```

## 👥 Modelo de Papéis (4 roles)

| Papel | Como nasce | O que faz |
|---|---|---|
| **ALUNO** | Auto-cadastro no app (default de hoje) | Treina, recebe convite, vê seu personal, conversa |
| **PERSONAL** | Auto-cadastro solo **ou** criado por uma EMPRESA | Convida alunos, monta fichas, acompanha, conversa |
| **EMPRESA** | Criada pelo **ROOT** dentro do sistema | Cadastra personais e **linka direto** a alunos (sem convite) |
| **ROOT** | Semente inicial (seed no boot) | Cadastra empresas; admin do sistema |

## ✅ Regras de Negócio (fechadas)
- **Vínculo personal↔aluno** nasce de dois jeitos, distinguidos por `source`:
  - `INVITE` (personal autônomo) → nasce `PENDENTE`, vira `ATIVO` no aceite do aluno.
  - `COMPANY` (empresa atribui) → nasce `ATIVO` direto, sem convite.
- **Convite (MVP):** apenas aluno **já cadastrado** (lookup por e-mail). Convite por e-mail para não-cadastrado fica para quando houver **Resend/SMTP** — o modelo já é preparado (campo `source` + status pendente acomodam esse fluxo depois).
- **Cardinalidade:** **1 personal ATIVO por aluno.** Aceitar um convite quando já existe vínculo ativo é bloqueado.
- **Chat personal↔aluno:** **WebSocket/STOMP** desde o MVP (tempo real de verdade).
- **NÃO reusar** o `UserConnection` (social) para o vínculo profissional — domínios diferentes.

---

## 🗺️ Roadmap de Execução (em ordem)

### Fase 0 — Identidade e Papéis (backend)
> Pré-requisito de tudo. Não cria endpoint novo; prepara identidade/segurança. Nada quebra no mobile: todos viram `ALUNO` e o token só ganha uma claim a mais.

**Modelo**
- `models/Role.java` *(novo enum)* — `ALUNO, PERSONAL, EMPRESA, ROOT`.
- `models/User.java` — `@Enumerated(EnumType.STRING) Role role` (default `ALUNO`) + `company_id` nullable.
- `models/Company.java` *(novo)* — mínimo (id, nome, created_at) só para o FK existir; telas de empresa ficam para depois.
- Migração SQL: coluna `role` com default `'ALUNO'` (backfill dos usuários atuais) + tabela `companies` + coluna `company_id` em `users`.
- 🛡️ **Blindagem — índice em `role`:** a mesma migração cria `CREATE INDEX idx_users_role ON users(role)`. Consultas por papel (listar personais, agregados por role) crescem com a base — com o índice viram *Index Scan* e a API se mantém instantânea.

**Segurança (habilita o `@PreAuthorize`)**
- `security/JwtUtil.java` — incluir `role` nas claims do token.
- `security/CustomUserDetailsService.java` — emitir `SimpleGrantedAuthority("ROLE_" + role)`.
- `config/SecurityConfig.java` — adicionar `@EnableMethodSecurity`; manter `anyRequest().authenticated()` (guards por papel entram via `@PreAuthorize` nos controllers novos).

**Cadastro / seed**
- `services/AuthService.register()` — setar `role = ALUNO` explicitamente (comportamento atual preservado).
- Caminho de auto-cadastro de personal autônomo (marca `PERSONAL`).
- Seed do usuário `ROOT` no boot (`CommandLineRunner` ou migração), configurável por variável de ambiente. **Nunca** senha em texto puro no código.

---

### Fase 1 — Vínculo + Convite (backend + **app mobile**)
> ⚠️ Esta fase toca o **app do aluno**, não só o desktop futuro. É onde o aluno recebe o convite e vê quem é o personal dele.

**Modelo**
- `models/TrainerClient.java` *(novo)* — `id`, `trainer_id` (FK User), `student_id` (FK User), `status` (`PENDENTE`/`ATIVO`/`RECUSADO`/`ENCERRADO`), `source` (`INVITE`/`COMPANY`), `company_id?`, `created_at`, `responded_at`.
- `repositories/TrainerClientRepository.java` — a query que valida "aluno já tem personal?" filtra **explicitamente** por `status = 'ATIVO'` (ex.: `existsByStudentIdAndStatus(studentId, ATIVO)`); vínculos `PENDENTE`/`RECUSADO`/`ENCERRADO` não bloqueiam novo convite.
- Migração SQL da tabela `trainer_clients`.
- 🛡️ **Blindagem — concorrência de convites:** a validação na aplicação não basta sob corrida (dois personais convidando/aceitando ao mesmo tempo passam ambos pelo `exists` antes do commit). A migração adiciona um **índice único parcial** que faz o banco ser a última linha de defesa:
  ```sql
  CREATE UNIQUE INDEX uq_trainer_clients_one_active_per_student
      ON trainer_clients (student_id)
      WHERE status = 'ATIVO';
  ```
  O service trata a `DataIntegrityViolationException` do insert/update concorrente e responde 409 (aluno já possui personal ativo).

**Endpoints**
- `POST /api/trainer/invites` — personal convida aluno por e-mail (valida existência; bloqueia se aluno já tem personal ativo).
- `GET  /api/me/invites` — aluno lista convites pendentes (badge no app).
- `POST /api/me/invites/{id}/accept` — aceita (aplica regra de 1 personal ativo).
- `POST /api/me/invites/{id}/decline` — recusa.
- `GET  /api/me/trainer` — aluno vê **quem é o personal dele**.
- `GET  /api/trainer/students` — personal lista seus alunos.
- Guards: `@PreAuthorize("hasRole('PERSONAL')")` / `hasRole('ALUNO')` + checagem de posse do vínculo.

**App mobile (aluno)**
- Tela/notificação de convite recebido + ação aceitar/recusar.
- Card "Seu Personal" no perfil/home.

---

### Fase 2 — Chat personal↔aluno (backend + app mobile)
**Modelo**
- `models/ChatMessage.java` *(novo)* — thread derivada do par personal↔aluno: `id`, `sender_id`, `recipient_id`, `content`, `sent_at`, `read_at`.
- `repositories/ChatMessageRepository.java` + migração SQL.

**Tempo real (STOMP)**
- Dependência `spring-boot-starter-websocket`.
- `config/WebSocketConfig.java` — endpoint `/ws` com handshake autenticado por JWT.
- 🛡️ **Blindagem — token no handshake:** navegadores (e vários clientes móveis) **não enviam header `Authorization` customizado** no handshake nativo do WebSocket. Não depender do header HTTP: o cliente manda o JWT no **header STOMP `CONNECT`** (`connectHeaders: { Authorization: 'Bearer …' }`) — com query param na URL como fallback — e um **`ChannelInterceptor`** (registrado em `configureClientInboundChannel`) intercepta o frame `CONNECT`, valida o token via `JwtUtil` e injeta o `Principal`/`Authentication` no contexto de segurança da sessão STOMP. Sem token válido, a conexão é rejeitada ali.
- Envio via STOMP + fila por usuário (`/user/queue/chat`).
- Reaproveitar `PresenceService`/`lastActive` para status "online".

**Endpoints REST (histórico/estado)**
- `GET  /api/chat/{peerId}/messages` — histórico paginado.
- `POST /api/chat/{peerId}/read` — marcar como lido.
- `GET  /api/chat/unread-count` — contador de não-lidas.

**App mobile**
- Tela de conversa personal↔aluno.

---

### Fase 3+ — Dashboards do Personal e telas de EMPRESA (depois)
> Reaproveita os services que já existem (`StatsService`, `WorkoutSessionService`, `WeightHistory`, `UserLoginStreak`). Aqui entra o **painel desktop web** de fato.

**Endpoints do personal (por aluno, com guard de posse)**
- `GET /api/trainer/students/{id}/stats` — volume, tempo de treino, evolução de peso vs. `goal`.
- `GET /api/trainer/students/{id}/sessions` — histórico de treinos e cargas (`ExerciseSetLog`).
- `POST/PUT /api/trainer/students/{id}/plans` — **CRUD manual de ficha** (hoje só a IA cria — peça realmente nova de lógica).
- `GET /api/trainer/alerts` — alunos inativos há X dias (via `lastActive`/`UserLoginStreak`).

**Frontend desktop (`kinetic-desktop`, React web)**
- Login (mesmo `/api/auth`, filtrando papel PERSONAL) → lista de alunos → detalhe do aluno (dashboards) → editor de ficha → chat.
- Compartilha tipos, cliente de API e tema (`COLORS`, `ThemeContext`) com o `KineticApp`.

**Features de valor (incrementais)**
- Revisão de **anamnese** (`medicalConditions`) antes de montar treino.
- Progressão de carga por exercício ao longo do tempo.
- Alertas proativos (aluno sumido, meta de peso desviando).

**EMPRESA (adiado)**
- ROOT cadastra empresa; empresa cadastra personais e linka alunos (`source = COMPANY`). Modelo já existe desde a Fase 0; só faltam endpoints e telas.

---

## 🧭 Diretrizes de Execução
- Backend-first, **foco no PERSONAL**. Empresa fica por último.
- Trabalhar em branch a partir de `refatoracaoTreino`; rodar `mvn` (build) a cada fase para garantir que nada regrediu.
- Manter camadas estritas (`controllers/`, `services/`, `repositories/`, `models/`, `dtos/`) e blindar entidades com DTOs.
- Rodar `graphify update .` após as mudanças para manter o knowledge graph atualizado.

## 📎 Estado atual do código (âncoras)
- `AuthService.register()` não seta papel → adicionar `role`.
- `JwtUtil.generateToken()` vai com claims vazias e sem authorities → habilitar authorities é pré-requisito do `@PreAuthorize`.
- `SecurityConfig` usa `anyRequest().authenticated()`.
- Backend hoje **não tem WebSocket**; presença é via interceptor/`lastActive`.
