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
- **Atualização de 2026-10-26 (tarde):** as pendências foram reexecutadas num banco de teste montado com o schema de produção. O resultado de cada item está em [Verificação local](#verificação-local-2026-10-26). Na rodada original, nenhum achado tinha sido confirmado porque o backend não subia num banco vazio: a baseline V6 do Flyway assume tabelas criadas antes dele.
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

### Verificação local (2026-10-26)

**Ambiente usado:**
- **Código:** commit `12c2e1c`, com a imagem `kinetic-backend:latest` reconstruída.
- **Banco:** dump só da estrutura de produção (`Documents/db_dump/kinetic-schema.sql`, sem `COPY`/`INSERT`), restaurado num `postgres:17-alpine`. A tabela `flyway_schema_history` do dump foi removida e o Flyway fez baseline na V49, porque produção já tem tudo até a V49. O Hibernate (`ddl-auto=validate`) aceitou o schema sem divergências.
- **Rede:** Docker `--internal`, sem acesso externo e sem pastas do host montadas no backend.
- **Serviços externos:** o Gemini foi substituído por um servidor falso dentro da rede, e o Supabase Storage apontou para um endereço morto.
- **Contas:** só fictícias.
- **Atalhos permitidos só no banco de teste:**
  - marcar `email_verified=true` direto no banco;
  - zerar `rate_limit_counters` entre os passos;
  - recuar `created_at` do código de reset para simular os 60 s.
- **Scripts:** ficam em [`kinetic-backend/scripts/teste-isolado/`](kinetic-backend/scripts/teste-isolado/). `run.py` cobre os testes com o gateway demo. `phase2.py` cobre o seeder de ROOT e o gateway Asaas.

| # | Resultado | Evidência |
|---|---|---|
| 1 | **Confirmado** | 15 palpites errados na mesma conta em 3 rodadas. Cada novo `forgot-password` (após 60 s) recria o código com `attempts=0`. Na prática são 5 palpites/min por conta (~7.200/dia; 1 em 10⁶ por palpite), e o único freio extra é 10 req/min **por IP**. Vale igual para `confirm-email`, que tem o mesmo código. |
| 2 | **Confirmado** | Empresa criada pelo `/register-company` público vinculou um personal. Resultado: `aiGenerationsLimit` passou de 10 para ilimitado e 7 convites seguidos foram aceitos (o teste grátis permite 5). O painel continua mostrando `studentLimit=5`, mas `assertCanAddStudent` sai cedo para quem tem `company_id`. |
| 3 | **Confirmado com `BILLING_GATEWAY=demo`** | `subscribe PRO`, `demo/confirm-payment`, `ai-pack` e `demo/confirm-ai-pack` responderam 200: o personal ficou ATIVA/PRO e ganhou 20 créditos sem pagar. Em produção, isso depende só do `.env`. |
| 4 | **Confirmado** | `POST /api/empresa/personais` com o e-mail de qualquer personal sem empresa respondeu 201, sem aceite do personal. Não existe rota para o personal sair da empresa. |
| 5 | **Confirmado** | Com o Gemini fora do ar, 6 gerações fizeram 18 chamadas ao modelo (3 modelos cada) e a cota ficou em 0. 25 gerações simultâneas no teste grátis (cota 10, trava de 20/h) foram todas aceitas e gravadas: `aiGenerationsUsed=25`. |
| 6 | **Confirmado em parte** | Depois de encerrar o vínculo, a exportação do personal traz a avaliação física (com notas) e o nome do ex-aluno. Depois que o aluno **exclui a conta**, a avaliação e a geração de IA somem da exportação. Fica valendo só a parte do ex-aluno. |
| 7 | **Mitigado em parte** | Conta **não confirmada** com `ROOT_USER_EMAIL`: a promoção é recusada (continua ALUNO). Conta autocadastrada **e confirmada**: é promovida a ROOT e segue entrando com a senha de quem a criou, enquanto `ROOT_USER_PASSWORD` é ignorada (login 403). O risco que sobra depende de quem controla a caixa desse e-mail. |
| 8 | **Confirmado** | Depois de `change-password` (200), o access token emitido antes da troca continua aceito em `/api/users/profile` (200). Ele vale até `JWT_EXPIRATION_MS`. |
| 9 | **Confirmado** | Fluxo: BASE pago (`studentLimit=10`, IA 15) → cancelar → `subscribe PRO` sem pagar. Resultado: `status=PENDENTE`, `studentLimit` ilimitado e IA 100 até o fim do período pago como BASE. |
| 10 | Não testável localmente | Depende de `storage.buckets` em produção. |
| 11 | **Respondido pelo dump** | Produção tem `ALTER TABLE public.flyway_schema_history ENABLE ROW LEVEL SECURITY` e nenhuma policy. Com isso a Data API nega `anon`/`authenticated` mesmo com grants (o dump não traz grants). Baixo risco. |
| 12 | **Confirmado no código do app** | O código vai para a chave fixa `@kinetic_pending_invite_code` no AsyncStorage (`trainerService.ts:94`), sem ligação com o e-mail cadastrado, e `usePendingInviteRedeem` resgata no próximo login, de qualquer conta. O app não foi executado. |
| 13 | **Confirmado** | Cenário: o aluno sai do personal A e entra com B. B editou (200) e apagou (204) a avaliação criada por A, e depois da edição `trainer_id` continuou sendo A. |
| 14 | **Confirmado** | Um cadastro não confirmado reserva o celular (409 "Este celular já está cadastrado em outra conta.") e o CPF (409 "CPF já está em uso."). |
| 15 | **Confirmado** | Cada caso dá uma resposta diferente: e-mail inexistente 404; personal 400 "não pertence a um aluno"; aluno com personal 409 "já possui um personal ativo"; aluno livre 201. |
| 16 | **Confirmado** | Com `BILLING_GATEWAY=asaas`, foram enviados os webhooks `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`, `PAYMENT_CHARGEBACK_DISPUTE`, `PAYMENT_REFUND_IN_PROGRESS` e `PAYMENT_DELETED`. Todos voltaram 200 e foram ignorados: a assinatura seguiu ATIVA/PRO, com o mesmo `current_period_end` e os 20 créditos de IA. |
| 17 | Confirmado no código | `social.media.cleanup.dry-run=${MEDIA_CLEANUP_DRY_RUN:true}`. Falta conferir o valor em produção. |
| 18 | **Confirmado** | 40 conexões SSE simultâneas do mesmo personal em `/api/trainer/events`, todas aceitas (200). |
| 19 | **Confirmado** | Uma única sessão com 5.000 séries: 201 em ~2 s e 5.000 linhas em `exercise_set_logs`. Cada série faz um `findById`, então o custo cresce linearmente com o tamanho da lista. |
| 20 | **Confirmado** | 100 requisições anônimas a `/api/public/invite-codes/X`, das quais 70 foram bloqueadas com 429. Os contadores `ip:… *` e `ip:… convite-publico` chegaram a 100 cada: são 2 UPSERTs por requisição, inclusive nas bloqueadas. |
| 21 | **Confirmado** | 4 sessões de 6 h no mesmo dia, todas aceitas (201): 24 h de treino gravadas num dia só, e tudo conta no ranking. |
| Lacuna | **Confirmado** | A empresa vinculou um aluno ao personal e depois removeu o personal (204). O vínculo `COMPANY` continuou ATIVO e o personal removido seguiu lendo as avaliações do aluno (200). |

**Achado novo durante a verificação:** `POST /api/sessions/log` aceita `exerciseId` de uma ficha de **outro** usuário. O aluno B gravou uma série num exercício da ficha do aluno A e recebeu 201. Em `WorkoutSessionService.logSession` (`:118`), o `findById` não confere o dono. O impacto observado é de integridade: séries alheias ficam penduradas no exercício de A. Falta medir o efeito nas estatísticas de A.

**Checagens em produção (2026-10-26).** O app está em fase de piloto e o código auditado ainda não foi para a VPS.
- **Bucket (item 10):** `social-media` está com `public=false`, ou seja, privado. O `avatars` está com `public=true`, como previsto (fotos de perfil). **Item fechado.**
- **Cobrança (item 3):** nenhuma assinatura ATIVA com `gateway='DEMO'`. O Asaas ainda não está integrado, então produção roda no modo demo. **O item volta a valer antes de abrir cobrança real**: é preciso trocar para `asaas` ou bloquear as rotas `/demo/*`.
- **ROOT (item 7):** não existe conta ROOT. Ao criar, usar um e-mail sem cadastro prévio, para o seeder criar a conta com `ROOT_USER_PASSWORD`.
- **Empresas (itens 2 e 4):** não existe nenhuma empresa, nem criada nem vinculada. Ainda não houve abuso, mas a correção continua necessária.
- **IA (item 5):** está prevista a troca do Gemini (plano gratuito) pelo Claude Haiku 5.5. A troca não corrige o item: a contagem de cota continua no código e precisa contar a tentativa, não só o sucesso gravado. Junto com a troca, definir um limite de gasto no Console da Anthropic.

### Correções aplicadas (2026-10-26, branch `implementacaoWeb`, migration V50)

Ainda **sem commit e sem deploy**. Resultados:
- Backend: 105 testes passando.
- `tsc` sem erros no painel e no app.
- Cada item abaixo foi revalidado no ambiente isolado com o mesmo script da verificação.

| # | Correção | Revalidação |
|---|---|---|
| 1 | Limite de **10 palpites errados por hora por conta**, somando todos os códigos (o reenvio não zera), em `reset-password` e `confirm-email`. | 15 palpites em 3 códigos: 10 avaliados e 5 barrados com 429. |
| 4 | A empresa **convida**: o convite fica em `users.pending_company_id` e o personal aceita ou recusa em "Meu perfil" no painel (`/api/trainer/company`). O personal pode **sair da empresa**. A lista de Funcionários mostra "Convite pendente". | O personal não entra na empresa sem aceitar. O aceite responde 200. |
| Lacuna | Quando o personal sai da empresa ou é desvinculado por ela, os vínculos `COMPANY` dele (ativos e pendentes) são encerrados. | Vínculo ENCERRADO; o ex-funcionário recebe 404 nas avaliações do aluno. |
| 6 | A exportação do personal traz avaliações, gerações de IA e fichas só dos alunos com vínculo **ATIVO**. Os alunos atribuídos pela empresa saem junto quando o personal deixa a empresa. O histórico do vínculo e as cobranças continuam na exportação, com o nome do aluno. | A avaliação do ex-aluno não aparece mais na exportação. |
| 7 | O seeder promove a conta confirmada **trocando a senha pela `ROOT_USER_PASSWORD`** e encerra as sessões abertas. | Senha do cadastro: 403. `ROOT_USER_PASSWORD`: 200. |
| 8 | `users.credentials_changed_at` é gravado na troca e na redefinição de senha. O filtro JWT recusa tokens emitidos antes disso (claim `iat_ms`, em milissegundos). | Token antigo depois do `change-password`: 401. |
| 13 | Só o personal que fez a avaliação pode editá-la ou excluí-la. | O personal B recebe 400 ao editar ou apagar a avaliação de A. |
| 14 | Job diário (05:15) apaga cadastros de aluno/personal **não confirmados há mais de 3 dias** e sem treinos. Isso libera e-mail, celular e CPF. | Pela mesma consulta: o cadastro de 4 dias foi apagado e o celular voltou a aceitar cadastro (201). O cron em si não rodou no teste. |
| 18 | No máximo **5 conexões SSE por personal**; a mais antiga é fechada. | De 40 conexões abertas, 5 ficaram vivas. |
| 19 | `exercisesLog` com no máximo **600 séries**. | 5.000 séries: 400. |
| 20 | Chave que estourou o limite é barrada **em memória** até a janela virar, sem escrever no Postgres. | Contador da regra parou em 31, contra 100 antes. |
| 21 | Teto de **6 h somadas por dia**, não por treino. | Primeira sessão de 6 h: 201. As 3 seguintes: 400. |
| Extra | `/sessions/log` só aceita exercícios das fichas do próprio usuário. | Exercício da ficha de outro aluno: 404. |
| 12 | O app guarda o código de convite **junto com o e-mail** de quem se cadastrou e só resgata para essa conta. O formato antigo, sem dono, é descartado. | Conferido no código e com `tsc`; o app não foi executado. |

**Mantidos de propósito para a demo:**
- 3, 9 e 16 (cobrança e Asaas);
- 5 (cota de IA: contar falhas gastaria a cota nos testes);
- 17 (dry-run).

### Redes de empresas, segundo fator e itens 2 e 15 (2026-10-26, migration V51)

Ainda **sem commit e sem deploy**.
- **Testes de unidade:** 105 do backend passando, mais os novos: TOTP com os vetores do RFC 6238, cifra do segredo, gerador de senha e convite com resposta única.
- **Tipagem:** `tsc` sem erros no painel e no app.
- **Teste isolado:** fluxo completo em [`scripts/teste-isolado/phase3.py`](kinetic-backend/scripts/teste-isolado/phase3.py).
- **Navegador:** o painel foi aberto contra o backend de teste. Login do ROOT com QR code, criação da rede, primeiro acesso do dono e cadastro de filial funcionaram.

| # | Correção | Revalidação |
|---|---|---|
| 2 | **Cadastro público de empresa removido** (`/api/auth/register-company` e a aba "Empresa" do painel). O ROOT cria a **rede** (CNPJ obrigatório, apelido usado no login) e o acesso do **dono** (papel `DONO`). O dono cadastra as **filiais**, cada uma com CNPJ obrigatório, endereço, telefone e responsável. Cada filial ganha o usuário `rede.filial`, com e-mail interno e senha forte gerada pelo sistema e enviada ao e-mail informado pelo dono (pode ser o mesmo para todas). A filial não troca nem recupera a própria senha: o dono ou o ROOT geram outra, e as sessões caem. A filial gerencia personais e alunos; o dono acompanha cada filial e o consolidado. | Cadastro público: 404. Filial sem CNPJ: 400. Duas filiais com o mesmo e-mail: 201. Filial tentando trocar a senha: 403. Nova senha pelo dono: token antigo recebe 401. Filial de outra rede: 404. |
| 2FA | **App autenticador (TOTP, RFC 6238) obrigatório para DONO, EMPRESA e ROOT.** A senha certa devolve só um token de desafio de 5 min, que não serve como access token. O primeiro acesso mostra o QR code (gerado no navegador) e 8 códigos de recuperação de uso único, guardados só como hash. O segredo fica cifrado com AES-256-GCM (`TOTP_ENCRYPTION_KEY`). O mesmo código não entra duas vezes. Limite de 10 erros por hora por conta. O dono redefine o 2FA da filial e o ROOT redefine o de qualquer conta de gestão. | Só com senha: sem token. Desafio usado como Bearer: 401. Mesmo código duas vezes: 400. Código de recuperação usado duas vezes: 200 e depois 400. Depois do reset feito pelo ROOT, o login volta ao cadastro do app. 11 códigos errados: 429 a partir do limite. |
| 15 | O convite do personal e o vínculo de aluno pela filial respondem **a mesma mensagem (400)** para e-mail sem conta, conta que não é de aluno, a própria conta e aluno que já tem personal. | Os três casos respondem a mesma mensagem 400. |
| Fotos | O app (`expo-image-manipulator`) e o painel (canvas) reduzem a foto para até 1080 px em JPEG 80% antes do envio. O backend e o multipart aceitam no máximo 3 MB, com resposta 413 clara. | Conferido no código e com `tsc`. O envio de foto no app não foi executado. |

**Resolvido junto:** o formulário de empresa do ROOT nunca enviava o CNPJ e falhava sempre.

Os passos manuais estão em [CLOUDFLARE-PENDENCIAS.md](CLOUDFLARE-PENDENCIAS.md).

**Para repetir a verificação**, com o Docker Desktop aberto:
1. Restaure o dump numa rede `--internal` e remova a `flyway_schema_history`.
2. Suba o backend com `SPRING_FLYWAY_BASELINE_VERSION=49`, `BILLING_GATEWAY=demo` e `GEMINI_API_BASEURL=http://fake-gemini:8000/v1beta/models`.
3. Rode `python run.py` no container `kinetic-test-client` (imagem do `Dockerfile` da pasta de scripts).
4. Para os itens 7 e 16, reinicie o backend com `ROOT_USER_EMAIL`/`ROOT_USER_PASSWORD` e `BILLING_GATEWAY=asaas` + `ASAAS_WEBHOOK_TOKEN=whtoken` e rode `phase2.py`.

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
