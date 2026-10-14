# Auditoria de segurança — KinectApp

- **Commit auditado:** `b7447a3` (branch `implementacaoWeb`)
- **Data:** 2026-10-14
- **Método:** skill `security-audit` (Cloudflare), perfil *standard*, com o grafo do graphify como mapa do código.
- **Artefatos completos:** `~/security-audit-skill/KinectApp/run-1/` (ledger de cobertura, candidatos em JSON, evidências).

## ⚠️ Status: execução parcial

A execução parou a pedido, **antes da validação independente** (fases 3 a 5 da skill).

- **O que rodou:** reconhecimento (4 agentes) e uma onda de caça (13 caçadores, 26 unidades de cobertura, todas fechadas).
- **O que não rodou:**
  - os críticos de cobertura;
  - a verificação independente de cada candidato.
- **Consequência:** todos os itens abaixo são **candidatos propostos pelos caçadores**, não achados validados por um segundo revisor.
- **Reprodução local:** os itens marcados como "reproduzido" foram demonstrados numa sandbox isolada:
  - imagem do backend deste commit;
  - Docker em rede `--internal`;
  - apenas contas fictícias;
  - sem contato com produção.
- **Validação pendente:** os itens marcados como "pendente" dependem de fatos fora do código (configuração do Supabase, Gemini, deploy).

---

## Resumo

| # | Severidade proposta | Achado | Estado |
|---|---|---|---|
| 1 | **Crítica** | Reset de senha sem prova de identidade (tomada de qualquer conta, inclusive ROOT) | Reproduzido |
| 2 | **Alta** | Empresa autocadastrada vincula qualquer aluno ao seu personal sem consentimento e lê dados de saúde | Reproduzido |
| 3 | **Alta** | STOMP não autoriza SUBSCRIBE: qualquer usuário lê o chat privado de terceiros via assinatura curinga | Reproduzido |
| 4 | **Média** | Curtidas e comentários ignoram a visibilidade por conexão (leitura e escrita, inclusive após desfazer amizade) | Reproduzido |
| 5 | — | `DELETE /api/social/media` apaga qualquer objeto do bucket com a chave service-role | Pendente |
| 6 | — | `imageUrl` de post/story aceita a chave de mídia de outro usuário e o backend reassina essa mídia | Pendente |
| 7 | — | Uma empresa pode "roubar" o personal de outra empresa | Pendente |
| 8 | — | O seeder de ROOT promove uma conta pré-existente e mantém a senha dela | Pendente |
| 9 | — | Bucket `social-media` pode ter ficado público (nada no repo força privado) | Pendente |
| 10 | — | `flyway_schema_history` ficou fora do REVOKE/RLS do V21 (exposta via PostgREST) | Pendente |
| 11 | — | Anamnese do aluno entra sem delimitação no prompt do personal; a saída da IA é gravada sem sanitização | Pendente |
| 12 | — | `/api/workouts/generate` sem limite de tamanho ou de chamadas (custo do Gemini) | Pendente |
| 13 | — | Transação JPA aberta durante a chamada ao Gemini (pode esgotar o pool de conexões) | Pendente |
| 14 | — | `size` do feed social sem limite máximo | Pendente |
| 15 | — | Duração e data da sessão sem limite manipulam o ranking da Arena | Pendente |
| 16 | — | `/docs.html` carrega script de CDN sem SRI na mesma origem da API | Pendente |

---

## 1. Reset de senha sem prova de identidade — Crítica (reproduzido)

- **Onde:**
  - `kinetic-backend/src/main/java/com/kinetic/controllers/AuthController.java:178`
  - `services/AuthService.java:119-126`
  - `dtos/ResetPasswordDTO.java`
  - `config/SecurityConfig.java:46`
- **O problema:**
  - `POST /api/auth/reset-password` é público (`/api/auth/**` está em `permitAll`) e recebe só `{email, newPassword}`.
  - O serviço busca o usuário pelo e-mail e sobrescreve a senha, sem token, OTP ou senha atual.
  - Não existe nenhum fluxo de "esqueci a senha" com token no backend; o app mobile chama esse endpoint direto (`KineticApp/src/contexts/AuthContext.tsx:394-416`).
- **Reprodução (sandbox):**
  1. Cadastro → 201.
  2. Login com a senha original → 200.
  3. Reset anônimo → 200.
  4. Login com a senha antiga → 403.
  5. Login com a senha escolhida pelo atacante → 200 com JWT.
