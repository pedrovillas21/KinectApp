# Cloudflare: o que configurar à mão

Estas regras completam as correções da rodada 2 da auditoria (ver [AUDITORIA-SEGURANCA.md](AUDITORIA-SEGURANCA.md)). O código já se protege sozinho. O Cloudflare é uma segunda barreira: ele barra o abuso antes de a requisição chegar à VPS e ao Postgres.

Faça depois do deploy da branch `implementacaoWeb` com a migration V50. A configuração base fica em [PROTECOES-FORA-DO-CODIGO.md](PROTECOES-FORA-DO-CODIGO.md) e deve ser feita antes desta:
- o Tunnel;
- a regra geral `api-rate-limit`;
- o Bot Fight Mode desligado.

## 1. Rate limit nas rotas de código (item 1)

O código agora aceita no máximo 10 palpites errados por hora em cada conta, somando todos os códigos. A regra abaixo também limita por IP.

> **Plano Free:** só cabe **uma** regra de rate limit, e ela já é a `api-rate-limit` geral. Nesse caso, pule este passo: o limite por conta no código já resolve o item 1. Crie esta regra quando o plano for pago.

1. Entre em dash.cloudflare.com e abra o domínio da API.
2. Vá em **Security → WAF → Rate limiting rules → Create rule**.
3. Em **Rule name**, use `auth-codigos`.
4. Em **If incoming requests match**, clique em **Edit expression** e cole:
   ```
   (http.request.uri.path in {"/api/auth/reset-password" "/api/auth/confirm-email" "/api/auth/forgot-password" "/api/auth/resend-confirmation"} and http.request.method eq "POST")
   ```
5. Em **With the same characteristics**, deixe **IP**.
6. Em **When rate exceeds**, configure 5 requisições por período.
   - **Plano Free:** o período é de 10 segundos, e só cabe uma regra de rate limit.
   - **Plano pago:** use 1 minuto.
7. Em **Then take action**, escolha **Block**. Em **Duration**, use o maior valor que o plano permitir.
8. Clique em **Deploy**.

- [ ] **Teste:** chame o `forgot-password` 6 vezes seguidas. A 6ª chamada deve voltar 429, com a página do Cloudflare.

## 2. Tamanho do corpo em `/api/sessions/log` (item 19)

O backend já recusa treinos com mais de 600 séries. Mesmo assim, ele ainda precisa receber e ler o JSON inteiro antes de recusar. Esta regra corta o envio antes disso.

1. Vá em **Security → WAF → Custom rules → Create rule**.
2. Em **Rule name**, use `corpo-grande-treino`.
3. Em **Edit expression**, cole:
   ```
   (http.request.uri.path eq "/api/sessions/log" and to_number(http.request.headers["content-length"][0]) > 200000)
   ```
4. Em **Action**, escolha **Block** e clique em **Deploy**.

Um treino real tem poucos KB, então 200 KB é bem folgado. Se o editor não aceitar `to_number`, pule esta regra: o limite do código continua valendo, e o Cloudflare do plano Free já corta corpos acima de 100 MB.

- [ ] Regra criada, ou pulada de propósito.

## 3. Conferências (não exigem regra nova)

- [ ] **Item 18 (conexões SSE):** o Cloudflare Tunnel não tem limite por cliente. O backend agora mantém no máximo 5 conexões por personal e fecha a mais antiga quando abre uma nova. Não há nada a configurar.
- [ ] **Item 20 (rate limiter):** a regra do passo 1 já tira do Postgres o grosso das rajadas em `/api/auth`. Nas outras rotas, o backend agora barra em memória quem já estourou o limite, sem gravar no banco.
- [ ] **IP real do cliente:** o `docker-compose.yml` já define `SERVER_FORWARD_HEADERS_STRATEGY=native`. Confira se o `.env` da VPS não sobrescreve esse valor. Sem ele, os limites por IP do backend tratam todos os usuários como o IP do Tunnel, e todo mundo divide o mesmo contador.

## Fora do Cloudflare, para não esquecer antes de abrir para o público

Estes itens ficaram de fora de propósito porque hoje ajudam na demo:

- [ ] `BILLING_GATEWAY=asaas` no `.env` quando o Asaas for integrado. No modo demo, qualquer personal ativa o plano sozinho (item 3).
- [ ] Tratar estorno e chargeback do Asaas no webhook (item 16).
- [ ] Ao subir o PRO depois de cancelar um plano pago, liberar os limites só depois do pagamento (item 9).
- [x] Cota de IA: contar gerações simultâneas e falhas cobradas (item 5). Resolvido no código em 2026-10-27: uma geração por vez por personal e teto de 20 tentativas por hora, inclusive as que falham. Falta só o limite de gasto no provedor (item 4 de [PROTECOES-FORA-DO-CODIGO.md](PROTECOES-FORA-DO-CODIGO.md)); na troca para o Claude Haiku, no Console da Anthropic, em Settings → Limits.
- [ ] `MEDIA_CLEANUP_DRY_RUN=false` depois de conferir no log que a limpeza de mídia órfã só apagaria o que deve (item 17).
- [ ] Criar a conta ROOT com um e-mail sem cadastro prévio, definindo `ROOT_USER_EMAIL` e `ROOT_USER_PASSWORD`.

## No deploy da V51 (redes, filiais e app autenticador)

- [ ] **Gerar a chave do segundo fator** na VPS e colocar no `.env` como `TOTP_ENCRYPTION_KEY=`:
  ```bash
  openssl rand -base64 32
  ```
  - Sem essa chave, dono, filial e ROOT não conseguem entrar.
  - **Não troque a chave depois:** os app autenticadores já cadastrados deixam de valer e todos precisam cadastrar de novo.
  - Guarde uma cópia fora da VPS, no gerenciador de senhas.
- [ ] `PANEL_URL=` no `.env` com o endereço do painel. Ele aparece no e-mail que leva o acesso do dono e das filiais.
- [ ] `RESEND_API_KEY` configurada com um domínio verificado. A senha das contas de gestão só chega por e-mail.
- [ ] **No primeiro login do ROOT depois do deploy**, cadastre o app autenticador (Authy, Google Authenticator ou Microsoft Authenticator) lendo o QR code. Guarde os 8 códigos de recuperação fora do celular: eles são a única saída se você perder o aparelho.
- [ ] Criar as empresas pelo painel ROOT → Empresas. O dono recebe o acesso por e-mail e cadastra as filiais.
