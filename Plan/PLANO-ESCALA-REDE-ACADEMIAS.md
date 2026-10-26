# Plano de escala — Kinetic para uma rede de academias (20 → 36 unidades)

> Escrito em 2026-10-22, a partir do código da branch `implementacaoWeb` (commit `a4ed856`).
> Números de carga e de custo são **estimativas para orientar decisões**. Confirme os preços
> atuais nos sites dos fornecedores e refaça as contas com os dados reais da rede, que você
> vai pedir na primeira reunião (seção 10).

---

## 1. Diagnóstico em uma frase

**O seu problema não é escala de tecnologia; é operação, estrutura multi-unidade e confiabilidade.**
Uma rede de 36 academias é uma carga *pequena* para um backend Spring Boot + Postgres bem
configurado. O que hoje impede você de atender 3 unidades é:

1. o modelo de dados não conhece "rede → unidade";
2. o backend só funciona corretamente com **uma** instância (3 estados guardados em memória) — resolvido em 2026-10-25 (V48), ver seção 3;
3. não há ambiente de homologação, monitoramento, backup testado nem processo de deploy;
4. não existe processo para colocar 2.000 alunos de uma unidade dentro do app num dia;
5. você está sozinho: quem atende o gerente da unidade 14 quando o app trava às 19h?

Redis, partição de banco, sharding, Kubernetes e microsserviços **não resolvem nenhum desses
cinco pontos**. Eles entram no plano mais tarde, com gatilho definido (seção 4.3).

---

## 2. Dimensionamento: quanto de carga é isso?

Hipóteses (troque pelos números reais da rede):

| Item | Valor estimado |
|---|---|
| Alunos por unidade | 1.500 a 3.000 (média 2.500) |
| Alunos na rede com 36 unidades | ~90.000 |
| Adesão ao app (alunos que instalam e usam no mês) | 30 a 50% → **27 a 45 mil usuários/mês** |
| Usuários ativos por dia | ~40% dos mensais → **~15 mil/dia** |
| Pico (18h–21h) | ~25% dos diários na hora de pico → **~4 mil pessoas na mesma hora** |
| Requisições por treino registrado | ~30 (abrir ficha, marcar séries, finalizar, dashboard) |
| Requisições por segundo no pico | 4.000 × 30 / 3.600 ≈ **35 req/s**, rajadas de **~100 req/s** |

Para comparar: **uma** instância Spring Boot com 1–2 vCPU atende centenas de req/s em CRUD
simples, e um Postgres de porte médio atende milhares de consultas indexadas por segundo.
Você está uma ordem de grandeza abaixo do limite de uma arquitetura simples.

**Onde o volume cresce de verdade:** nas tabelas de registro de treino. 15 mil treinos/dia ×
~20 séries ≈ 300 mil linhas/dia ≈ **100 milhões de linhas/ano**. Com índices certos isso é
tranquilo no primeiro ano; partição por mês entra no plano quando passar de ~50–100 milhões
(seção 4.3).

**O outro custo que cresce:** a IA (Gemini). 45 mil usuários gerando fichas sem limite é
problema de **conta**, não de servidor (seção 5.6).

---

## 3. O que trava hoje no código (levantado no repositório)

| # | Onde | Problema | Correção (sem Redis) |
|---|---|---|---|
| 1 | `models/Company.java` | Empresa "plana": só `nome` e `cnpj`. Não existe rede → unidade, nem gerente de unidade vs. diretoria da rede | Modelo multi-unidade (seção 5.1) |
| 2 | `security/AuthRateLimitFilter.java` | Limite por IP **em memória**: com N réplicas o limite vira N×. Pior: numa academia, **200 alunos saem pelo mesmo IP do Wi-Fi** e se bloqueiam no login | Limite por **IP + e-mail**, guardado no Postgres (Bucket4j com backend PostgreSQL, ou tabela própria com `UPDATE` atômico) |
| 3 | `services/TrainerEventService.java` | Conexões SSE do painel em memória: com 2 réplicas, metade dos eventos some | Postgres `LISTEN/NOTIFY` (conexão dedicada, **direta ou pooler em modo sessão**; o modo transação do Supavisor não suporta LISTEN) |
| 4 | `services/WorkoutService.java` (`aiAttempts`) | Limite de geração por IA em memória | Tabela `ai_generation_usage` (por usuário e por unidade/dia) — vira também o controle de custo |
| 5 | `application.properties` | Pool Hikari no padrão (10). Sem conta de `réplicas × pool ≤ limite do pooler` | `spring.datasource.hikari.maximum-pool-size` explícito |
| 6 | `server.forward-headers-strategy` | Desligado; atrás de load balancer todo cliente vira o IP do balanceador | Ligar `native` no ambiente com LB |
| 7 | Infra | Um `docker-compose` com um container. Sem homologação, CI/CD, observabilidade, backup testado | Seção 4 |
| 8 | `AUDITORIA-SEGURANCA.md` | Onda 2 da auditoria não rodou; correções de 2026-10-15 não testadas ponta a ponta nem em produção | Fechar antes do piloto |