- **Impacto:** tomada de qualquer conta (ALUNO, PERSONAL, EMPRESA, ROOT) conhecendo só o e-mail. O e-mail pode ser confirmado em `/api/auth/verify-email`.
- **Correção:**
  - Implementar um token de recuperação aleatório, de uso único, com expiração e guardado como hash, enviado por e-mail.
  - `ResetPasswordDTO` passa a ter `token` + `newPassword`, e o serviço consome o token antes de trocar a senha.
  - Até lá, **desabilitar o endpoint**.

## 2. Vínculo empresa → aluno sem consentimento — Alta (reproduzido)

- **Onde:**
  - `AuthController.java:63` (`/register-company` público)
  - `services/CompanyService.java:77`
  - `services/EmpresaService.java:70, 107`
  - `services/TrainerLinkService.java:159-192`
  - `controllers/TrainerController.java:176`
- **O problema:**
  - Qualquer pessoa cria uma EMPRESA pelo endpoint público e cadastra um PERSONAL próprio.
  - Com `POST /api/empresa/alunos {studentEmail, trainerEmail}`, o link é criado **ATIVO** na hora (`source=COMPANY`), sem o aluno aceitar.
  - Esse link passa no `resolveOwnedStudent`, e o personal do atacante lê a anamnese (peso, idade, condições médicas), as estatísticas e os planos, além de poder escrever planos para o aluno.
  - A única limitação é que o aluno não pode ter personal ativo.
- **Reprodução:**
  - Antes do vínculo: `GET .../ai-plans/context` → 404.
  - A empresa vincula o aluno → 201 ATIVO.
  - Depois do vínculo: o mesmo GET → 200, com o `weightKg` privado da vítima.
- **Correção:**
  - A atribuição pela empresa deve nascer `PENDENTE` e exigir aceite do aluno pelo fluxo de convite já existente.
  - Também vale reavaliar se `/register-company` deve ser público. O próprio DTO diz que deveria ser provisionamento do ROOT.

## 3. STOMP sem autorização de SUBSCRIBE — Alta (reproduzido)

- **Onde:**
  - `security/JwtChannelInterceptor.java:36-38`
  - `config/WebSocketConfig.java:54`
  - `services/ChatService.java:59-60`
- **O problema:**
  - O interceptor só trata o frame `CONNECT` e devolve SUBSCRIBE/SEND sem checagem.
  - O simple broker usa o `AntPathMatcher` padrão.
  - `convertAndSendToUser` publica em `/queue/chat-user{sessionId}`.
  - Uma assinatura em `/queue/**` ou `/queue/chat*` recebe as mensagens de **todos** os usuários conectados.
- **Reprodução:**
  - Um ALUNO sem vínculo nenhum (o envio equivalente pela REST deu 403) assinou `/queue/**`.
  - Ele recebeu na íntegra a mensagem privada personal→aluno, com conteúdo de saúde.
- **Correção:**
  - No interceptor, em SUBSCRIBE aceitar só destinos `/user/...` sem curingas, e em SEND só `/app/...`.
  - Ou adotar a autorização de mensagens do Spring Security.
  - No CONNECT, checar também `userDetails.isEnabled()`: hoje um usuário suspenso com token válido ainda conecta.

## 4. Curtidas e comentários sem checagem de visibilidade — Média (reproduzido)

- **Onde:**
  - `services/SocialService.java:249-296` (`listComments` nem recebe o usuário)
  - `controllers/SocialController.java:270`
- **O problema:**
  - Feed e stories filtram por conexão aceita.
  - Já `GET/POST /posts/{id}/comments` e `POST/DELETE /posts/{id}/like` aceitam qualquer `postId`.
- **Reprodução:**
  - Depois que a vítima desfez a conexão, o ex-amigo ainda leu os comentários (texto e autores).
  - Ele também curtiu, descurtiu e comentou.
- **Correção:** criar um `requireVisiblePost(me, postId)` (autor = eu ou conexão ACCEPTED, senão 404) e usá-lo nos quatro caminhos.

---

## Candidatos pendentes de validação (sem severidade atribuída)

**5. Delete de mídia arbitrária.**
- **Código:** `SocialController.java:66-70` → `StorageService.delete/normalizeKey/deleteByKey` (`:213-236`, `:294-304`).
- **Problema:** qualquer chave enviada pelo cliente vira um DELETE com a chave service-role, sem checar dono, pasta ou referência.
- **Por que está pendente:** o Supabase Storage não é acessível na sandbox.
- **Correção:** exigir que a chave esteja em `posts/` ou `stories/`, que tenha sido enviada pelo próprio usuário (registro de upload) e que não esteja referenciada por nenhum post.

