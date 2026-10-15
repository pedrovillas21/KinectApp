# Auditoria de segurança — KinectApp

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
  - **Verificar:** o tamanho real do pool Hikari em produção.
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
