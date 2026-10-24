# Proteções fora do código

O que precisa ser configurado à mão (painéis da Cloudflare, Oracle, provedores e `.env` da VM) para os limites do backend funcionarem em produção. Marque cada item quando fizer.

> Contexto: os limites dentro do código estão no fim deste arquivo. Eles dependem do IP real do usuário chegar ao backend, então os itens 1 e 2 vêm primeiro.

---

## 1. Cloudflare

- [x] **Proxy ligado** no registro `api` (nuvem laranja). Feito em 2026-10-24.
- [ ] **Modo SSL/TLS em Full (strict)**: SSL/TLS → Overview.
- [ ] **Certificado de origem**: SSL/TLS → Origin Server → Create Certificate (RSA, 15 anos, `*.kineticfitness.com.br` e `kineticfitness.com.br`). Salvar na VM:
  - `kinetic-backend/caddy/certs/origin.pem` (certificado)
  - `kinetic-backend/caddy/certs/origin.key` (chave privada; só aparece uma vez; nunca vai para o git)
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

- [ ] **Security List da VCN**:
  - 80 e 443: aceitar **só das faixas de IP da Cloudflare** (<https://www.cloudflare.com/ips/>). Assim ninguém ataca a VM direto pelo IP.
  - 22 (SSH): aceitar só do seu IP.
  - **Não abrir a 8080.**
- [ ] **Firewall da própria VM** (as imagens Ubuntu da Oracle bloqueiam 80/443 no `iptables`):
  ```bash
  sudo iptables -I INPUT 6 -p tcp -m multiport --dports 80,443 -j ACCEPT && sudo netfilter-persistent save
  ```
- [ ] **Trocar o IP público da VM** (opcional, recomendado). O IP `163.176.98.144` ficou exposto enquanto o registro estava "DNS only" e pode estar em históricos públicos de DNS. Um IP novo, só atrás do proxy, nunca apareceu. Depois de trocar, atualizar o registro `api` na Cloudflare.
- [ ] **SSH só com chave**: `PasswordAuthentication no` em `/etc/ssh/sshd_config`.
- [ ] Subir sempre com o Caddy:
  ```bash
  docker compose --profile prod up -d --build
  ```
- [ ] Conferir a cada atualização da lista de IPs da Cloudflare se as faixas do `kinetic-backend/caddy/Caddyfile` e da Security List continuam iguais.

## 3. `.env` da VM

- [ ] `DEV_LOG_EMAIL_CONTENT` **ausente ou `false`**. Com `true`, os códigos de e-mail vão para o log.
- [ ] `RESEND_FROM_EMAIL=Kinetic <nao-responda@kineticfitness.com.br>` (domínio verificado no Resend).
- [ ] Não sobrescrever `SERVER_FORWARD_HEADERS_STRATEGY`: o `docker-compose.yml` já define `native`, e é isso que faz o backend enxergar o IP real. Só é seguro porque a 8080 fica presa à própria máquina; não mude o mapeamento de porta.
- [ ] O `.env` não vem pelo `git pull`: qualquer mudança é feita direto na VM, seguida de `docker compose --profile prod up -d --force-recreate backend`.

## 4. Provedores externos

- [ ] **Resend**: a API key com permissão só de envio (**Sending access**) e restrita ao domínio `kineticfitness.com.br`.
- [ ] **Resend/DNS**: registro TXT `_dmarc` presente (já existe com `p=reject`).
- [ ] **IA (Google Gemini hoje)**: definir um **limite de gasto mensal** no console do provedor. As cotas do código seguram o uso normal; o limite do provedor segura um bug ou chave vazada.
- [ ] **Supabase Storage**: em cada bucket (`avatars`, `social-media`), configurar **tamanho máximo de arquivo** (ex.: 10 MB) e **tipos permitidos** (`image/*`, e `video/*` se houver vídeo). É uma segunda barreira caso alguém use a chave de outro jeito.
- [ ] **Asaas**: webhook criado com token próprio, e o mesmo token no `.env` da VM.

## 5. Teste depois de subir

- [ ] `https://api.kineticfitness.com.br` responde (521/522 = porta fechada; 526 = certificado ou modo SSL errado).
- [ ] Acesso direto pelo IP falha: `curl -k https://163.176.98.144` não pode responder.
- [ ] Rate limit do backend vê o IP real: 6 chamadas seguidas sem login a `POST /api/users/change-password` devem terminar em **429**; de outra rede (ex.: 4G do celular) a primeira chamada ainda passa.
- [ ] Log do backend sem `[DEV] E-mail para ...` ao pedir um código.

---

## Referência: o que já está no código

Contadores em memória, por cópia do backend (com 2 cópias, cada limite vale em dobro; zeram a cada deploy).

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

**Limitação conhecida:** o limite de login é por IP. Numa academia em que todos usam o mesmo Wi-Fi, 10 logins por minuto podem ser pouco no horário de pico. A correção (contar por IP + e-mail) está no plano de infra, junto com levar os contadores para o Postgres antes de ter 2 cópias.