**6. Reassinatura de mídia alheia.**
- **Código:** `SocialService.java:184, 200` grava `normalizeKey(req.imageUrl())` sem vínculo com o autor.
- **Problema:**
  - Quem conhece a chave de uma mídia (ela aparece na URL assinada) cria um post com ela e passa a obter URLs assinadas novas indefinidamente.
  - Isso anula a revogação por desfazer amizade e a expiração de stories.
- **Correção:** só aceitar chaves de uploads do próprio autor.

**7. Troca de empresa de um personal.**
- **Código:** `EmpresaService.java:64-71` sobrescreve `companyId` sem verificar o valor atual nem pedir consentimento.
- **Problema:** depois da troca, a empresa original não consegue mais desvincular o personal (404 em `:79`).
- **Correção:** recusar se `companyId` já estiver preenchido com outra empresa, ou exigir aceite do personal.

**8. Seeder de ROOT.**
- **Código:** `config/RootUserSeeder.java:42-46`.
- **Problema:**
  - Se já existe uma conta com `ROOT_USER_EMAIL`, o seeder só troca o papel para ROOT e mantém a senha dela.
  - Como o cadastro público não verifica e-mail, quem registrar esse e-mail antes vira ROOT no próximo boot.
- **Correção:** só promover contas criadas pelo seeder, ou redefinir a senha para `ROOT_USER_PASSWORD`.
- **Verificar em produção:** o `created_at` da conta ROOT e se a senha configurada funciona.

**9. Bucket possivelmente público.**
- **Evidência:**
  - `Plan/FotoSave.md:18` manda criar o bucket como público.
  - O V22 só migra as URLs e não altera `storage.buckets.public`.
  - `.env.example:30` ainda diz "bucket PÚBLICO".
- **Verificar:** `SELECT id, public FROM storage.buckets;`.
- **Correção:** codificar `public=false` numa migration ou checar no startup.

**10. `flyway_schema_history` fora do V21.**
- **Código:** `V21__enable_rls_deny_all.sql:34` exclui a tabela do loop, inclusive do REVOKE.
- **Verificar no SQL editor:**
  - `information_schema.role_table_grants` para essa tabela;
  - `relrowsecurity`.
- **Correção:** `REVOKE ALL ON public.flyway_schema_history FROM anon, authenticated;` + `ENABLE ROW LEVEL SECURITY`.

**11. Injeção de prompt e saída da IA.**
- **Código:** em `TrainerAiPlanService.java:228/282`, `medicalConditions` e `goal` do aluno entram sem delimitação no prompt do personal (só o texto do personal fica cercado por `<<<PEDIDO`).
- **Problema:** a saída do Gemini é gravada só com corte de tamanho (`:289-354`; `WorkoutService.java:120-145`).
- **Situação nos clientes:** os clientes revisados renderizam como texto (sem `dangerouslySetInnerHTML`), então o risco atual é sobretudo manipular o rascunho que o personal aprova.
- **Correção:** delimitar todos os campos de menor confiança e validar a saída.

**12. Custo do Gemini sem limite.**
- **Código:** `WorkoutController.java:46` (sem `@Valid`) e `GenerateWorkoutRequestDto` (sem `@Size`).
- **Problema:**
  - Qualquer conta autocadastrada faz chamadas ilimitadas, com textos enormes (50k caracteres foram aceitos).
  - Cada chamada tenta até 3 modelos.
- **Correção:** `@Valid` + `@Size` no DTO e cota ou cooldown por usuário.

**13. Transação aberta durante a chamada à IA.**
- **Código:** `WorkoutService.generateWorkoutForUser` é `@Transactional` e chama o Gemini (até 3×120 s) segurando uma conexão do pool Hikari (padrão de 10 conexões).
- **Correção:** fazer como o `TrainerAiPlanService.generatePreview`: chamar a IA fora da transação.

**14. Feed sem limite de página.**
- **Código:** `SocialController.java:202-203` repassa `size` direto para `PageRequest.of`. Na sandbox, `size=2147483647` foi aceito.
- **Correção:** `Math.min(size, 50)`, como o `ChatService` já faz.

**15. Ranking manipulável.**
- **Código:** `LogSessionRequestDTO` só tem limite inferior. `durationInSeconds=2000000000` e data em 2099 passaram na validação.
- **Problema:** o ranking (`HomeAggregatorService.java:213`) soma a duração informada pelo próprio usuário e mostra o resultado aos amigos.
- **Correção:** `@Max` na duração, janela de datas aceitas e um CHECK no banco.

