# Auditoria de segurança — KinectApp

## Rodada 2 (2026-10-26): pendências de segurança

- **Fonte auditada:** commit `2204363` (`implementacaoWeb`), considerando também as alterações ainda não commitadas de 2026-10-26.
- **Método:** skill `security-audit`, perfil *quick*: **uma única onda**, como você pediu, seguida de um crítico de cobertura final. Não houve segunda onda.
- **Agentes:** 40 no total.
  - 4 de reconhecimento.
  - 14 caçadores.
  - 1 crítico.
  - 21 verificadores independentes, um por candidato.
- **Artefatos:** ficam em `~/Downloads/security-audit-skill/KinectApp/run-2/`.
  - `REPORT.md`
  - `NEEDS-VALIDATION.md`, com trace, evidência e plano de teste de cada item
  - `findings.json`
  - `coverage-ledger.json`
- **Nenhum achado "confirmado" nesta rodada.** Não foi possível rodar o backend num ambiente isolado. O Flyway começa na baseline V6 e assume que já existem tabelas criadas antes dele; num banco novo, a V3 falha com `relation "users" does not exist`, e o repositório não tem dump de schema. Por isso os 21 itens abaixo estão como **validação pendente, sem severidade**. Cada um teve o caminho no código conferido por um agente independente, mas falta executar o teste local ou o dono checar um fato de produção.
- **Situação dos itens da rodada 1:**
  - **Já resolvidos no código:**
    - reset de senha sem prova de identidade;
    - vínculo empresa→aluno sem consentimento;
    - STOMP, que foi removido;
    - curtidas e comentários sem checar visibilidade;
    - page size do feed;
    - re-assinatura e delete de mídia por chave alheia;
    - chamada ao Gemini sem cota e dentro de transação;
    - reatribuição de personal entre empresas.
  - **Ainda abertos:** seeder de ROOT, `flyway_schema_history`, bucket social-media e ranking da Arena. Estão nos itens 7, 11, 10 e 21 da tabela abaixo.

### Pendências, em ordem de prioridade