**Atualização 2026-10-25:** resolvidos os itens 3 (avisos do painel pela tabela `trainer_events`, lida por todas as cópias: o `LISTEN` não passa pelo pooler em modo transação), 4 (tentativas de IA no Postgres), 6 (`native` no `docker-compose.yml`) e parte do 7 (2 cópias + balanceador + deploy sem queda via `deploy.sh`). Do item 2, os contadores foram para o Postgres (`rate_limit_counters`). Itens 1, 5 e 8 continuam abertos. Detalhes em [CONTEXTO-INFRA-ESCALA.md](CONTEXTO-INFRA-ESCALA.md).

**Atualização 2026-10-26:** resolvidos o item 2 (login limitado por **IP + e-mail**, 5/min no `AuthService`; o limite só por IP no login subiu para 60/min) e o item 5 (`maximum-pool-size=${DB_POOL_SIZE:5}`: 2 cópias × 5 = 10 conexões no pooler em modo sessão). Itens 1 e 8 continuam abertos.

O que **já está certo** e ajuda muito: `open-in-view=false`, ShedLock nos `@Scheduled`,
`ddl-auto=validate` + Flyway, JWT stateless com refresh no banco, URLs assinadas para mídia.
Ou seja: tirando os itens 2, 3 e 4, o backend já é *stateless* e pode ter várias réplicas.

---

## 4. Arquitetura alvo

### 4.1 Desenho

```
                 App (Expo)          Painel web (Rede / Unidade / Professor)
                     │                         │
                     └────────── HTTPS ────────┘
                                 │
                    Load balancer gerenciado (do provedor)
                       │                     │
              ┌────────┴───────┐   ┌─────────┴──────┐
              │ Backend réplica│   │ Backend réplica │   ≥ 2 sempre ligadas, região São Paulo
              │ Spring Boot    │   │ Spring Boot     │   auto-scaling por CPU/latência
              └────────┬───────┘   └─────────┬──────┘
                       │  pooler (Supavisor)  │
                 ┌─────┴──────────────────────┴─────┐
                 │ Postgres (Supabase, sa-east-1)    │──► backup + PITR
                 │ primário                          │──► réplica de leitura (fase 3, relatórios da rede)
                 └───────────────────────────────────┘
       Storage (mídia) + CDN      Gemini (fila + cota)      Resend (e-mail)
       Observabilidade: Sentry (app + backend) · métricas/logs (Grafana Cloud ou similar) · uptime
```

### 4.2 Decisões (com recomendação)

| Componente | Recomendação | Por quê |
|---|---|---|
| **Banco** | Manter **Supabase**, plano Pro + upgrade de compute + **PITR** (restauração para qualquer minuto) | Você já usa; migrar banco agora é risco sem ganho. Confirme que o projeto está em **sa-east-1 (São Paulo)** — se estiver nos EUA, cada consulta paga ~120 ms de ida e volta e uma tela com 10 consultas fica lenta. Migrar de região é o primeiro item técnico |
| **Backend** | Container gerenciado em São Paulo: **Google Cloud Run (southamerica-east1)** ou **Fly.io (gru)**. Alternativa mais "enterprise": AWS ECS Fargate + ALB em sa-east-1 (mesmo datacenter do Supabase, mais trabalho de operação) | Load balancer, TLS, health check e auto-scaling vêm prontos. Você **não** deve operar nginx/Kubernetes sozinho. No Cloud Run: `min-instances=2` e CPU sempre alocada (os `@Scheduled` e o SSE precisam) |
| **Load balancer** | O do provedor | Já incluso; nada a configurar além de health check em `/health` (já existe no backend) |
| **Cache / Redis** | **Não agora.** Postgres resolve rate limit, eventos e cotas | Ver gatilhos abaixo |
| **Fila** | Tabela no Postgres (`SELECT … FOR UPDATE SKIP LOCKED`) para geração por IA e importações | Volume baixo; zero infraestrutura nova |
| **Mídia** | Supabase Storage + redimensionar/comprimir no app antes do upload | Controla o custo de egress do feed social |
| **App mobile** | **EAS Update** (atualização OTA de JS) + endpoint de versão mínima para forçar update | Corrigir bug para 40 mil pessoas sem esperar revisão da loja |