**16. Script de CDN sem SRI.**
- **Código:** `static/docs.html:10` carrega `@scalar/api-reference@1.62.5` do jsDelivr sem `integrity`, sem CSP e na mesma origem do cookie de refresh.
- **Correção:**
  - adicionar `integrity` + `crossorigin`;
  - ou hospedar o script localmente;
  - ou desligar `/docs.html` e `/v3/api-docs` em produção.

---

## Recomendações de hardening (não são achados)

- **Enumeração de e-mail:** `verify-email` (200 vs 404), `register` (409) e `reset-password` (404) revelam se o e-mail existe. Use respostas uniformes e rate limit.
- **Rate limit:** não existe em nenhum lugar (login, cadastro, register-company, IA).
- **E-mail como identidade:** o e-mail não é normalizado. `A@x` e `a@x` geraram duas contas distintas. Normalize (trim + minúsculas) e crie um índice único em `lower(email)`.
- **Revogação do access token:** o JWT não é revogável antes de expirar, nem depois de reset de senha ou suspensão. Considere uma versão de token por usuário ou uma expiração curta.
- **Token do WebSocket:** o mobile envia o JWT na query `?token=` do WebSocket (`KineticApp/src/services/chatService.ts:72`), o que o expõe em logs de proxy. O desktop já usa só o header.
- **Biometria no mobile:** o desbloqueio é só de interface. Guarde o refresh token com `requireAuthentication` no SecureStore.
- **Logs no mobile:** há `console.error` com objetos Axios (incluindo o header Bearer) e um bloco de diagnóstico do FaceID. Remova os consoles no build de release.
- **Avatar padrão:** usa `i.pravatar.cc` e vaza UUIDs de usuários para terceiros. Use um placeholder local.
- **Upload:** confia no Content-Type do cliente (aceita `image/svg+xml`). Verifique os magic bytes.
- **Comentários:** a listagem não tem paginação e não existe endpoint para apagar comentário.
- **`logSession`:** não verifica se o `exerciseId` pertence ao usuário (efeito só sobre os dados do próprio usuário) e aceita uma lista `exercisesLog` sem limite de tamanho.
- **Aprovação de IA:** `approve` não tem lock otimista. Em produção, quem protege contra duplicidade é o trigger do V25. Considere `SELECT ... FOR UPDATE`.
- **Configuração:**
  - `spring.jpa.show-sql=true` está ligado em produção;
  - `/v3/api-docs` é público e expõe 63 rotas;
  - o `Dockerfile` roda como root e usa tags sem digest;
  - o `.gitignore` ignora `package-lock.json`.
- **`UserController.updateWeight`:** devolve `e.getMessage()` com status 500.

## Pontos positivos verificados

- Todos os controllers derivam o usuário do JWT (`BaseController.currentUserEmail()`), nunca de um id vindo no body.
- **Rotas do personal:** todas passam pelo `resolveOwnedStudent`, com link ATIVO. A aprovação de IA amarra personal + aluno + status + TTL de 24h.
- **Chat REST:** exige vínculo ativo nos dois sentidos.
- **JWT:**
  - a assinatura é verificada, com algoritmo atrelado à chave;
  - o papel e o status vêm do banco a cada requisição.
- **Refresh token:**
  - aleatório, guardado como hash SHA-256 e rotacionado a cada uso;
  - revogado na troca de senha e na mudança de status.
- **Banco:** só JPQL com parâmetros (nenhuma query nativa e nenhuma concatenação de strings).
- **CORS:** usa lista fixa e não reflete a origem recebida.
- **Erros:** as respostas não expõem stack trace.
- **Segredos:** nenhum segredo versionado, nem no histórico do git.
- **Lockfiles npm:** todos apontam para `registry.npmjs.org`.
- **Clientes:** sem `dangerouslySetInnerHTML` ou `eval`; o mobile guarda tokens no SecureStore.

## Cobertura e limites

- **Onda 1:**
  - 26 unidades de cobertura (12 cobertas sem achado e 14 com candidato);
  - escopo: `kinetic-backend`, `kinetic-desktop`, `KineticApp`, migrations, `supabase/` e manifests.
- **Não executado:**
  - críticos de cobertura;
  - onda 2, que incluiria a unidade proposta sobre canonicalização de e-mail em convites, vínculos e seed;
  - verificação independente (fases 3 a 5).
- **Limites da sandbox:**
  - o schema foi criado pelo Hibernate, sem os controles de banco do V21/V25;
  - Storage e Gemini não estavam disponíveis.
- **Próximo passo sugerido:**
  1. Corrigir os itens 1 a 4 primeiro (o item 1 é urgente).
  2. Validar os itens 8, 9 e 10 direto no painel do Supabase.
  3. Rodar uma nova execução da auditoria para a validação independente.
