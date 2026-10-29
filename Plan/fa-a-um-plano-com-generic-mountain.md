# Auditoria do painel ROOT

## Contexto

A rota `/root/auditoria` é só um "Em breve" (`kinetic-desktop/src/App.tsx:100`, `config/nav.ts:54`). Hoje nenhuma ação de ROOT, DONO ou EMPRESA deixa registro de quem fez e por quê. Falhas de login e 2FA também não são registradas. Leituras de dados de saúde não são registradas, embora o plano de escala as exija (LGPD art. 11). O que já existe está espalhado: `access_logs`, `deleted_accounts` e `ai_plan_generations`. O objetivo é uma trilha de auditoria só de inserção no backend e uma seção Auditoria com submenu no painel, sem duplicar o que esses três registros já guardam.

Decisões do usuário:
- O motivo é **obrigatório** nas ações destrutivas do ROOT.
- O prazo de guarda é **por categoria**: segurança 6 meses; as demais 5 anos.
- Pedidos de titulares **entram no painel**, com controle de prazo.
- Leitura de dado de saúde gera **1 registro por hora** por personal + aluno + tipo de dado.

Regras do repositório que valem aqui:
- RLS e REVOKE em toda tabela nova, inclusive na sequence ([[rls-on-new-tables]]).
- `@SchedulerLock` em job agendado, e nada de estado em memória.
- As páginas de gestão continuam com `useState`/`useEffect` (decisão R11).
- Os containers locais usam o Supabase real. **Não reiniciar o Docker:** os testes rodam em Testcontainers.

---

## 1. Banco: `V54__audit_trail.sql`

**Tabela `audit_events`**
- Colunas:
  - `id BIGSERIAL PK`
  - `occurred_at TIMESTAMPTZ DEFAULT clock_timestamp()`
  - `category VARCHAR(16)`, com CHECK em ADMIN, SECURITY, HEALTH, BILLING, LGPD
  - `action VARCHAR(40) NOT NULL`
  - `actor_id UUID` e `actor_role VARCHAR(16)`. Nulos quando o autor é o sistema, o webhook ou alguém anônimo.
  - `target_type VARCHAR(24)` e `target_id UUID`
  - `company_id UUID`
  - `ip VARCHAR(45)`
  - `reason VARCHAR(500)`
  - `details JSONB`
  - `retain_until DATE NOT NULL`
- **Sem FK para `users`.** A exclusão de conta roda `DELETE FROM users` e a trilha precisa sobreviver a ela. O `actor_id` continua ligado a `deleted_accounts.user_id`, que já fica 5 anos. Não se grava nome nem e-mail: os nomes são resolvidos na leitura.
- Índices:
  - `(category, occurred_at DESC)`
  - `(actor_id, occurred_at)`
  - `(target_id, occurred_at)`
  - `(retain_until)`
  - um índice parcial para a deduplicação por hora: `(actor_id, target_id, action, occurred_at) WHERE category = 'HEALTH'`

**Imutabilidade**, no padrão de `fn_protect_approved_ai_generation` da V25:
- A função `fn_protect_audit_events()` é disparada por um `BEFORE UPDATE OR DELETE` e:
  - recusa todo UPDATE;
  - recusa DELETE com `OLD.retain_until >= current_date`. Assim só a limpeza diária consegue apagar.
- `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated`.

**Tabela `data_subject_requests`**
- Colunas:
  - `id UUID PK DEFAULT gen_random_uuid()`
  - `kind`, com CHECK em ACESSO, CORRECAO, ELIMINACAO, REVOGACAO, INFORMACAO
  - `received_at DATE`
  - `due_at DATE`, igual a recebimento + 15 dias (art. 19, II)
  - `status`, com CHECK em ABERTO ou CONCLUIDO
  - `completed_at DATE`
  - `user_id UUID`, com FK `ON DELETE SET NULL`
  - `note VARCHAR(500)`
  - `created_by UUID`
  - `retain_until DATE`
