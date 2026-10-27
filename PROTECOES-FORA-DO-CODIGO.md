# Proteções fora do código

O que precisa ser configurado à mão (painéis da Cloudflare, Oracle, provedores e `.env` da VM) para os limites do backend funcionarem em produção. Marque cada item quando fizer.

> Contexto: os limites dentro do código estão no fim deste arquivo. Eles dependem do IP real do usuário chegar ao backend, então os itens 1 e 2 vêm primeiro.

---

## 0. Antes do próximo deploy (mudanças de 2026-10-27)

Vêm da rodada de correções de segurança, eficiência e testes. Faça nesta ordem.

**`.env`**
- [ ] `BILLING_GATEWAY=demo` no `.env` **local** (o do Docker no seu PC). A variável agora é obrigatória: sem ela o backend não sobe. Faça antes de reiniciar os containers.
- [ ] `BILLING_GATEWAY=demo` no `.env` **da VM**, antes do próximo `./deploy.sh`. Quando o Asaas entrar, troque para `asaas` ([CLOUDFLARE-PENDENCIAS.md](CLOUDFLARE-PENDENCIAS.md), item 3).

**GitHub**
- [ ] Commit e push da `implementacaoWeb`. O CI (`.github/workflows/ci.yml`) roda sozinho no push.
- [ ] Na aba **Actions**, conferir que os três jobs (`backend`, `desktop`, `app`) ficaram verdes. É a primeira execução: se algum falhar, o motivo aparece no log do job.
- [ ] **Proteger a `main`**: Settings → Branches → Add branch ruleset (ou *Add rule*) para `main`:
  - *Require a pull request before merging*;
  - *Require status checks to pass*, marcando `backend`, `desktop` e `app` (eles só aparecem na lista depois da primeira execução do CI);
  - *Block force pushes*.
- [ ] Abrir o PR `implementacaoWeb` → `main` e fazer o merge com o CI verde.

**VM**
- [ ] Deixar o repositório da VM na `main`: `git checkout main && git pull --ff-only`. O `deploy.sh` agora recusa qualquer outra branch.
- [ ] Rodar `./deploy.sh`. A primeira cópia aplica as migrations V50 a V52 em produção; os testes de integração já aplicaram as três sobre o schema de produção sem erro.

**Painel (Cloudflare Pages)**
- [ ] Depois do deploy do painel, abrir o site no Chrome com o DevTools (F12 → Console) e passar por login, 2FA (QR code), um dashboard com gráfico e uma tela com avatar. **Nenhuma mensagem `Refused to ... Content Security Policy`** pode aparecer. Se aparecer, a mensagem diz qual endereço faltou: acrescente-o na linha da CSP em `kinetic-desktop/public/_headers`.
- [ ] Em F12 → Network → documento principal → Response Headers, conferir que `content-security-policy` e `x-content-type-options` estão presentes (sinal de que o Pages leu o `_headers`).
- [ ] Cloudflare → SSL/TLS → Edge Certificates: ligar **HSTS** (max-age de 6 meses; *include subdomains* só se todos os subdomínios forem HTTPS).

**Conferências no `.env` de produção**
- [ ] `JWT_EXPIRATION_MS` curto (sugestão: `900000`, 15 min). É o tempo que um token roubado vale; o refresh renova sem o usuário perceber.
- [ ] `MEDIA_CLEANUP_DRY_RUN`: segue o item 17 em [CLOUDFLARE-PENDENCIAS.md](CLOUDFLARE-PENDENCIAS.md).
- [ ] Limite de gasto na chave da IA: item 4 deste arquivo. O código limita a 20 tentativas por hora por personal, mas o teto em dinheiro só existe no provedor.

**No dia a dia**
- [ ] Rodar `.\mvnw.cmd verify` (com o Docker Desktop aberto) antes de subir mudança no backend. Os testes usam um Postgres descartável, nunca o banco do `.env`.
- [ ] Migration só acrescenta (tabela, coluna anulável, índice). Remover ou renomear coluna fica para um deploy seguinte; o motivo está no README, seção 1.5.
- [ ] Quando produção passar da V52 de forma estável, regerar o snapshot dos testes (README, seção 1.4). Sem isso os testes continuam valendo, só ficam aplicando cada vez mais migrations sobre a V49.

---

## 1. Cloudflare

A API chega à VM pelo **Cloudflare Tunnel**: o `cloudflared` na VM abre a conexão de dentro para fora, então a VM não tem nenhuma porta de entrada aberta além do SSH. O HTTPS é da Cloudflare; não há certificado na VM.