### 4.3 Quando adotar cada tecnologia "de escala" (gatilhos, não datas)

| Tecnologia | Adote quando… | Solução intermediária até lá |
|---|---|---|
| **Redis gerenciado** (Upstash / Memorystore / ElastiCache) | > 4 réplicas e o rate limit/eventos no Postgres aparecerem nas métricas; ou dashboards da rede ficarem caros mesmo com tabelas de resumo | Postgres (itens 2–4 da seção 3) |
| **Réplica de leitura** | Relatórios da diretoria (36 unidades) competindo com o app no horário de pico | Tabelas de resumo atualizadas por job noturno com ShedLock |
| **Partição de tabela** (por mês, `pg_partman`) | Tabelas de séries/sessões > 50–100 milhões de linhas, ou limpeza/arquivamento lentos | Índices compostos `(user_id, data)` e `(unit_id, data)`; `EXPLAIN ANALYZE` nas 10 consultas mais lentas |
| **Sharding / banco por cliente** | Provavelmente nunca nesta escala. Só se um contrato exigir isolamento físico de dados — e aí é **cobrado à parte** | `unit_id`/`network_id` em todas as tabelas + testes de isolamento |
| **Microsserviços / Kubernetes** | Quando houver um time com várias equipes. Não é o seu caso | Monólito modular (o que você já tem) |

---

## 5. Mudanças de produto e código

### 5.1 Modelo multi-unidade

Hoje: `ROOT → EMPRESA (company_id) → PERSONAL → ALUNO`. Para uma rede:

```
ROOT (você, Kinetic)
 └─ REDE (franqueado/diretoria: vê as 36 unidades, relatórios consolidados)
     └─ UNIDADE (gerente da unidade: vê só a sua)
         └─ PROFESSOR (instrutor da academia — hoje "PERSONAL" com source=COMPANY)
             └─ ALUNO
```

- Tabelas `networks` e `units` (`units.network_id`); `companies` vira a rede ou é migrada para ela.
- `users.unit_id` (aluno e professor pertencem a uma unidade; aluno pode **transferir**).
- Papel por vínculo, não só em `users.role`: tabela `memberships(user_id, scope_type, scope_id, role)` — um gerente pode cuidar de 2 unidades; um professor pode dar aula em 2.
- **Toda** consulta do painel filtrada por escopo no serviço (como o `EmpresaService` já faz por `company_id`) + **teste automatizado de isolamento** por endpoint ("gerente da unidade A pede aluno da unidade B → 404").
- Migrations novas com RLS ligado (regra do projeto).
- `unit_id` nos logs estruturados e nas métricas, para enxergar "a unidade 14 está com erro".

### 5.2 Entrada dos alunos (o maior risco operacional)

Ninguém vai cadastrar 2.500 alunos à mão. Três caminhos, em ordem de esforço:

1. **Importação por planilha** (CSV exportado do sistema de gestão da academia): nome, e-mail, celular, CPF opcional, status da matrícula. Processada em fila, com relatório de erros. **Obrigatório para o piloto.**
2. **Código de convite da unidade** (QR na recepção/catraca): o aluno baixa o app, digita o código e cai na unidade certa. Você já tem `TrainerInviteCodeService`; estender para unidade.
3. **Integração com o ERP da rede** (sistemas de gestão de academia usados no Brasil — pergunte qual é o deles): sincronizar matrícula ativa/cancelada. Faça **depois** do piloto, quando souber qual sistema e se ele tem API. Aluno com matrícula cancelada perde acesso aos recursos da rede.

### 5.3 Recursos que a rede vai pedir (prepare a resposta, não implemente antes de perguntar)