- Criação e mudança de status também geram evento LGPD.

**Fechamento:** nas duas tabelas, `ENABLE ROW LEVEL SECURITY` e `REVOKE ALL ... FROM anon, authenticated`, mais `REVOKE ALL ON SEQUENCE audit_events_id_seq ...`. Sem `FORCE`.

O acesso é só por `JdbcTemplate`, no padrão do `LegalRetentionService`. Não há entidade JPA, então o `ddl-auto=validate` não é afetado.

## 2. Backend

### Gravação: um único ponto
- **`enums/AuditAction.java`** — cada ação define a categoria, o tipo de alvo e se deduplica por hora, para quem chama não repetir regra. `AuditCategory` define o prazo: SECURITY 6 meses, as demais 60 meses.
  - **ADMIN:**
    - COMPANY_CREATED, PERSONAL_CREATED
    - USER_STATUS_CHANGED, USER_SOFT_DELETED, USER_DELETED_BY_ADMIN
    - PASSWORD_REGENERATED, SECOND_FACTOR_RESET
    - UNIT_CREATED, UNIT_UPDATED, UNIT_STATUS_CHANGED
    - TRAINER_INVITED_TO_COMPANY, TRAINER_REMOVED_FROM_COMPANY, COMPANY_INVITE_ACCEPTED, COMPANY_INVITE_DECLINED, TRAINER_LEFT_COMPANY
    - STUDENT_LINKED_BY_COMPANY, COMPANY_LINK_ENDED
    - ACCESS_LOGS_VIEWED
  - **SECURITY:**
    - LOGIN_FAILED, LOGIN_RATE_LIMITED
    - TOTP_ENABLED, TOTP_FAILED, RECOVERY_CODE_USED
    - PASSWORD_CHANGED, PASSWORD_RESET_COMPLETED, PASSWORD_RESET_FAILED
    - EMAIL_CONFIRMED
  - **HEALTH:**
    - HEALTH_DATA_VIEWED, deduplicado por hora. Em `details.kind`: ASSESSMENTS, PROTOCOL ou AI_CONTEXT.
    - ASSESSMENT_CREATED, ASSESSMENT_UPDATED, ASSESSMENT_DELETED. O `details` traz o autor original, o que cobre a pendência 13.
    - PROTOCOL_UPDATED
  - **BILLING:** SUBSCRIPTION_STATUS_CHANGED (`details` com from, to, plan e a origem: WEBHOOK, TRAINER ou DEMO), AI_PACK_CREDITED.
  - **LGPD:** RETENTION_PURGED (contagens por tabela), DATA_REQUEST_OPENED, DATA_REQUEST_COMPLETED.
- **`services/AuditService.java`** tem um único método público: `record(AuditAction, UUID targetId, UUID companyId, String reason, Map<String,Object> details)`.
  - O autor sai do `SecurityContextHolder`: o principal é o e-mail, buscado com `userRepository.getByEmailOrThrow`. Sem login, o autor fica nulo.
  - O IP sai do `RequestContextHolder` (`getRemoteAddr`, que já respeita `forward-headers-strategy=native`). Assim o `ip` não precisa atravessar as assinaturas.
  - O `details` é serializado com o `ObjectMapper` como `?::jsonb`.
  - Nas ações deduplicadas, usa `INSERT ... WHERE NOT EXISTS` na última hora, como o `recordAccessHourly`.
  - Grava na transação de quem chama: se a ação falha, o registro some junto, e vice-versa. Nos fluxos com `noRollbackFor`, o registro de falha também persiste.
- **Login com e-mail inexistente:** `target_id` fica nulo e o `details` leva `emailHash`, via `Pseudonymizer`. Nunca o e-mail em claro, senha, código ou token.
- **O que não vira evento**, porque já tem registro próprio:
  - login com sucesso e refresh (`access_logs`);
  - exclusão pelo próprio titular (`deleted_accounts`);
  - aprovação de ficha por IA (`ai_plan_generations`, imutável).
