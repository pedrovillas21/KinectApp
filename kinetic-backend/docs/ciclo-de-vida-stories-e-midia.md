# Ciclo de vida dos stories e das mídias

Como o backend garante que um story dure só 24h e que as fotos não fiquem guardadas para sempre
(armazenamento e LGPD). Leia antes de mexer em stories, posts com foto ou nos jobs de limpeza.

## Resumo

| Momento | O que acontece | Onde |
|---|---|---|
| Publicação | Story gravado em `social_posts` com `kind = 'STORY'` e `expires_at = agora + 24h`. A foto já subiu antes para o Storage (`stories/…`). | `SocialService.createStory` |
| Até 24h | `GET /api/social/stories` devolve só stories com `expires_at > agora` (o seu primeiro, depois os amigos). | `SocialPostRepository.findActiveStories` |
| Passou de 24h | O story some do app na hora (o filtro acima já o esconde), mas a linha e a foto ainda existem. | — |
| Até ~1h depois | O job **purgeExpiredStories** apaga a linha (curtidas e comentários vão junto) e depois a foto no Storage. | `ExpiredStoryCleanupService` |
| Diariamente 05:00 | O job **cleanOrphanMedia** procura fotos no Storage sem linha no banco (sobras de falhas). **Hoje roda em modo simulação**: veja abaixo. | `OrphanMediaCleanupService` |

Os timestamps usam `LocalDateTime.now()` do servidor, tanto na criação quanto na leitura e na limpeza.

## Job `purgeExpiredStories` (stories vencidos)

- **Quando:** de hora em hora, no minuto 15 (`@Scheduled(cron = "0 15 * * * *")`).
- **Trava:** ShedLock `purgeExpiredStories`, `lockAtMostFor = PT30M`: com vários servidores, só um executa.
- **Lote:** até 500 stories por execução (`BATCH_SIZE`). Se vencerem mais que isso numa hora, o resto sai
  nas execuções seguintes.
- **Ordem (de propósito):**
  1. busca os stories com `kind = 'STORY'` e `expires_at < agora`;
  2. apaga as linhas com `deleteAllByIdInBatch`. Curtidas (`post_likes`) e comentários (`post_comments`)
     saem pelo `ON DELETE CASCADE` da migração `V11`;
  3. só então apaga cada foto no Storage (`StorageService.delete`, best-effort: falha só gera log).

  Primeiro a linha e depois a foto: se o Storage falhar, sobra só um arquivo solto (que o job de órfãos
  pode limpar), nunca uma linha apontando para uma foto que não existe.
- **Sem `@Transactional` no método:** a busca e o delete usam transações curtas próprias do Spring Data, e as
  chamadas HTTP ao Storage acontecem depois do commit, sem prender conexão do banco.
- **Só stories:** a busca filtra `kind = 'STORY'`; posts do feed (`kind = 'POST'`) nunca são tocados.
- **Log esperado:** `ExpiredStoryCleanupService: N story(s) vencida(s) removida(s).` (nada é logado quando não
  há stories vencidos).
- **Testes:** `ExpiredStoryCleanupServiceTest`, que cobre a ordem linha → foto, story sem foto e a garantia de
  que só stories são buscados. Os testes usam mocks: a query e o cascade só são verificados de verdade no banco.

## Job `cleanOrphanMedia` (fotos sem dono)

- **Quando:** todo dia às 05:00. Trava ShedLock `cleanOrphanMedia`, `lockAtMostFor = PT2H`.
- **O que faz:** lista as pastas `posts/` e `stories/` do bucket e apaga os objetos que não aparecem em
  nenhuma `social_posts.image_url` e têm mais de `grace-hours` (padrão 24h). O prazo protege uploads em
  andamento: a foto sobe antes de a linha ser criada.
- **Modo simulação ligado por padrão:**

  ```properties
  social.media.cleanup.dry-run=${MEDIA_CLEANUP_DRY_RUN:true}
  social.media.cleanup.grace-hours=${MEDIA_CLEANUP_GRACE_HOURS:24}
  ```

  Com `MEDIA_CLEANUP_DRY_RUN=true` ele **não apaga nada**, só loga `[dry-run] removeria: <key>`.
  Por isso a limpeza dos stories vencidos **não depende** deste job: o `purgeExpiredStories` apaga a foto
  diretamente.