- Painel da **diretoria**: adesão ao app por unidade, alunos ativos, frequência, alunos em risco de cancelar (sem treinar há X dias). **Retenção é o que paga a conta da academia** — é o seu argumento de venda.
- Painel do **gerente**: professores, carteira de cada um, alunos sem ficha, fichas vencidas.
- **Marca da rede** no app (logo/cores por rede, carregados no login) — muito mais barato que um app próprio na loja. App com marca própria ("white label") = produto separado, cobrado à parte.

### 5.4 Confiabilidade

- Ambientes: **dev → homologação → produção**, cada um com banco próprio. Nunca testar na produção da rede.
- CI/CD (GitHub Actions): build + testes + migração Flyway em homologação → deploy em produção com aprovação manual. Deploy sem downtime (réplicas trocadas uma a uma; migrations sempre compatíveis com a versão anterior do código).
- Backup: PITR ligado **e um teste de restauração por mês** (backup não testado não existe).
- Monitoramento: Sentry (crashes do app e exceções do backend), Spring Actuator + Micrometer (latência p95, erros, pool de conexões), monitor de uptime externo, alerta no seu celular.
- **Teste de carga** com k6 antes do piloto e antes de cada onda: cenário de pico = 2× o estimado. Meta: p95 < 300 ms e erro < 0,5%.
- Feature flags por unidade: ligar um recurso novo só no piloto antes de liberar para a rede.

### 5.5 Segurança e LGPD

- **Avaliação física, peso, medidas e anamnese são dados de saúde = dado pessoal sensível** (LGPD art. 11). Exige base legal adequada, consentimento claro no app, controle de acesso por escopo e registro de quem acessou.
- Papéis LGPD: a **academia é controladora** dos dados dos alunos; **você é operador**. Isso vai num anexo do contrato (DPA): finalidade, subcontratados (Supabase, Google, Resend, Sentry), localização dos dados, incidentes, exclusão ao fim do contrato.
- Fechar a onda 2 da auditoria de segurança e testar ponta a ponta as correções de 2026-10-15 **antes** do piloto. Uma rede desse porte pode pedir pentest externo — tenha orçamento previsto.
- Gemini: use a **API paga**. Confira os termos — no nível gratuito o Google pode usar o conteúdo para melhorar produtos, o que é incompatível com dados de saúde de clientes.

### 5.6 IA com custo controlado

- Cota por aluno/dia e por unidade/mês (tabela da seção 3, item 4); a cota da unidade entra no contrato.
- Geração **assíncrona** (fila no Postgres): o app mostra "gerando sua ficha" e recebe o resultado; picos não seguram threads do servidor.
- Na academia, o fluxo natural é **IA sugere → professor revisa e aprova**. Isso reduz chamadas e é o diferencial que a pesquisa de mercado apontou.
- Medir o custo de IA por unidade/mês desde o piloto: ele entra no preço.

---

## 6. Implantação: devagar no começo, rápido depois

Sim, **uma de cada vez no início** — não por limite técnico, mas porque cada unidade nova testa
o processo (importação, treinamento dos professores, suporte). Depois que o processo está
documentado, ondas maiores.

| Onda | Unidades | Duração | Critério para seguir |
|---|---|---|---|
| **0. Preparação** | — | 5–6 semanas | Checklist da seção 9 completo |
| **1. Piloto** | 1 (unidade média, gerente engajado) + 1 unidade de **controle** sem o app | 8 semanas | Metas de piloto atingidas (abaixo); zero incidente grave nas últimas 3 semanas |
| **2** | +3 | 4 semanas | Implantação feita pelo *playbook*, sem você presente fisicamente |
| **3** | +6 | 4 semanas | Suporte respondendo dentro do SLA; teste de carga para 10 unidades ok |
| **4** | restante das 20 (em lotes de 5) | 6–8 semanas | — |
| **Contínuo** | cada unidade nova das 36 entra já na inauguração | — | Playbook de unidade nova |

**Metas do piloto** (combinar *por escrito* com o empresário antes de começar):
- ≥ 30% dos alunos ativos com o app instalado e logado em 60 dias;
- ≥ 70% dos professores da unidade montando fichas pelo painel;
- treinos registrados por semana (meta a definir com a base);
- **churn da unidade piloto vs. unidade de controle** — é esse número que vende as outras 35.