- [x] **Proxy ligado** no registro `api` (nuvem laranja). Feito em 2026-10-24.
- [x] **Tunnel criado** (`kinetic-vps`) e `cloudflared` instalado como serviço na VM. Feito em 2026-10-25.
- [ ] **Public hostname do Tunnel**: `api.kineticfitness.com.br` → `HTTP` → `localhost:8080`. O registro `api` vira um CNAME `<id>.cfargotunnel.com` (apagar o registro A antigo, que apontava para o IP da VM).
- [ ] **Regra de rate limit da API**: Security → Security rules → Create rule → Rate limiting rules.
  - Nome: `api-rate-limit`
  - URI Path **starts with** (ou **contains**) `/api/`
  - Mesmas características: **IP**
  - **100** requisições em **10 segundos**
  - Ação: **Block** por 10 segundos
  - O plano grátis permite só esta regra; ela é a primeira barreira contra um IP abusando.
- [ ] **Não ligar** Bot Fight Mode nem I'm Under Attack no domínio todo. Os dois respondem com um desafio em JavaScript que o app e o painel não resolvem, e a API para de funcionar. Se precisar do Under Attack, aplique só ao site, nunca ao `api.kineticfitness.com.br`.
- [ ] De tempos em tempos, olhar Security → Analytics: bloqueios de usuários normais indicam limite apertado demais.

A proteção contra DDoS (ataque com milhares de IPs) já vem ligada e não precisa de configuração: vale para todo domínio com proxy.

## 2. VM da Oracle

- [ ] **Security List da VCN**: entrada só na 22 (SSH) e nas regras ICMP padrão da Oracle. **Sem 80, 443 ou 8080**: o tráfego da API vem pelo Tunnel, que é uma conexão de saída.
  - 22 (SSH): de preferência aceitar só do seu IP.
- [x] **Serviços desnecessários desligados**: `rpcbind` (porta 111) desativado e mascarado. Feito em 2026-10-25.
- [x] **SSH só com chave**: `passwordauthentication no`, `permitrootlogin without-password`. Conferido em 2026-10-25.
- [ ] Subir e atualizar o backend (2 cópias + balanceador; atualiza uma cópia por vez, sem tirar a API do ar):
  ```bash
  ./deploy.sh
  ```
- [ ] Conferir que só o SSH escuta para fora: em `sudo ss -tlnp`, a 8080 (balanceador) tem que aparecer como `127.0.0.1:8080`, nunca `0.0.0.0:8080`.

## 3. `.env` da VM

- [ ] `DEV_LOG_EMAIL_CONTENT` **ausente ou `false`**. Com `true`, os códigos de e-mail vão para o log.
- [ ] `RESEND_FROM_EMAIL=Kinetic <nao-responda@kineticfitness.com.br>` (domínio verificado no Resend).
- [ ] Não sobrescrever `SERVER_FORWARD_HEADERS_STRATEGY`: o `docker-compose.yml` já define `native`, e é isso que faz o backend enxergar o IP real. Só é seguro porque a 8080 fica presa à própria máquina; não mude o mapeamento de porta.
- [ ] O `.env` não vem pelo `git pull`: qualquer mudança é feita direto na VM, seguida de `./deploy.sh` (recria as cópias uma por vez).

- [ ] `PSEUDONYM_KEY` preenchida (gere uma vez com `openssl rand -base64 48`). Sem ela o backend não sobe. **Nunca troque** depois de ir para produção, e guarde uma cópia fora da VM: é ela que liga os registros retidos ao titular (RETENCAO-DE-DADOS.md).

## 4. Provedores externos

- [ ] **Resend**: a API key com permissão só de envio (**Sending access**) e restrita ao domínio `kineticfitness.com.br`.
- [ ] **Resend/DNS**: registro TXT `_dmarc` presente (já existe com `p=reject`).
- [ ] **IA (Google Gemini hoje)**: definir um **limite de gasto mensal** no console do provedor. As cotas do código seguram o uso normal; o limite do provedor segura um bug ou chave vazada.
- [ ] **Supabase Storage**: em cada bucket (`avatars`, `social-media`), configurar **tamanho máximo de arquivo** (ex.: 10 MB) e **tipos permitidos** (`image/*`, e `video/*` se houver vídeo). É uma segunda barreira caso alguém use a chave de outro jeito.
- [ ] **Asaas**: webhook criado com token próprio, e o mesmo token no `.env` da VM.

## 5. Obrigações legais (LGPD e Marco Civil)

Detalhes em [RETENCAO-DE-DADOS.md](RETENCAO-DE-DADOS.md).

