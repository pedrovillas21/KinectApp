# Contexto: escala para rede de academias e infraestrutura (conversa de 2026-10-22)

> Resumo para retomar a conversa. O plano completo de negócio + TI está em
> [PLANO-ESCALA-REDE-ACADEMIAS.md](PLANO-ESCALA-REDE-ACADEMIAS.md).

## 1. Situação

- Um empresário com rede de academias (~20 unidades, indo para ~36) se interessou pelo Kinetic.
- Objetivo atual: **gastar o mínimo possível até haver contrato**. Custos pagos entram quando o piloto for assinado e vão para o preço.

## 2. Conclusões principais

- **A carga é pequena.** Estimativa para 36 unidades: ~35 req/s no pico (rajadas ~100). Um Spring Boot + Postgres aguenta isso.
- **Redis, partição de banco e sharding não são necessários agora.** Entram só com gatilho (seção 4.3 do plano).
- **Os bloqueios reais:** modelo rede → unidade inexistente (`Company` é plana), 3 dados em memória (resolvido em 2026-10-25), falta de operação (homologação, monitoramento, backup testado), importação de alunos e o fato de você estar sozinho.
- **Implantação:** piloto com 1 unidade + 1 unidade de controle (dez/jan), depois ondas de 3, 6 e lotes de 5. Não implantar na segunda quinzena de janeiro.
- **Negócio:** CNPJ, contrato SaaS + anexo LGPD (dados de saúde são sensíveis), piloto pago com metas escritas, preço por unidade ancorado em retenção, perguntar se ele é franqueado de uma marca.

## 3. Arquitetura: conceitos esclarecidos

- **Hoje:** 1 backend (1 container) → 1 Postgres no Supabase. Tudo funciona corretamente.
- **Futuro:** 2+ cópias do backend (containers da **mesma imagem**, mesmo `.env`) atrás de um load balancer, todas no **mesmo banco**. Não existem "dois Postgres"; o banco não é copiado.
- **Load balancer:** vem pronto da plataforma de hospedagem (Cloud Run, Fly.io etc.). Você não monta.
- **Réplica de leitura do Supabase:** só no futuro, se relatórios pesarem. É ligada no painel do Supabase, sem cópia manual.

### Os 3 dados em memória (só viram problema com 2+ cópias)

Tabela da análise original; a correção que foi feita está no status logo abaixo.

| Onde | Problema com 2 cópias | Correção proposta |
|---|---|---|
| `security/AuthRateLimitFilter.java` | Limite de login vira 5 × nº de cópias; alunos da mesma academia dividem o IP do Wi-Fi | Tabela no Postgres; limite por **IP + e-mail** |
| `services/TrainerEventService.java` (SSE) | Aviso do painel some se cair na cópia errada | Postgres `LISTEN/NOTIFY` (conexão direta ou pooler em modo sessão) |
| `services/WorkoutService.java` (`aiAttempts`) | Cota de IA contada por cópia e zerada no deploy | Tabela de uso de IA (também serve de controle de custo por unidade) |

**Status: implementado em 2026-10-25** (migration V48), junto com as 2 cópias na VM:
- Rate limit e tentativas de IA: tabela `rate_limit_counters` (`PostgresRateLimiter`). Login limitado por **IP + e-mail** (5/min, no `AuthService`) desde 2026-10-26; o limite só por IP no login subiu para 60/min.
- Avisos do painel: tabela `trainer_events`, lida a cada segundo por cada cópia. Foi usada uma tabela em vez de `LISTEN/NOTIFY` porque o `LISTEN` não funciona pelo pooler em modo transação do Supabase.

## 4. Supabase: migração para São Paulo (em andamento)

- Projeto atual: `qdwheebglgcmyrqriiol`, região **us-west-2** (EUA) → latência alta. A região não muda em projeto existente; é preciso criar outro e migrar.
- A conta pessoal já tem 2 projetos (trabalho + Kinetic), então foi criada **uma conta nova só do Kinetic** (Gmail gratuito por enquanto; domínio próprio quando fechar com a rede).
- O plano pago (Pro + PITR) **só quando o piloto for assinado**, 2–3 semanas antes da primeira unidade.
- O login é JWT próprio (não usa Supabase Auth): os usuários migram junto com as tabelas.

**Kit pronto em `kinetic-backend/scripts/migracao-supabase/`:**
- `README.md`: roteiro (preparação → ensaio com o antigo no ar → virada de minutos).
- `copiar-storage.mjs`: copia os buckets `avatars` e `social-media` (simulação sem argumento, `--executar` para copiar). Só a sintaxe foi verificada; ainda não rodou de verdade.
- `pos-restauracao.sql`: corrige `users.avatar_url` (guarda a URL completa com o domínio do projeto) e reaplica o bloqueio de `anon`/`authenticated` + RLS.
- `contar-linhas.sql`: compara linhas por tabela nos dois projetos.
- `.env.migracao.example` (copiar para `.env.migracao`, que é ignorado pelo git); `*.dump` adicionado ao `.gitignore`.
- `pg_dump`/`pg_restore` via Docker (`postgres:17`), usando o **session pooler** (a conexão direta é só IPv6).

**Próximo passo do usuário:** criar o projeto em São Paulo, os buckets (`avatars` público, `social-media` privado), abrir o Docker Desktop, preencher `.env.migracao` e anotar host/usuário do session pooler. Depois, fazer o ensaio com acompanhamento.

## 5. Hospedagem (decisões)