| # | Pendência | O que decide |
|---|---|---|
| 1 | Código de 6 dígitos (reset/confirmação) com tentativas zeradas a cada reenvio: adivinhação sem limite por conta, até tomar a conta (inclusive ROOT) | Regra de rate limit/bot no Cloudflare para /api/auth/* |
| 2 | Empresa autocadastrada isenta qualquer personal dos limites do plano e da cota mensal de IA | Se empresas autocadastradas devem ser tratadas como clientes pagantes |
| 3 | Cobrança cai no gateway demo por padrão: qualquer personal autoconfirma plano e pacotes de IA | Valor de BILLING_GATEWAY no .env de produção |
| 4 | Empresa vincula qualquer personal sem empresa só pelo e-mail; o personal não consegue sair | Nenhum (caminho completo no código; falta só o teste local) |
| 5 | Cota de IA do personal conta só sucessos salvos: falhas e chamadas simultâneas não são contadas (gasto Gemini) | Teto de gasto/requisições na chave do Google AI |
| 6 | Exportação de dados do personal continua trazendo avaliações e gerações de IA de ex-alunos e de alunos excluídos | Decisão jurídica: isso é dado do personal ou do aluno? |
| 7 | Seeder de ROOT promove conta autocadastrada e mantém a senha de quem a criou | Origem da linha ROOT em produção (criada pelo seeder ou promovida) |
| 8 | Access token emitido antes do reset/troca de senha continua válido até expirar | Valor de JWT_EXPIRATION_MS em produção |
| 9 | Cancelar e reassinar PRO dá limites PRO no período pago como BASE | Nenhum (caminho completo; falta teste local) |
| 10 | Privacidade das fotos sociais depende do bucket social-media estar privado (nada no código garante) | storage.buckets.public do bucket em produção |
| 11 | flyway_schema_history ficou fora do bloqueio da Data API (sem RLS, grants de anon mantidos) | Grants/RLS da tabela no Supabase de produção |
| 12 | App: código de convite pendente é global no aparelho e é resgatado pela próxima conta que entrar | Modelo de uso do aparelho (compartilhado ou não) |
| 13 | Personal atual edita/apaga avaliação de personal anterior e o registro continua no nome do anterior | Política: personal atual pode corrigir histórico de outro? |
| 14 | Cadastro não confirmado reserva para sempre o celular/CPF de outra pessoa | Se há rotina de limpeza de contas não confirmadas |
| 15 | Convite por e-mail revela se o e-mail é de aluno e se ele já tem personal | Política: vínculo aluno-personal é confidencial? |
| 16 | Estorno/chargeback no Asaas não revoga período pago nem créditos de IA | Eventos de estorno habilitados no webhook Asaas |
| 17 | Uploads nunca usados ficam para sempre (limpeza de órfãos em dry-run por padrão) | Valor de MEDIA_CLEANUP_DRY_RUN em produção |
| 18 | Sem limite de conexões SSE abertas por personal em /api/trainer/events | Limites de conexões do Cloudflare Tunnel |
| 19 | POST /api/sessions/log aceita lista de séries sem tamanho máximo | Limite de corpo da requisição no Cloudflare |
| 20 | Rate limiter grava no Postgres a cada requisição, inclusive anônimas e já bloqueadas | Regras de rate limit do Cloudflare |
| 21 | Ranking da Arena inflável: sessões ilimitadas por dia (6 h cada) | Nenhum (integridade do ranking) |

### Lacuna de cobertura (não revisada por causa da regra de uma onda)

- **Ciclo de vida do vínculo com a empresa.** O problema aparece quando a empresa remove um personal ou quando a conta EMPRESA é excluída ou bloqueada:
  - os vínculos de alunos de origem `COMPANY` continuam `ATIVO`;
  - o personal removido mantém acesso aos dados de saúde desses alunos;
  - o próprio personal não consegue encerrar esses vínculos;
  - o `company_id` dos membros nunca é limpo, porque nenhum código apaga a linha da empresa, e com isso a isenção de cobrança continua.
  
  O crítico final encontrou essa lacuna. Ela fica registrada como pendência para uma próxima rodada.

### Próximo passo: banco de teste para confirmar as pendências

As 21 pendências ficaram sem confirmação porque o backend não sobe num banco vazio. O Flyway parte da baseline V6, que assume tabelas criadas antes dele (pelo Hibernate, no início do projeto). Por isso, num Postgres novo, a V3 falha com `relation "users" does not exist`. Para destravar, o banco de teste precisa já ter essas tabelas. Assim o Flyway faz o baseline na V6 e aplica da V7 em diante, como aconteceu em produção.

**Caminho A: dump só da estrutura de produção (recomendado, mais fiel).** O dump traz apenas o schema, nenhum dado de usuário. Ele copia índices, `CHECK`s e grants exatamente como estão em produção. A senha e o host são os mesmos do ensaio de migração em `kinetic-backend/scripts/migracao-supabase/README.md`:

```powershell
# Na pasta onde quer salvar o arquivo, com o Docker Desktop aberto
docker run --rm -e PGPASSWORD="SENHA_DO_BANCO" -v "${PWD}:/dump" postgres:17 `
  pg_dump -h <host-do-session-pooler> -p 5432 -U postgres.<ref-do-projeto> -d postgres `
  --schema=public --schema-only --no-owner --no-privileges -f /dump/kinetic-schema.sql
```

- Confira que o arquivo não tem `COPY` nem `INSERT`, ou seja, nenhum dado.
- Depois, entregue o `kinetic-schema.sql` ao Claude e peça: "monte o banco de teste com este dump e reexecute a verificação das 21 pendências da run-2".

**Caminho B: montar localmente a partir do código (não toca em produção, menos fiel).**

1. Em um Postgres descartável, subir o backend uma vez com `SPRING_FLYWAY_ENABLED=false` e `SPRING_JPA_HIBERNATE_DDL_AUTO=create`, para o Hibernate criar as tabelas das entidades.
2. Aplicar à mão os objetos que só existem nas migrations, por exemplo:
   - `rate_limit_counters` e `trainer_events` (V48);
   - as tabelas de retenção (V49);
   - a tabela do ShedLock;
   - índices únicos e `CHECK`s (V30, V36, V47).
3. Marcar o Flyway como já aplicado até a V49 (`baseline-version=49`).

Restrições que só existem nas migrations podem ficar diferentes de produção, então este caminho exige tentativa e erro até o backend subir.

**Depois do banco de teste (qualquer caminho):**

1. Subir `postgres:17-alpine` e o backend numa rede Docker `--internal`, sem acesso externo e sem montar pastas do host. Usar variáveis fictícias: `DEV_LOG_EMAIL_CONTENT=true`, para ler os códigos de e-mail no log; `BILLING_GATEWAY=demo`; Supabase e Gemini apontando para endereços mortos.
2. A imagem `kinetic-backend:latest` precisa ser reconstruída se o código mudar depois de 2026-10-26.
3. Reexecutar um verificador por pendência (cerca de 21) com teste reproduzível pela API e contas fictícias. As que se confirmarem ganham severidade. Os scripts da run-2 não ficaram salvos, então a skill os recria.

### Checagens rápidas em produção (só leitura, fazem várias pendências avançar)

1. `BILLING_GATEWAY` está como `asaas` no `.env`? Vale também procurar assinaturas com `gateway='DEMO'`. (item 3)
2. Qual o valor de `JWT_EXPIRATION_MS`? (item 8)
3. Qual o valor de `MEDIA_CLEANUP_DRY_RUN`? (item 17)
4. `SELECT id, public FROM storage.buckets WHERE id='social-media'` retorna `public = false`? (item 10)
5. Quais são o RLS e os grants de `anon`/`authenticated` em `public.flyway_schema_history`? (item 11)
6. Rode `SELECT nome, role, created_at FROM users WHERE email='<ROOT_USER_EMAIL>'` e confira se a linha foi criada pelo seeder. (item 7)
7. No Cloudflare, quais são as regras de rate limit/bot em `/api/auth/*`, o limite de tamanho do corpo e o limite de conexões longas? (itens 1, 18, 19 e 20)
8. A chave do Google AI tem teto de gasto ou de requisições? (itens 2, 3 e 5)
9. Quais eventos de estorno e chargeback estão habilitados no webhook do Asaas? (item 16)

O hardening apontado (que não são achados) e os pontos positivos verificados estão na seção 6 do `REPORT.md` da run-2.

---

## Rodada 1 (2026-10-14), mantida como histórico

- **Commit auditado:** `b7447a3` (branch `implementacaoWeb`). O código da aplicação no HEAD atual (`2c0e374`) é idêntico; só mudaram `graphify-out/` e este arquivo.
- **Datas:** sessão 1 e sessão 2 em 2026-10-14.
- **Método:** skill `security-audit`, perfil *standard*, com o grafo do graphify como mapa do código.
- **Artefatos completos:** `~/Downloads/security-audit-skill/KinectApp/run-1/`
  - `REPORT.md`, `FINDINGS-DETAIL.md` e `NEEDS-VALIDATION.md`: relatórios em inglês, gerados a partir dos registros finais;
  - `findings.json`: os 16 registros finais;
  - `coverage-ledger.json`: 35 unidades de cobertura;
  - `agents/`: prompts e resultados de cada agente.

## Status: validação concluída, cobertura ainda parcial

**Sessão 1 (já existia):**
- reconhecimento com 4 agentes;
- uma onda de caça com 13 caçadores, que gerou 16 candidatos.

**Sessão 2 (esta continuação):**
- **Crítico de cobertura pós-onda:** rodou e aceitou 9 lacunas novas de cobertura, além de pedir que 1 unidade fosse revisada de novo.
- **Fase 3 (validação independente):** os 16 candidatos passaram, cada um, por um verificador novo que não participou da caça.
- **Fases 4 e 5:**
  - `findings.json` validado;
  - cada um dos 15 registros mantidos foi conferido de novo por outro verificador independente;
  - uma correção material foi verificada por um terceiro agente.
- **Fase 6:** relatórios gerados.

**O que continua incompleto:**
- A onda 2 de caça, para as 9 lacunas apontadas pelo crítico, **não rodou**.
- O crítico final de cobertura limpa também não rodou.
- Motivo: a sessão parou com 70% da janela de uso de 5h. Uma onda nova de caça, mais a validação dela, passaria do limite de 90% pedido.
- Por isso, **não dá para afirmar cobertura completa** (lista na seção "Lacunas de cobertura").

**Limite da sessão 2:**
- Não havia sandbox, porque o Docker Desktop estava parado.
- Os verificadores revisaram só o código-fonte e usaram como evidência local as execuções que a sessão 1 já tinha gravado.
- A sessão 1 fez essas execuções em Docker `--internal`, com contas fictícias.
- Nenhum ambiente real foi contatado (Supabase, Gemini, produção).

**Uso de agentes:** 50 de 60 do orçamento. Na sessão 2, quase todos usaram o modelo Sonnet, para poupar a cota.

**Validadores:** os scripts de validação da skill não rodam no Windows, porque exigem uma proteção de leitura de arquivo que só existe em POSIX. Usei um adaptador que chama a mesma função de validação deles; `findings.json` e o ledger passaram.

---

## Correções aplicadas depois da auditoria (2026-10-15)

> **Atenção:** estas mudanças ainda **não foram commitadas nem colocadas em produção**.
> - O backend compila e os dois front-ends passam na checagem de tipos (`tsc`).
> - O fluxo **não foi testado de ponta a ponta**.
> - O envio real de e-mail depende de `RESEND_API_KEY` e de um remetente de domínio verificado na Resend (ver `kinetic-backend/.env.example`).
> - A próxima rodada da auditoria (run-2) deve **revalidar** os itens 1 e 9 sobre o código novo.

### Item 1 (reset de senha sem prova de identidade): corrigido no código

**Fluxo novo:**
1. `POST /api/auth/forgot-password {email}` gera um código de 6 dígitos e envia por e-mail via Resend.
2. A resposta é sempre igual, exista a conta ou não.
3. `POST /api/auth/reset-password {email, code, newPassword}` só troca a senha se o código conferir.

**Regras do código:**
- vale 15 minutos;
- é de uso único;
- aceita no máximo 5 tentativas erradas;
- um novo pedido só é atendido depois de 60 s;
- só é gerado para contas ATIVAS;
- no banco fica só o hash BCrypt (tabela `password_reset_codes`, migration `V26`, com RLS ligado e REVOKE para `anon`/`authenticated`).

**Efeitos de uma troca bem-sucedida:**
- revoga todas as sessões da conta;
- marca o e-mail como confirmado, já que receber o código prova a posse da caixa.

**App mobile:** a `VerifyCodeScreen`, que antes era só visual e ignorava o código, agora guarda o código e o envia junto com a nova senha.

**Arquivos:**
- `services/PasswordResetService.java`
- `services/EmailService.java` (chave no header, não na URL; envio fora de transação)
- `controllers/AuthController.java`
- `dtos/ForgotPasswordDTO.java` e `dtos/ResetPasswordDTO.java` (com `code`)
- `exceptions/InvalidCodeException.java`
- `KineticApp/src/screens/Auth/{ForgotPassword,VerifyCode,ResetPassword}Screen.tsx`

### Confirmação de e-mail no cadastro (nova)

Era uma lacuna de produto e reforça os itens 9 e "e-mail como identidade".

**Cadastro:**
- `/register` e `/register-company` criam a conta com `email_verified = false` e enviam um código.
- O código vale 30 min, aceita até 5 tentativas e o reenvio tem intervalo de 60 s.
- Tabela `email_verification_codes`, migration `V27`, com RLS ligado e REVOKE.

**Endpoints:**
- `POST /api/auth/confirm-email {email, code}`
- `POST /api/auth/resend-confirmation {email}` (resposta uniforme)

**Login:**
- Uma conta não confirmada **com a senha certa** recebe 403 `{code: "EMAIL_NOT_VERIFIED"}`, e o código é reenviado.
- Com a senha errada, o erro é o normal, para não revelar quais contas existem.

**Contas:**
- As que já existiam antes da `V27` ficam como confirmadas.
- As criadas pelo ROOT ou pela empresa também nascem não confirmadas e recebem o código no primeiro login.

**Telas novas:**
- mobile: `ConfirmEmailScreen`;
- desktop: `/confirm-email`, com o e-mail passado via `state` do router e não pela URL.

### Item 9 (seeder de ROOT): mitigado no código

- O `RootUserSeeder` **não promove mais a ROOT uma conta com e-mail não confirmado**; ele só registra um aviso no log.
- O ROOT criado pelo próprio seeder nasce confirmado.
- Se alguém cadastrou o e-mail de outra pessoa, o dono real recupera a conta pelo "esqueci a senha".
- **Continua valendo:** verificar em produção o `created_at` da conta ROOT atual e se a senha configurada funciona, porque uma conta promovida antes desta mudança continua ROOT.

### Ainda em aberto, ligado a essas mudanças

- **`/api/auth/verify-email`:** não é mais usado por nenhuma tela, mas continua público e revela se um e-mail existe. Recomendado remover.
- **Contas não confirmadas abandonadas:** continuam ocupando o e-mail. Avaliar uma limpeza automática depois de X dias.
- **Rate limit:** os limites são por conta (60 s e 5 tentativas). Ainda falta um rate limit por IP/rota em `/api/auth/**`.
- **Domínio do remetente:** sem domínio verificado na Resend, o remetente `onboarding@resend.dev` só entrega para o e-mail dono da conta Resend. Não serve para usuários reais.

---

## Correções aplicadas em 2026-10-21

> Não commitadas nem em produção. Backend: 88 testes passando; `tsc` limpo no app e no desktop. Nada testado de ponta a ponta. A run-2 deve revalidar todos os itens abaixo.

| # | O que mudou |
|---|---|
| 2 | Vínculo criado pela empresa nasce `PENDENTE` (origem `COMPANY`); o aluno aceita/recusa pelo convite já existente (`/api/me/invites`) e pode encerrar com `DELETE /api/me/trainer`. Personal fora da empresa ou papel errado → 404 uniforme. Painel da empresa avisa que é um convite. |
| 3 | Não se aplica mais: o chat/WebSocket foi removido do backend. |
| 4 | `requireVisiblePost` (dono ou conexão ACCEPTED, senão 404) em curtir, descurtir, listar e criar comentário. |
| 6 | `vincularFuncionario` responde 409 se o personal já é de outra empresa; mesma empresa continua idempotente. |
| 7, 8 | Keys de mídia passam a carregar o dono (`posts/{userId}_{uuid}.ext`). `requireOwnMediaKey` (regex exata + dono) guarda o delete de mídia e o `imageUrl` de post/story → 403. Keys antigas sem dono não podem mais ser apagadas por essa rota. |
| 5 | `@Max(21600)` na duração, data entre hoje−7 e hoje+1, CHECK `NOT VALID` na migration `V47`. App limita o cronômetro a 6 h. |
| 12 | `@Valid` + `@Size` no `/workouts/generate`; até 5 tentativas por aluno por hora (429), além da cota de 30 dias. |
| 13 | Geração sem `@Transactional`; a gravação roda num `TransactionTemplate` no fim. `spring.jpa.open-in-view=false`, para a conexão não ficar presa durante a IA (vale também para a prévia do personal e o gateway de cobrança). Revisão estática: nenhum acesso a relação lazy fora de transação; testes de integração não existem, então convém um teste manual das telas antes do deploy. |
| 14 | `size` do feed limitado a 1–50. |
| 15 | `/docs.html` e `/v3/api-docs` desligados por padrão (`DOCS_ENABLED=false`). SRI não foi adicionado. |
| Lacuna 4 | Chave do Gemini vai no header `x-goog-api-key`, não mais na URL. |
| Abertos do item 1 | `/api/auth/verify-email` removido. Rate limit por IP+rota em `/api/auth/**` (10/min; refresh 60/min), em memória e por instância (desde 2026-10-25 os contadores ficam no Postgres e valem somados entre as cópias, V48). Atrás de proxy, configurar `SERVER_FORWARD_HEADERS_STRATEGY=native`, senão todos dividem o IP do proxy. |
| Hardening | `goal`/`medicalConditions` delimitados como dados no prompt do aluno e limitados em tamanho. |

**Continuam em aberto:** itens 10 e 11 (consultas no Supabase); o prompt do `TrainerAiPlanService` ainda não delimita os dados do aluno; linhas antigas com duração absurda (limpar e depois `VALIDATE CONSTRAINT`); um convite de empresa pendente pode ser aceito depois que o personal sai da empresa (`company_id` antigo).

---

## Resumo

| # | Severidade | Achado | Estado final |
|---|---|---|---|
| 1 | **Crítica** | Reset de senha sem prova de identidade (tomada de qualquer conta, inclusive ROOT) | **Confirmado** — corrigido no código em 2026-10-15 (falta commit, deploy e revalidação) |
| 2 | **Alta** | Empresa autocadastrada vincula qualquer aluno ao seu personal sem consentimento e lê dados de saúde | **Confirmado** |
| 3 | **Alta** | STOMP não autoriza SUBSCRIBE: assinatura curinga lê o chat privado de terceiros | **Confirmado** |
| 4 | **Média** | Curtidas e comentários ignoram a visibilidade por conexão (leitura e escrita, mesmo após desfazer amizade) | **Confirmado** |
| 5 | **Baixa** | Duração e data da sessão sem limite manipulam o ranking da Arena visto pelos amigos | **Confirmado** |
| 6 | — | Uma empresa "rouba" o personal de outra empresa | Validação pendente (código completo, falta execução local) |
| 7 | — | `DELETE /api/social/media` apaga qualquer objeto com a chave service-role | Validação pendente |
| 8 | — | `imageUrl` de post/story aceita chave de mídia alheia e o backend reassina | Validação pendente |
| 9 | — | O seeder de ROOT promove conta pré-existente e mantém a senha dela | Validação pendente — mitigado no código em 2026-10-15 (não promove conta sem e-mail confirmado) |
| 10 | — | Bucket `social-media` pode estar público (nada no repo força privado) | Validação pendente |
| 11 | — | `flyway_schema_history` fora do REVOKE/RLS do V21 | Validação pendente |
| 12 | — | `/api/workouts/generate` sem limite de tamanho nem de chamadas (custo do Gemini) | Validação pendente |
| 13 | — | Transação JPA aberta durante a chamada ao Gemini (risco de esgotar o pool) | Validação pendente |
| 14 | — | `size` do feed social sem limite máximo | Validação pendente |
| 15 | — | `/docs.html` carrega script de CDN sem SRI na origem da API | Validação pendente |
| — | — | Injeção de prompt pela anamnese / saída da IA sem sanitização | **Rejeitado** (virou hardening) |

**O que mudou em relação à versão anterior deste arquivo:**
- **Ranking:** passou a ser achado confirmado, de severidade **baixa**.
- **Injeção de prompt:** foi **rejeitada**. Os clientes renderizam tudo como texto escapado, e o aluno só influencia o próprio plano, que o personal revisa antes de aprovar.
- **Troca de empresa:** foi corrigida. A resposta 201 **não** vaza o `company_id` anterior; ela devolve o novo. O endpoint ainda confirma quais e-mails pertencem a contas PERSONAL.

---

## Achados confirmados

### 1. Reset de senha sem prova de identidade — Crítica

- **Onde:**
  - `AuthController.java:178` (rota de reset);
  - `SecurityConfig.java:46` (`/api/auth/**` em `permitAll`);
  - `AuthService.java:120-125`;
  - `ResetPasswordDTO.java`.
- **Problema:**
  - `POST /api/auth/reset-password` aceita `{email, newPassword}` de qualquer pessoa anônima e sobrescreve a senha.
  - Não existe fluxo de token ou OTP em nenhum lugar do backend.
- **Evidência:** a reprodução da sessão 1 (`hunt-a-auth/artifacts/check-1.txt`) mostrou:
  1. reset anônimo → 200;
  2. login com a senha antiga → 403;
  3. login com a senha escolhida pelo atacante → 200 com JWT.
- **Correção:**
  - token aleatório, de uso único, com expiração, guardado como hash e enviado por e-mail;
  - o DTO passa a ter `token` + `newPassword`;
  - **até lá, desligar o endpoint**;
  - também tornar o `verify-email` não enumerável e aplicar rate limit.

### 2. Vínculo empresa → aluno sem consentimento — Alta

- **Onde:**
  - `AuthController.java:63` (`/register-company` público);
  - `EmpresaService.java:70, 107`;
  - `TrainerLinkService.java:174-183`, que cria o vínculo ATIVO na hora.
- **Problema:**
  - O `resolveOwnedStudent` (`:145`) só checa se o vínculo está ATIVO.
  - Com isso, o personal do atacante lê a anamnese, o peso e as condições médicas do aluno (`TrainerController.java:176`).
  - O aluno **não tem endpoint** para encerrar um vínculo COMPANY.
- **Evidência (sessão 1):** antes do vínculo, 404; depois, 200 com o `weightKg` da vítima.
- **Correção:**
  - criar o vínculo como `PENDENTE` e exigir o aceite do aluno pelo fluxo de convite que já existe;
  - dar ao aluno uma forma de encerrar o vínculo;
  - reavaliar se `/register-company` deve ser público.

### 3. STOMP sem autorização de SUBSCRIBE — Alta

- **Onde:**
  - `JwtChannelInterceptor.java:36-38`, que só trata o frame CONNECT;
  - `WebSocketConfig.java:54`;
  - `ChatService.java:59-60`.
- **Problema:** uma assinatura em `/queue/**` ou `/queue/chat*` recebe as mensagens privadas de todos os usuários conectados.
- **Evidência (sessão 1):** um aluno sem vínculo (o envio pela REST deu 403) recebeu a mensagem `medical:hypertension` de outro par.
- **Correção:**
  - em SUBSCRIBE, aceitar só destinos `/user/...` sem curingas;
  - em SEND, aceitar só `/app/...`;
  - ou usar a autorização de mensagens do Spring Security;
  - checar `isEnabled()` no CONNECT.

### 4. Curtidas e comentários sem visibilidade — Média

- **Onde:** `SocialService.java:252-296`, sendo que `listComments` nem recebe o usuário.
- **Problema:** depois de a amizade ser desfeita, o ex-amigo ainda lê os comentários, curte e comenta.
- **Correção:** criar `requireVisiblePost(me, postId)` (404 se o post não for meu nem de uma conexão ACCEPTED) e usá-lo nos 4 caminhos.

### 5. Ranking manipulável — Baixa

- **Onde:**
  - `LogSessionRequestDTO`: só `@Positive` e `@NotNull`;
  - `WorkoutSessionService.java:62-79`;
  - `HomeAggregatorService.buildRanking` (`:213`).
- **Problema:** uma sessão de 2.000.000.000 s, com data qualquer, passa na validação e coloca o usuário em 1º no ranking dos amigos.
- **Correção:** `@Max(21600)` na duração, `@PastOrPresent` com janela curta de datas e um CHECK no banco.

---

## Validação pendente (sem severidade; precisam de um fato fora do código)

Detalhes e planos de verificação em `NEEDS-VALIDATION.md`.

- **6. Troca de empresa do personal.**
  - **Código:** `EmpresaService.java:64-71` sobrescreve `company_id` sem checar o valor atual. Depois disso, a empresa original recebe 404 ao tentar desvincular (`:79`).
  - **Falta:** executar o cenário com duas empresas numa sandbox.
  - **Correção:** responder 409 se o personal já for de outra empresa, ou exigir o aceite do personal.
- **7. Delete de mídia arbitrária.**
  - **Código:** `SocialController.java:67` → `StorageService.delete/normalizeKey/deleteByKey`. Não há checagem de dono nem de pasta.
  - **Falta:** confirmar que o Supabase apaga o objeto (testar com um stub local ou num projeto que não seja de produção).
- **8. Reassinatura de mídia alheia.**
  - **Código:** `SocialService.java:184, 200, 204`.
  - **Falta:** confirmar que o bucket é privado e que o endpoint `/object/sign` assina qualquer caminho.
- **9. Seeder de ROOT.**
  - **Código:** `RootUserSeeder.java:42-46`.
  - **Verificar:** compare o `created_at` da conta ROOT com a data do primeiro deploy e teste o login com `ROOT_USER_PASSWORD`.
- **10. Bucket público.**
  - **Verificar:** `SELECT id, public FROM storage.buckets;` (deve ser `false`).
  - **Correção:** codificar `public=false` numa migration ou checar no startup; corrigir `Plan/FotoSave.md` e `.env.example`.
- **11. `flyway_schema_history`.**
  - **Verificar no SQL editor:**
    - `information_schema.role_table_grants` para essa tabela;
    - `relrowsecurity`.
  - **Correção:** `REVOKE ALL ... FROM anon, authenticated` + `ENABLE ROW LEVEL SECURITY`, rodado fora do Flyway.
- **12. Custo do Gemini.**
  - **Verificar:** cotas e limite de orçamento da chave no Google Cloud.
  - **Correção:** `@Valid` + `@Size` no DTO e cota ou cooldown por usuário.
- **13. Transação durante a IA.**
  - **Verificar:** pool Hikari explícito desde 2026-10-26 (5 por cópia, 2 cópias). Conferir o Pool Size do pooler no Supabase.
  - **Correção:** chamar a IA fora do `@Transactional`, como o `TrainerAiPlanService.generatePreview` já faz.
- **14. Feed sem limite de página.**
  - **Verificar:** limites de heap e de proxy em produção.
  - **Correção:** `Math.min(size, 50)`, como o `ChatService.getConversation` já faz.
- **15. `docs.html` sem SRI.**
  - **Verificar:** se `/docs.html` é servido em produção no mesmo host de `/api/auth`.
  - **Correção:** hospedar o script localmente, adicionar `integrity`, ou desligar a página em produção.

---

## Lacunas de cobertura (onda 2 adiada — revisar numa próxima rodada)

O crítico de cobertura apontou superfícies que nenhuma unidade da onda 1 analisou:

1. **E-mail como identidade.**
   - `findByEmail` e `existsByEmail` comparam o e-mail exato, então `A@x` e `a@x` são contas distintas.
   - Convites, vínculos da empresa e o seed do ROOT resolvem a conta pelo e-mail cru.
2. **Ciclo de vida de status (BLOQUEADO / SUSPENSO / soft-delete).**
   - Usuários bloqueados continuam na busca, no feed, no ranking e com vínculos ATIVOS.
3. **Desvínculo de personal e encerramento de vínculo.**
   - O `trainer_clients.company_id` fica com o valor antigo depois que o personal sai da empresa.
   - Nem o aluno nem o personal conseguem encerrar um vínculo.
4. **Chave do Gemini na URL (`?key=`).**
   - Ela pode aparecer em logs e exceções (`GeminiService:85`, `WorkoutController:61`).
5. **Escritas sem cota.**
   - Uploads de até 10 MB, posts, comentários e pedidos de conexão não têm limite por usuário.
6. **WebSocket sem limites de recurso.**
   - Não há limite de tamanho de frame nem de número de assinaturas.
   - O handshake é público.
7. **Oráculo de CPF/CNPJ no cadastro.**
   - As mensagens "CPF já está em uso" e "CNPJ já cadastrado" revelam documentos cadastrados.
   - O CPF fica em texto puro.
8. **Mobile fora do armazenamento de credenciais.**
   - Ainda falta revisar o chat, o social, os uploads e o transporte.
9. **Maven wrapper.**
   - O `maven-wrapper.properties` não tem `distributionSha256Sum`.
   - Há um `.jar` versionado no repositório.

Além disso, o crítico pediu que a unidade de tenancy do `EmpresaService` fosse caçada de novo.

## Recomendações de hardening (não são achados)

As da versão anterior continuam valendo:
- enumeração de e-mail;
- falta de rate limit;
- e-mail sem normalização;
- JWT não revogável;
- token na query do WebSocket mobile;
- biometria só de interface;
- `console.error` com header Bearer;
- `pravatar.cc`;
- `Content-Type` do upload confiado ao cliente;
- comentários sem paginação nem delete;
- `approve` sem lock;
- `show-sql=true`;
- `/v3/api-docs` público;
- Dockerfile rodando como root;
- `updateWeight` devolvendo `e.getMessage()`.

Acrescente uma: delimitar o `goal` e o `medicalConditions` do aluno como dados no prompt do personal e limitar o tamanho deles.

## Pontos positivos verificados

Sem mudança em relação à versão anterior:
- usuário sempre derivado do JWT;
- `resolveOwnedStudent` em todas as rotas do personal;
- chat REST exigindo vínculo ativo;
- JWT com algoritmo fixo e role/status lidos do banco;
- refresh token com hash e rotação;
- só JPQL com parâmetros;
- CORS fixo;
- sem stack trace nas respostas;
- sem segredos no git;
- clientes renderizando texto escapado.

## Próximos passos

1. ~~Corrigir já o item 1~~ — feito no código em 2026-10-15 (ver "Correções aplicadas"). Falta:
   - configurar a Resend com um domínio verificado;
   - testar, commitar e fazer o deploy.

   Depois, corrigir os itens 2, 3 e 4.
2. **Verificar no painel do Supabase** os itens 9, 10 e 11 (só consultas de leitura) e, no Google Cloud, a cota do item 12.
3. **Nova rodada da auditoria (run-2)** com o Docker ligado. Ela também deve revalidar os itens 1 e 9 e os fluxos novos de código por e-mail:
   - executar a onda 2 nas 9 lacunas;
   - executar o crítico final;
   - reproduzir localmente os itens 6, 7 e 8.