- [ ] **Canal de privacidade funcionando**: `privacidade@kineticfitness.com.br` aparece na Política e nos Termos, mas o domínio hoje não recebe e-mail (MX nulo `.`). Cloudflare → Email → Email Routing → ativar e encaminhar `privacidade@` para o seu e-mail (ele substitui o MX nulo; SPF e DMARC continuam).
- [ ] **Encarregado de dados** (LGPD art. 41): indicar quem responde (pode ser você) e manter o contato público. Agente de pequeno porte tem dispensa (Resolução CD/ANPD 2/2022), mas ela pode não valer para quem trata dados de saúde em escala: confirmar com o advogado.
- [ ] **Revisão jurídica** da Política e dos Termos (`kinetic-desktop/src/legal/documents.ts`) por advogado; prazos fiscais com contador.
- [ ] **Razão social e CNPJ** em `CONTROLLER_NAME` / `CONTROLLER_CNPJ` (mesmo arquivo) quando a empresa existir. A obrigação do Marco Civil (registros de acesso) é de pessoa jurídica, mas o código já guarda.
- [ ] **Painel publicado** com as rotas públicas `/termos` e `/privacidade`; `EXPO_PUBLIC_SITE_URL` do app apontando para ele; mesma URL da Política no Google Play Console e no App Store Connect (as duas lojas exigem).
- [ ] **Contratos com fornecedores** (operadores): aceitar os acordos de tratamento de dados (DPA) de Supabase, Cloudflare, Resend, Asaas e do provedor de IA. Na IA, usar API paga com retenção zero e sem uso dos dados para treino.
- [ ] **Plano de incidente**: em vazamento com risco aos titulares, comunicar a ANPD e os afetados em até 3 dias úteis (Resolução CD/ANPD 15/2024). Anotar quem faz o quê.
- [ ] **Pedidos por e-mail** (acesso, exclusão de quem não entra no app): responder em até 15 dias; exclusão pelo ROOT em Usuários → Excluir definitivamente.

## 6. Teste depois de subir

- [ ] `https://api.kineticfitness.com.br` responde (1033 = Tunnel desconectado: `sudo systemctl status cloudflared`; 502 = backend fora do ar ou porta errada no Public hostname).
- [ ] Acesso direto pelo IP falha: `curl -m 5 http://163.176.184.23` e `curl -m 5 -k https://163.176.184.23` têm que esgotar o tempo.
- [ ] Rate limit do backend vê o IP real: 6 chamadas seguidas sem login a `POST /api/users/change-password` devem terminar em **429**; de outra rede (ex.: 4G do celular) a primeira chamada ainda passa.
- [ ] Log do backend sem `[DEV] E-mail para ...` ao pedir um código.

---

## Referência: o que já está no código

Contadores na tabela `rate_limit_counters` do Postgres: valem somados entre as cópias do backend e não zeram no deploy. As janelas são alinhadas ao relógio (o minuto vai de :00 a :59), então na virada um cliente pode somar até 2× o limite em poucos segundos.

| Onde | Limite | Por |
|---|---|---|
| Login, cadastro, códigos de e-mail (`/api/auth/*`) | 10 por minuto por rota | IP |
| Renovação de sessão (`/api/auth/refresh`) | 60 por minuto | IP |
| Todas as outras rotas da API | 120 por minuto | usuário logado (sem login, IP) |
| Upload de mídia do feed | 30 por hora | usuário |
| Troca de foto de perfil | 10 por hora | usuário |
| Novo post / novo story | 20 por hora cada | usuário |
| Comentário | 20 por minuto | usuário |
| Curtir/descurtir | 60 por minuto | usuário |
| Pedido de conexão | 30 por hora | usuário |
| Busca de usuários | 30 por minuto | usuário |
| Perfil de outro usuário (perfil, posts, treinos) | 60 por minuto | usuário |
| Troca de senha / excluir conta | 5 a cada 15 minutos cada | usuário |
| Exportar meus dados | 5 por hora | usuário |
| Página pública do convite | 30 por minuto | IP |
| Resgatar código de convite | 10 a cada 15 minutos | usuário |
| Convidar aluno por e-mail | 30 por hora | usuário |
| Criar/regerar código de convite | 20 por hora | usuário |
| Assinar plano / comprar pacote de IA | 10 por hora cada | usuário |
| Geração de fichas com IA (personal) | 20 por hora + cota mensal do plano | personal |
| Geração de ficha com IA (aluno) | 1 a cada 30 dias + limite de tentativas por hora | aluno |
| Códigos por e-mail | 60 s entre pedidos, 5 tentativas | conta |

Webhooks (`/api/webhooks/*`) ficam fora dos limites para não perder evento de pagamento; eles exigem o token do Asaas.

Código: `kinetic-backend/src/main/java/com/kinetic/security/ApiRateLimitFilter.java` (limites gerais e por rota) e `AuthRateLimitFilter.java` (rotas de `/api/auth`).

**Limite de login:** desde 2026-10-26, 5 tentativas por minuto por IP + e-mail (uma conta atacada não trava os outros alunos no mesmo Wi-Fi) e até 60 por minuto por IP. Limitação conhecida: um ataque espalhado por muitos IPs contra a mesma conta ainda tem 5 tentativas por minuto em cada IP.