- **Pontos de chamada.** A chamada vai no método compartilhado, nunca nos dois chamadores:
  - `AccessService.regenerate(user, …, reason)` e `TotpService.reset(user, reason)` servem ROOT e DONO. O motivo é obrigatório só para o ROOT.
  - `CompanyService`: createCompany, createPersonal, setUserStatus (guarda o status anterior em `details`), softDeleteUser.
  - `AccountDeletionService.deleteAccountByAdmin(id, reason)`.
  - `DonoService`: createUnit, updateUnit, setUnitActive.
  - `EmpresaService`: vincularFuncionario, desvincularFuncionario, vincularAluno, desvincularAluno, accept, decline, leaveCompanyByTrainer.
  - `AuthService.login`: captura `AuthenticationException` em volta do `authenticate` e o `TooManyAttemptsException`, registra e relança.
  - `TotpService.verify` e `recover`, `UserService.changePassword`, `PasswordResetService.resetPassword`, `EmailVerificationService.confirm`.
  - Leituras de saúde: `PhysicalAssessmentService` (list, create, update, delete), `StudentProtocolService` (getForTrainer, updateByTrainer) e `TrainerAiPlanService.getContext`, que lê `medicalConditions`.
  - `BillingService`: as transições em `handleEvent`, `subscribe`, `cancel` e nas confirmações de demo; `creditAiPack`.
- **`LegalRetentionService.purgeExpired`** passa a:
  - apagar de `audit_events` e de `data_subject_requests` as linhas com `retain_until < current_date`;
  - registrar RETENTION_PURGED com as contagens que hoje só vão para o log. O `@SchedulerLock` existente é mantido.

### Leitura: `controllers/AuditController.java`
- Fica em `/api/root/audit`, com `@PreAuthorize("hasRole('ROOT')")`. A consulta fica em `services/AuditQueryService.java` e os DTOs em `dtos/AuditDTOs.java` (records aninhados, como `UnitDTOs`).
- **`GET /events`** — filtros `category`, `action`, `actorId`, `targetId`, `companyId`, `from`, `to`, `page`, `size` (máximo 50, como `SocialController.pageOf`). Retorna `Page<Event>`.
  - Nomes resolvidos com LEFT JOIN em `users` e `companies`.
  - Conta que não existe mais vem com `deleted: true`, sem nome.
  - O IP só aparece na categoria SECURITY.
- **`POST /access-logs/search`** — corpo `{email, from, to, reason}`. O motivo é obrigatório e o e-mail vai no corpo, nunca na URL.
  - O e-mail é resolvido em `users`, ou em `deleted_accounts` pelo `email_hash`, para atender ordem judicial sobre conta excluída.
  - Grava ACCESS_LOGS_VIEWED e devolve as linhas de `access_logs`.
  - Nova regra no `ApiRateLimitFilter`: `auditoria-acessos`, POST, 10/min.
- **`GET /lgpd`** — resumo:
  - exclusões no período por `deleted_by` e `blocked`;
  - lista paginada de `deleted_accounts` com papel, quem excluiu, bloqueio e datas. **Sem colunas pessoais.**
  - termos: usuários na versão vigente × pendentes, ROOT fora da conta;
  - última limpeza;
  - pedidos abertos e vencendo.
- **`GET`, `POST /requests`** e **`PATCH /requests/{id}`** — pedidos de titulares.
- **`GET /ai`** — fichas aprovadas: personal, CREF, modelo, data de aprovação, `replaced_current`, e o aluno ou "[aluno excluído]"; também o total de prévias × aprovadas no período. **Nunca** devolve `prompt`, `options` nem `ai_output`, porque contêm condições médicas.
- **`GET /billing-gateway`** — o gateway ativo, para a tela alertar se for DEMO em produção (pendência 3).

