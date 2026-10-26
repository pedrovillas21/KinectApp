# Retenção de dados e obrigações legais

O que o Kinetic guarda, por quanto tempo e por quê. Os textos públicos (Política de Privacidade e Termos de Uso, em `kinetic-desktop/src/legal/documents.ts`) seguem este arquivo. Se mudar um prazo aqui, mude lá também e troque a versão dos termos (veja "Mudar os termos").

> **Antes do lançamento:** revisar este arquivo, a Política e os Termos com um advogado (LGPD e consumidor) e os prazos fiscais com um contador. Os prazos abaixo são a leitura técnica mais comum da lei, não um parecer.

## Regra geral

- Conta ativa: guardamos o necessário para o serviço funcionar.
- Exclusão da conta (pelo titular no app/painel, ou pelo ROOT a pedido dele): tudo é apagado na hora, menos o que uma obrigação legal ou a defesa em processo exige. Isso que fica não aparece em nenhuma rota da API, usa pseudônimo (HMAC do e-mail/CPF com a `PSEUDONYM_KEY`) quando dá e some sozinho no fim do prazo (`LegalRetentionService.purgeExpired`, todo dia às 3h30).
- A lógica da exclusão está em `AccountDeletionService`; as tabelas de retenção, na migration V49.

## O que fica depois da exclusão

| O quê | Onde | Prazo | Base legal |
|---|---|---|---|
| IP + data/hora de cada acesso (login, renovação de sessão e uso, no máximo 1 por hora por IP) | `access_logs` | 6 meses (para todas as contas, ativas ou não) | Marco Civil, art. 15; LGPD art. 7º, II |
| Nome, e-mail, CPF e celular da conta excluída, para identificar os registros acima numa ordem judicial | `deleted_accounts` (colunas apagadas em `identity_until`) | 6 meses | Marco Civil, arts. 10 e 22; LGPD art. 16, I |
| Pseudônimo do e-mail/CPF, versão e data do aceite dos termos, papel, quem excluiu | `deleted_accounts` | 5 anos | Prova do consentimento (LGPD art. 8º, §2º) e defesa (art. 7º, VI) |
| ID do cliente no gateway de pagamento (personal) | `deleted_accounts.gateway_customer_id` | 5 anos | Conciliação e contestações (Código Civil, art. 206, §5º, I) |
| Bloqueio: conta excluída enquanto BLOQUEADA impede novo cadastro com o mesmo e-mail/CPF | `deleted_accounts.blocked` | 5 anos | Legítimo interesse e prevenção a fraude (arts. 7º, IX e 11, II, g) |
| Mensalidades PAGAS do aluno excluído, no financeiro do personal (só o nome do aluno, valor, mês, data e forma) | `student_charges` (`student_id` nulo, `student_name`, `retain_until`) | Até 31/12 do 6º ano após o pagamento | Registro de renda do personal (CTN, art. 173, I); LGPD art. 16, I |
| Ficha aprovada por IA: declaração do personal, pedido (com as restrições informadas), ficha aprovada, nome e CREF do personal | `ai_plan_generations` (`trainer_name`, `trainer_cref`, `student_ref_hash`, `retain_until`) | 5 anos após a aprovação | Defesa em processo (CDC, art. 27; LGPD arts. 7º, VI e 11, II, d) |

O que **não** fica: treinos, peso, avaliações físicas, anamnese, pausas de alerta, posts, fotos, comentários, conexões, feedbacks, convites, tokens, mensalidades em aberto ou dispensadas, prévias de IA não aprovadas (perdem o texto), assinatura do personal.

### Por que essas escolhas

- **Cobranças:** só as pagas. São a renda que o personal declara; as em aberto não têm obrigação por trás e seriam lembrete eterno de quem já saiu. Quando é o **personal** que exclui a conta, as cobranças saem junto (os dados são dele; o painel oferece "Baixar meus dados" antes).
- **IA:** a declaração ("revisei integralmente... assumo a prescrição") é a prova de que um profissional com CREF prescreveu o treino. Sem ela, numa ação de um aluno lesionado, o Kinetic não teria como mostrar quem respondia pela ficha. O nome do aluno sai da declaração; o pseudônimo permite achar o registro se o próprio aluno for parte no processo.
- **Registros de acesso:** obrigação do Marco Civil para provedor de aplicação constituído como pessoa jurídica, com fins econômicos. Valem para todas as contas, não só as excluídas. A porta lógica de origem não chega ao backend atrás da Cloudflare; ficam IP e data/hora.

## Aceite dos termos

- Cadastro (app, painel do personal, cadastro de empresa): caixa "Li e aceito" obrigatória. No app o texto inclui o consentimento destacado para dados de saúde (LGPD art. 11, I).
- O backend grava `users.terms_version` e `users.terms_accepted_at` (versão em `legal.terms-version`).
- Conta criada por terceiros (empresa cadastra o personal, ROOT cadastra a empresa) ou que aceitou versão antiga: a API responde `403 TERMS_REQUIRED` em tudo, exceto perfil, aceite, exportar e excluir a conta. O app e o painel mostram a tela de aceite. ROOT é isento.

### Mudar os termos

1. Edite `kinetic-desktop/src/legal/documents.ts` e troque `LEGAL_VERSION` e `LEGAL_UPDATED_AT`.
2. Troque `legal.terms-version` em `kinetic-backend/src/main/resources/application.properties` para a mesma data.
3. Publique painel e backend juntos: todos os usuários aceitam de novo no próximo acesso.

## Direitos do titular (LGPD art. 18)

| Direito | Como |
|---|---|
| Acesso e portabilidade | App: Configurações → Exportar meus dados. Painel: Perfil → Baixar meus dados (JSON) |
| Correção | Telas de perfil do app e do painel |
| Eliminação | App: Configurações → Excluir conta. Painel: Perfil → Excluir minha conta. Quem não consegue entrar (ex.: conta bloqueada): pedido por e-mail ao `privacidade@`, e o ROOT exclui em Usuários → Excluir definitivamente |
| Revogação do consentimento | Excluir a conta, ou pedido ao `privacidade@` |
| Informação sobre compartilhamento | Política de Privacidade, seção 4 |

Prazo de resposta a pedidos por e-mail: 15 dias (LGPD art. 19, II).

## Fora do banco

| Onde | O que fica | O que fazer |
|---|---|---|
| Asaas | Cadastro do personal como cliente (nome, e-mail, CPF) e as cobranças | Guardado por obrigação fiscal; consta na Política |
| Supabase | Backups diários (e PITR, no plano pago) | Somem quando o backup expira; consta na Política |
| Resend | Histórico dos e-mails enviados | Retenção do fornecedor; consta na Política |
| Provedor de IA | Idade, peso, altura, objetivo, nível, frequência e condições médicas do pedido (sem nome/e-mail) | Usar plano pago/API com retenção zero e sem treino de modelo (migração Gemini → Haiku já planejada) |
| Logs do backend (Docker) | Sem e-mail nem dado de saúde; IDs de usuário e IPs de erro | Rotação no `docker-compose.yml`: até 3 arquivos de 10 MB por cópia |