**Calendário:** hoje é 22/10/2026. Preparação até ~começo de dezembro, piloto em dezembro
(temporada calma) e janeiro (pico de matrículas novas — ótimo teste real de carga e de
importação). **Não implante unidades novas na segunda quinzena de janeiro**: recepção lotada,
ninguém tem tempo para treinamento. Ondas 2–4 de fevereiro a maio.

**Playbook de implantação de uma unidade** (vira documento e checklist):
1. D-14: receber planilha de alunos e professores; validar e importar em homologação.
2. D-7: treinamento de 1 h com professores (gravado) + escolher um professor "multiplicador".
3. D-3: importar em produção; QR codes impressos na recepção.
4. D0: lançamento (você ou o implantador presente na primeira semana das ondas 1–2).
5. D+7 e D+30: reunião de acompanhamento com o gerente, com o painel de adesão aberto.

---

## 7. Lado do negócio

### 7.1 Estrutura

- **CNPJ** antes de assinar qualquer coisa (LTDA/SLU; enquadramento no Simples Nacional para software — Anexo III ou V conforme o fator R — **pergunte a um contador**).
- **Contrato revisado por advogado.** Você licencia o uso do software (SaaS); **não vende o código**. Propriedade intelectual continua sua.
- Exclusividade: evite. Se o empresário exigir (ex.: "não venda para a concorrente da cidade"), limite a região e o prazo e **cobre por ela**.

### 7.2 Modelo comercial

Recomendação: **mensalidade por unidade** (simples de entender para franquia) com faixa por
número de alunos ativos, **+ taxa de implantação por unidade**, contrato de 12 meses.

Como chegar no preço — ancore no **valor de retenção**, não nos concorrentes de personal
(MFIT a partir de R$ 10,90/mês não é sua referência aqui):

> Exemplo hipotético: unidade com 2.000 alunos, mensalidade média de R$ 120.
> Reter **1%** a mais de alunos por mês = 20 alunos × R$ 120 = **R$ 2.400/mês** de receita salva por unidade.
> Uma mensalidade de uma fração disso se paga sozinha — e a unidade de controle do piloto é a prova.

Pacote sugerido:
- **Piloto pago com desconto** (nunca de graça: quem não paga não se compromete com o treinamento). Desconto do piloto abatido se assinar a rede.
- Preço escalonado por onda (as primeiras unidades pagam o preço cheio; volume dá desconto progressivo).
- Cota de IA inclusa por unidade; excedente cobrado.
- Itens à parte: integração com o ERP, app com marca própria, isolamento físico de dados, pentest exigido pelo cliente, customizações.

### 7.3 Riscos de negócio

| Risco | Mitigação |
|---|---|
| **Concentração**: um cliente = quase toda a sua receita | Aviso prévio de 90 dias para rescisão; produto genérico (nada de "fork" para eles); continuar vendendo para personais e academias pequenas |
| **Armadilha da customização**: cada pedido vira código só deles | Todo pedido entra no roadmap do produto ou é orçado à parte |
| **Franqueadora**: se ele é franqueado de uma marca, o contrato de franquia pode restringir apps de terceiros ou uso de dados dos alunos | Pergunte na primeira reunião (seção 10) |
| **"E se você sumir?"** (você é dev solo) | Documentação, ambientes reproduzíveis, e — se pedirem — *escrow* de código (código depositado com terceiro, liberado só se você encerrar o serviço) |
| **Incidente às 19h numa segunda** | SLA realista no contrato (ex.: 99,5% de disponibilidade, resposta a incidente crítico em 1 h no horário comercial estendido) + plantão definido |

### 7.4 Time

Você não opera 20–36 unidades sozinho. Com o contrato assinado (e o caixa dele):
1. **Implantação/suporte** (CS), meio período no começo: treina professores, atende gerentes, faz as importações. É a primeira contratação — libera você para o código.
2. **Dev pleno** (backend ou mobile) a partir da onda 3.
3. Contador e advogado como serviços avulsos.

Canal de suporte: WhatsApp Business para gerentes + central de ajuda com vídeos curtos para alunos e professores. Registre todo chamado (vira backlog e base do SLA).

---

## 8. Custos mensais de infraestrutura (ordem de grandeza)