### Motivo obrigatório (muda o contrato)
- Novo `dtos/ReasonDTO` (`@NotBlank @Size(min=10, max=500)`). O motivo também entra em `UpdateUserStatusRequestDTO`.
- No `RootController`, os endpoints `PATCH /users/{id}/status`, `POST /users/{id}/nova-senha`, `POST /users/{id}/reset-2fa`, `DELETE /users/{id}` e `DELETE /users/{id}/permanent` passam a receber `@Valid @RequestBody`.
- Na conferência final, procurar no código algum chamador desses endpoints além do painel.

### Ajustes obrigatórios (pedidos na aprovação)
1. **Falhas de segurança sempre persistem.** As ações LOGIN_FAILED, LOGIN_RATE_LIMITED, TOTP_FAILED e PASSWORD_RESET_FAILED têm a flag `survivesRollback` no `AuditAction`. Para elas, o `AuditService.record` grava num `TransactionTemplate` com `PROPAGATION_REQUIRES_NEW`, o mesmo padrão do `TrainerEventService`. Continua havendo um único método público: a flag decide como gravar, e quem chama não precisa saber.
2. **Deduplicação de saúde por tipo de dado:**
   - O `WHERE NOT EXISTS` compara `actor_id`, `target_id`, `action` **e** `details->>'kind' = ?`.
   - A janela de tempo é `occurred_at >= clock_timestamp() - interval '1 hour'`, calculada no SQL.
   - O índice parcial de HEALTH passa a incluir `(details->>'kind')`.
3. **Alvo de LOGIN_FAILED.** O `AuthService.login` busca o usuário pelo e-mail informado:
   - se existe, `targetId = user.getId()` e `companyId = user.getCompanyId()`;
   - se não existe, `targetId = null` e `details = {emailHash: pseudonymizer.hash(email)}`.
4. **Fuso no expurgo.** Tanto a trigger (`OLD.retain_until >= CURRENT_DATE`) quanto os DELETEs do `purgeExpired` (`retain_until < CURRENT_DATE`) usam o `CURRENT_DATE` do Postgres direto no SQL. Nunca entra `LocalDate.now()` como parâmetro. O `retain_until` também é calculado no SQL do INSERT (`CURRENT_DATE + make_interval(months => ?)`).
5. **Corpo no DELETE:**
   - conferir que nenhum filtro (rate limit, JWT, ContentCaching) descarta o corpo de DELETE;
   - no `rootService.ts`, enviar `api.delete(url, { data: { reason } })`;
   - nos testes com MockMvc (inclusive `AccountDeletionIT`), usar `.contentType(MediaType.APPLICATION_JSON).content(...)`.
6. **Titular excluído:**
   - a listagem de `data_subject_requests` trata `user_id` nulo, e a `AuditLgpdPage` mostra "[titular excluído]";
   - DATA_REQUEST_OPENED e DATA_REQUEST_COMPLETED gravam o `user_id` original como `target_id` em `audit_events`, que não tem FK e por isso mantém o id;
   - teste em `AuditIT`: concluir uma ELIMINACAO, excluir a conta e listar sem erro.
7. **Teste de deduplicação em `AuditIT`:** ler ASSESSMENTS e depois PROTOCOL do mesmo aluno, na mesma hora, gera 2 registros. Ler ASSESSMENTS duas vezes gera 1.

## 3. Painel (`kinetic-desktop`)

### Menu com submenu
- **`config/nav.ts`:** `NavItem` ganha `children?: NavItem[]`. Auditoria perde o `comingSoon` e ganha os filhos, com ícones lucide:
  - Ações administrativas → `/root/auditoria/acoes`
  - Segurança → `/seguranca`
  - Registros de acesso → `/acessos`
  - Dados de saúde → `/saude`
  - Fichas por IA → `/ia`
  - Cobrança → `/cobranca`
  - LGPD → `/lgpd`