### Pendência: ligar a exclusão real das fotos órfãs

Os stories que venceram **antes** deste job existir ainda têm a linha no banco, então o
`purgeExpiredStories` apaga a linha e a foto deles já na primeira execução. Do job de órfãos dependem só
as **sobras**: fotos cujo post ou story falhou ao ser criado, ou que o Storage não conseguiu apagar.

Para ligar:
1. Ler nos logs de produção as linhas `[dry-run] removeria: …` de alguns dias e conferir que só aparecem
   arquivos que de fato não deveriam existir.
2. Definir `MEDIA_CLEANUP_DRY_RUN=false` no ambiente do backend e reiniciar.

## Fotos de perfil (avatares)

Diferente de posts e stories, a foto de perfil é **pública** (qualquer pessoa com o endereço vê, como
no Instagram) e fica num bucket separado.

- **Bucket:** `avatars`, criado no Supabase como **Public bucket** (Storage → New bucket → marcar
  "Public bucket"). Nome configurável por `SUPABASE_AVATARS_BUCKET` (`supabase.storage.avatars-bucket`).
  Sem esse bucket criado, a troca de foto falha com erro 500.
- **Arquivo:** `avatars/{userId}/{uuid}.{ext}`. Cada troca gera um nome novo, então a URL muda e nenhum
  cache mostra a foto antiga.
- **Banco:** a URL pública completa fica em `users.avatar_url` (não expira, não precisa assinar). Vazio
  = o app e o painel mostram as iniciais do nome. Antes, o servidor preenchia o vazio com uma foto
  aleatória de `i.pravatar.cc`; esse mock foi removido.
- **Endpoints:** `PUT /api/users/me/avatar` (multipart, campo `file`, até 10MB) devolve `{ "avatarUrl" }`;
  `DELETE /api/users/me/avatar` volta para as iniciais. Lógica em `AvatarService`.
- **Ordem na troca:** sobe a foto nova → grava a URL no usuário → só então apaga a antiga. Se gravar
  falhar, a foto nova é apagada e a antiga continua.
- **Exclusão de conta:** `AccountDeletionService` apaga a foto de perfil junto com as mídias de posts,
  depois do commit.
- **Fora dos jobs:** o `cleanOrphanMedia` não varre o bucket `avatars`. Se apagar a foto antiga falhar
  (só gera log), o arquivo fica para trás.

## Todos os jobs agendados do backend

| Job (ShedLock) | Horário | Serviço | O que limpa |
|---|---|---|---|
| `purgeExpiredStories` | a cada hora, :15 | `ExpiredStoryCleanupService` | stories vencidos + fotos |
| `purgeExpiredRefreshTokens` | 04:00 | `RefreshTokenService` | refresh tokens expirados |
| `purgeExpiredPasswordResetCodes` | 04:30 | `PasswordResetService` | códigos de redefinição de senha |
| `purgeExpiredEmailVerificationCodes` | 04:45 | `EmailVerificationService` | códigos de confirmação de e-mail |
| `purgeStaleTrainerInviteCodes` | 04:45 | `TrainerInviteCodeService` | convites de personal vencidos |
| `cleanOrphanMedia` | 05:00 | `OrphanMediaCleanupService` | fotos sem linha no banco (dry-run por padrão) |
| — (sem lock) | a cada 25s | `TrainerEventService.heartbeat` | mantém vivas as conexões de eventos do painel |

Ao criar um job novo: `@Scheduled` + `@SchedulerLock(name = "...")` com nome único, escolher um horário
que não colida com a tabela acima e acrescentar a linha aqui.

## Pontos de atenção

- **"Visto" não existe no servidor:** o app não sabe se você já viu o story de alguém, então o anel nunca
  fica cinza depois de visto. Exigiria uma tabela de visualizações, que também precisaria entrar nesta limpeza.
- **Exclusão de conta:** `AccountDeletionService.deleteAccount` apaga posts e stories do usuário e, depois do
  commit, as fotos no Storage (LGPD). Não depende destes jobs.
- **Prazo de 24h:** está fixo em `SocialService.createStory` (`plusHours(24)`). Se mudar, atualizar esta página.