| Peça | Agora (grátis) | Quando houver piloto pago |
|---|---|---|
| Painel web (`kinetic-desktop`) | **Cloudflare Pages** (build pelo próprio Pages; root `kinetic-desktop`, build `npm run build`, output `dist`, `VITE_API_URL`, watch path `kinetic-desktop/*`) | Igual |
| Backend Java | **Oracle Cloud Always Free**, VM ARM em São Paulo, 2 cópias + balanceador (Caddy) via `docker-compose`, HTTPS via Cloudflare Tunnel (`cloudflared` já instalado) | Cloud Run (southamerica-east1) com 2 instâncias sempre ligadas |
| Banco/Storage | Supabase gratuito em sa-east-1 | Supabase Pro + PITR |

- O Cloudflare Pages **não roda o backend** (só sites estáticos/Workers JS).
- Descartados: Cloud Run grátis (desliga ocioso; partida lenta do Spring e problema com `@Scheduled`/SSE), Render grátis (dorme, 512 MB, sem região BR), Fly.io (sem plano grátis para contas novas, pelo que se sabe).
- Cuidado na Oracle: imagem `arm64`; a Oracle pode recuperar VMs ociosas; às vezes falta capacidade.

## 6. Deploy do backend na VM

1. **Começo (manual):** SSH → `kinetic-backend/deploy.sh` (faz `git pull`, monta a imagem e recria uma cópia por vez, esperando o `/health` da nova; deploy key se o repositório for privado). O Flyway aplica as migrations no boot da primeira cópia.
2. **Depois (GitHub Actions):** push na `main` com filtro `kinetic-backend/**` → build → envia para a VM → reinicia.

Cotas conferidas em 2026-10-22 ([docs](https://docs.github.com/en/billing/concepts/product-billing/github-actions)): GitHub Free, repositório privado = **2.000 min/mês**, **500 MB** de artefatos/Packages, 10 GB de cache por repositório; público = grátis. Estimativa: ~150–200 min/mês.
- 500 MB é pouco para imagens Docker → preferir **enviar só o `.jar` por SSH** e montar a imagem na VM.
- Existe runner Linux arm64 padrão; confirmar se entra na cota gratuita em repositório privado (evitaria emular ARM).

Cuidados: durante o deploy a versão nova e a antiga rodam juntas por até um minuto, então **migrations precisam ser compatíveis com a versão anterior** (adicionar coluna/tabela é ok; renomear ou apagar coluna em uso, só em dois deploys). Testar migrations antes; manter a forma de voltar versão (commit/imagem anterior).

## 7. E se o banco cair?

O banco é o ponto único de falha: se o Postgres cair, o backend e o app param. São dois riscos diferentes:

**Perder dados (o grave): resolver barato e já.**
- Backup diário **fora do Supabase**: GitHub Actions agendado roda `pg_dump` e guarda o arquivo no Cloudflare R2 (cota gratuita). Gasta poucos minutos da cota do Actions.
- **Teste de restauração mensal**: restaurar o dump num projeto vazio e conferir com `contar-linhas.sql`.
- No piloto pago: **PITR** do Supabase (voltar para qualquer minuto; cobre um `DELETE` errado).

**Ficar fora do ar: reduzir o impacto no app em vez de tornar o banco "imortal".**
- O app já guarda as telas em cache (`useFocusResource` + `StaleBanner`): a ficha continua aparecendo.
- Falta **registrar o treino offline**: séries numa fila no celular, enviadas quando o servidor volta. Uma queda às 19h vira "sincronizando…".
- **Página de status** + **roteiro de incidente** escrito (restaurar o último backup num projeto novo e trocar o `.env`).

**Banco com failover automático** (AWS RDS Multi-AZ, Cloud SQL HA): o custo do banco praticamente dobra. Pelo que se sabe, os planos comuns do Supabase têm réplica de leitura, mas não failover automático (confirmar). Só se a rede exigir SLA alto e pagar à parte.

| Quando | O quê | Custo |
|---|---|---|
| Logo após a migração | Backup diário externo (Actions → R2) + teste de restauração | Grátis |
| Antes do piloto | Treino offline no app + roteiro de incidente | Seu tempo |
| Piloto assinado | PITR + página de status | Pago, repassado no preço |
| Se o contrato exigir | Banco com failover automático | ~2× o banco, cobrado à parte |

No contrato, prometer o que a estrutura entrega (ex.: "perda máxima de dados de 24 h; restauração em até X horas"), nunca "não cai".

## 8. Pendências (ordem sugerida)

1. [ ] Migração do Supabase para São Paulo (ensaio → virada).
2. [ ] Backup diário externo (Actions → Cloudflare R2) + primeiro teste de restauração.
3. [ ] VM Oracle + Docker + Cloudflare Tunnel (túnel criado em 2026-10-25); `deploy.sh` pronto, falta subir.
4. [ ] Painel no Cloudflare Pages.
5. [x] Tirar os 3 dados da memória (Postgres). Feito em 2026-10-25.
6. [ ] Modelo rede/unidade + papéis + testes de isolamento; importação de alunos por planilha/QR.
7. [ ] Treino offline no app + roteiro de incidente + página de status.
8. [ ] Workflow de deploy no GitHub Actions.
9. [ ] Negócio: reunião de descoberta (perguntas na seção 10 do plano), CNPJ, contrato, proposta de piloto.
10. [ ] Privacidade e LGPD fora do código: canal `privacidade@`, revisão jurídica dos Termos/Política, CNPJ nos textos, DPAs dos fornecedores, plano de incidente ([PROTECOES-FORA-DO-CODIGO.md](../PROTECOES-FORA-DO-CODIGO.md), seção 5). O código (retenção legal, registros de acesso, aceite dos termos) foi feito em 2026-10-25 (V49).
11. [x] Pool do banco explícito: `maximum-pool-size=${DB_POOL_SIZE:5}`. Pooler em modo sessão no Nano (15 vagas): 2 × 5 = 10, sobram 5. Feito em 2026-10-26.