- **`layouts/AppShell.tsx` → `SidebarContent`:**
  - Item com filhos vira um botão de abrir e fechar, no padrão de `WorkoutPlansTab.tsx:408` (`aria-expanded`, `aria-controls`, `ChevronDown` com `rotate-180`).
  - Começa aberto quando o `pathname` está dentro do grupo.
  - Os filhos ficam recuados, com uma linha guia `border-l border-white/[0.08]`, altura `h-9` e `text-[13px]`, e o mesmo estado ativo dos itens de cima.
  - Como a gaveta do celular reutiliza o `SidebarContent`, o submenu aparece lá sem código extra.
  - A barra inferior passa a filtrar `!i.comingSoon && !i.children`.
- **`App.tsx`:** a rota `auditoria` ganha filhos. O índice vira `<Navigate to="acoes" replace />`, e as páginas são lazy. O `ComingSoonPage` continua só para Faturamento; o comentário dele é atualizado.

### Páginas: `pages/root/audit/`
- **`AuditEventsPage.tsx`** — **um só componente** para Ações, Segurança, Saúde e Cobrança. A prop `category` puxa um `CATEGORY_CONFIG`, com título, subtítulo, filtros de ação e colunas (IP só em Segurança). É o mesmo esqueleto do `CompliancePage`:
  - `PageHeader wideActions` com `Select` de ação e `DateRangeFilter`;
  - skeleton, depois `EmptyCard`, depois `MobileList` no celular e tabela a partir do md, com `max-md:hidden` nas colunas secundárias.
  - Em Cobrança, um aviso no topo quando o gateway é DEMO.
- **`AuditAccessLogsPage.tsx`** — formulário com e-mail, período e motivo, e um aviso de sigilo (Marco Civil art. 15). O resultado aparece em tabela.
- **`AuditLgpdPage.tsx`** — `StatGrid` (exclusões, bloqueios, termos pendentes, pedidos vencendo), lista de contas excluídas, última limpeza e pedidos. "Novo pedido" usa o `FormDialog`, e "Concluir" usa o `ConfirmDialog`.
- **`AuditAiPage.tsx`** — `StatGrid` com prévias × aprovadas e a tabela de aprovações.
- **`auditLabels.ts`** — `Record<AuditAction, string>` com os rótulos em pt-BR. O TypeScript obriga a cobrir todas as ações. O mesmo arquivo serve as páginas e a Home.
- **`AuditEventItem.tsx`** — a linha de evento: autor → ação → alvo, motivo, data e hora. É usada na lista e no card da Home.

### Componentes e serviços (reaproveitar antes de criar)
- **`components/personal/ConfirmDialog.tsx`** — ganha uma prop opcional `reason` (`{value, onChange}`), que mostra um textarea e bloqueia o confirmar com menos de 10 caracteres. As ações do `CompliancePage` (status, excluir) e do `CompaniesPage` (nova senha, 2FA) passam a confirmar com motivo. Hoje três dessas ações rodam sem confirmação nenhuma.
- **`components/DateRangeFilter.tsx`** — novo. São dois `input type="date"` com `formInputClass`, no padrão do `FinancePage`.
- **`components/Pager.tsx`** — novo, com Anterior/Próxima sobre `Page<T>`.
- **`utils/dates.ts`** — novo helper `dateTimeLabel`, com dd/mm/aaaa hh:mm via Intl.
- **`services/auditService.ts`** — usa o mesmo axios `api`. Os tipos ficam em `types/index.ts`. O `rootService.ts` passa a enviar `reason` (no DELETE, via `data`).
- **`RootHomePage.tsx`** — o `ComingSoonCard` "Auditoria recente" vira um `SectionCard` com os 5 últimos eventos ADMIN e o link "Ver tudo".
- Erros passam por `errorMessage` de `utils/errors`, com `toast` do sonner.
- O visual usa só os tokens `k-*` e os componentes já reestilizados. O app não tem tema claro.