| Item | Faixa estimada (US$/mês) | Observação |
|---|---|---|
| Supabase Pro + compute médio | 25 + ~60–110 | Subir o compute conforme métricas |
| PITR (backup contínuo) | ~100 | Não economize aqui com dados de saúde de 40 mil pessoas |
| Backend (2–4 réplicas, São Paulo) | 50–200 | Depende do provedor e de CPU sempre alocada |
| Sentry + observabilidade + uptime | 0–80 | Níveis gratuitos cobrem o piloto |
| E-mail (Resend) | 0–20 | |
| Gemini | variável | **Medir no piloto** e repassar no preço |
| Contas de loja (Apple + Google) | ~10 | Apple anual, Google taxa única |
| **Total sem IA** | **~US$ 250–500/mês** para a rede inteira | Muito abaixo do que uma unidade paga |

---

## 9. Checklist "pronto para a unidade 1"

**Técnico**
- [ ] Supabase em sa-east-1, plano pago, PITR ligado, restauração testada
- [ ] Backend em São Paulo com ≥ 2 réplicas atrás do LB, `forward-headers-strategy=native`, pool Hikari explícito (réplicas, `native` e pool já feitos; falta São Paulo)
- [x] Rate limit, SSE e cota de IA fora da memória (Postgres); rate limit por IP + e-mail
- [ ] Modelo rede/unidade + papéis REDE/UNIDADE/PROFESSOR + testes de isolamento
- [ ] Importação de alunos por planilha + código/QR da unidade
- [ ] Homologação separada; CI/CD com deploy sem downtime
- [ ] Sentry no app e no backend; métricas p95/erros; uptime com alerta no celular
- [ ] k6: pico 2× estimado com p95 < 300 ms
- [ ] Auditoria de segurança onda 2 fechada; fluxo de reset de senha testado ponta a ponta
- [ ] EAS Update + versão mínima obrigatória no app
- [ ] Gemini em API paga, geração assíncrona com cota

**Negócio**
- [ ] CNPJ, contador, conta PJ
- [ ] Contrato SaaS + DPA (LGPD) + SLA revisados por advogado
- [ ] Proposta de piloto com metas escritas e unidade de controle
- [ ] Termos de uso e política de privacidade do app atualizados (dados de saúde)
- [ ] Playbook de implantação + vídeos de treinamento
- [ ] Canal de suporte e plantão definidos

### Cronograma da preparação (6 semanas a partir de 22/10/2026)

| Semana | Técnico | Negócio |
|---|---|---|
| 1 | Região do Supabase, plano pago, PITR; homologação; Sentry | Reunião de descoberta (seção 10); CNPJ |
| 2 | Estados em memória → Postgres; pool; LB com 2 réplicas | Proposta de piloto |
| 3 | Modelo rede/unidade + papéis + testes de isolamento | Contrato + DPA com advogado |
| 4 | Importação por planilha; QR da unidade; painel do gerente (mínimo) | Assinatura do piloto; escolha das unidades piloto/controle |
| 5 | CI/CD; geração de IA assíncrona com cota; EAS Update | Playbook + vídeos de treinamento |
| 6 | k6 + correções; auditoria onda 2; ensaio de implantação em homologação com a planilha real | Treinamento dos professores da unidade piloto |

---

## 10. Perguntas para a reunião com o empresário

Sem essas respostas, qualquer preço ou prazo é chute:

1. Ele é **dono de uma rede própria** ou **franqueado de uma marca**? A franqueadora tem regras sobre apps e dados dos alunos?
2. Quantos **alunos ativos** por unidade (mínimo, média, máximo)? Quantos professores?
3. Qual **sistema de gestão** (ERP/catraca) a rede usa? Tem API ou exporta planilha?
4. Qual o **problema número 1** que ele quer resolver: retenção, padronizar o trabalho dos professores, vender personal, experiência do aluno?
5. Quem decide e quem vai **usar** o painel (diretoria, gerentes, professores)?
6. Ele já usa algum app de treino? O que não funcionou?
7. Expectativa de **prazo** para a rede inteira e de **orçamento** por unidade.
8. Exigências de TI/jurídico: SLA, pentest, onde os dados ficam, LGPD.
9. Ele aceita **piloto com unidade de controle** e metas por escrito?
10. As 16 unidades novas abrem quando? (define o ritmo do "contínuo")