## 4. Documentos
- **`RETENCAO-DE-DADOS.md`** — novas linhas para `audit_events` (6 meses ou 5 anos, com base legal) e `data_subject_requests`. A tabela de direitos do titular passa a citar o controle no painel.
- **`kinetic-desktop/src/legal/documents.ts`** — a Política ganha a menção à trilha de auditoria. Trocar `LEGAL_VERSION`/`LEGAL_UPDATED_AT` e `legal.terms-version` em `application.properties`. Ainda não há usuários reais, então o novo aceite não pesa.
- **`RootMetricsDTO`** e **`ComingSoonPage`** — comentários que falam em "auditoria placeholder" são atualizados.

## 5. Testes
**Backend** (`mvn verify`, Testcontainers `postgres:17-alpine`, base `IntegrationTestBase` + `TestData`):
- **`SchemaIT`** já reprova tabela sem RLS. Novos casos:
  - `anon` sem privilégio nas duas tabelas e na sequence (`has_table_privilege`, `has_sequence_privilege`);
  - UPDATE em `audit_events` falha;
  - DELETE de linha dentro do prazo falha;
  - DELETE de linha vencida passa.
- **`it/AuditIT.java`:**
  - cada ação do ROOT grava o evento com autor, motivo e status anterior→novo;
  - sem motivo → 400;
  - DONO redefinindo o 2FA grava o evento sem motivo;
  - vínculo pela empresa grava o evento;
  - login com senha errada grava LOGIN_FAILED **sem** e-mail em claro;
  - duas leituras de avaliação na mesma hora → um registro;
  - a busca em `access_logs` sem motivo → 400, com motivo grava ACCESS_LOGS_VIEWED;
  - busca por e-mail de conta excluída acha pelo hash;
  - `/ai` não devolve `prompt` nem `ai_output`;
  - evento de conta excluída volta com `deleted: true` e sem nome;
  - `purgeExpired` apaga eventos vencidos e grava RETENTION_PURGED;
  - ciclo de vida do pedido de titular.
- **`ControllerSecurityTest`** — ALUNO, PERSONAL, EMPRESA e DONO recebem 403 em `/api/root/audit/**`.
- **Unitário `AuditActionTest`** — toda ação tem categoria e o prazo certo.
- **Regressão** — ajustar os testes existentes que chamam os endpoints que agora exigem motivo (`AccountDeletionIT` e outros). A suíte inteira tem que passar.

**Painel:**
- `npm run build`, que roda `tsc` strict com `noUnusedLocals`/`noUnusedParameters` e pega código morto.
- `node --test` para o helper que decide se o grupo do menu abre (`isGroupOpen`), ao lado do `muscleVolume.test.ts`.

## 6. Verificação de ponta a ponta
1. Rodar `mvn verify` no `kinetic-backend`, sem tocar no Docker local.
2. Rodar `npm run build` e os testes `node --test` no `kinetic-desktop`.
3. Subir um mock Node da API na porta 8099, criado no scratchpad e fora do repositório, com `VITE_API_URL=http://localhost:8099 npx vite`. Em seguida, no navegador embutido:
   - abrir e fechar o submenu;
   - navegar pelas 7 subpáginas, com filtros, paginação e os estados vazio e de erro;
   - confirmar uma ação com motivo no Compliance;
   - conferir o card da Home;
   - repetir no viewport mobile (gaveta, listas em cartão).
4. Conferência final:
   - `/code-review` e a skill `security-audit` focada no diff, para checar RLS, autorização, vazamento de PII/saúde em DTOs e logs, e limite de tamanho da página;
   - grep por exports sem uso e por chamadores dos endpoints que mudaram;
   - `graphify update .`.
5. Não fazer commit nem reiniciar o Docker sem pedido. Na próxima subida dos containers, a V54 é aplicada no Supabase real.
