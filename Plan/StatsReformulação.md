Plano: Comparação de evolução entre ciclos de treino (regeneração)
Context
O usuário esperava que, ao regenerar um treino (ProfileScreen → handleRegenerate → POST /workouts/generate), a StatsScreen comparasse os dados acumulados com o plano antigo contra os do plano novo, mostrando evolução ou regressão de acordo com o objetivo. Hoje isso não acontece — e a investigação mostrou que essa lógica nunca foi implementada em nenhuma das pontas:

A StatsScreen faz comparação por período de calendário (este mês vs. mês anterior), calculada no backend em StatsService.getSummary via StatsPeriodParam.previousStartDate(). Não existe conceito de "ciclo de plano".
Ao regenerar, WorkoutService.generateWorkoutForUser apenas arquiva o plano antigo (archiveActivePlans) e cria um novo active. O motor de estatísticas ignora planos — só consulta WorkoutSession/ExerciseSetLog por data. Logo, nada registra quando houve uma regeneração nem quais eram os números naquele momento.
Não há nenhum snapshot/baseline no backend nem no frontend (busca por esses termos retornou só comentários e docs de planejamento).
A percepção de "sobrescreve e não compara" vem disso: o plano antigo some da tela (vira archived) e a comparação exibida continua sendo mês-a-mês, não plano-a-plano.

Decisões do usuário (confirmadas):

Modelo ciclo vs. ciclo — cada regeneração fecha um ciclo; salvar snapshot do ciclo encerrado; comparar ciclo atual (desde a última regeneração) contra o ciclo anterior.
Exibir como novo card na StatsScreen ("Sua Evolução").
Métricas: peso corporal, progressão de carga/volume, dias treinados/aderência, e insight conforme objetivo.
Resultado esperado: após treinar sob um plano e regenerar, o usuário vê um card "Evolução do Plano" comparando o ciclo atual ao ciclo anterior, com indicação de progresso/regressão orientada ao objetivo (hipertrofia, emagrecimento, etc.).

Conceito do ciclo
Um ciclo = janela em que um plano ficou ativo, entre duas regenerações.

Regen #1 (T1) ── plano A ativo ──► Regen #2 (T2) ── plano B ativo ──► hoje
                 [ciclo A: T1→T2]                   [ciclo B: T2→hoje]
No Regen #2, antes de arquivar o plano A, capturamos um snapshot agregando as sessões do ciclo A (T1→T2). Esse snapshot representa o ciclo encerrado.
A StatsScreen compara: ciclo atual ao vivo (T2→hoje, agregado sob demanda) vs. snapshot mais recente (ciclo A).
T2 = createdAt do plano ativo atual. T1 = createdAt do plano que está sendo arquivado.
Primeira geração (onboarding, sem plano ativo anterior) → nenhum snapshot é criado; o card mostra estado vazio.
⚠️ "Ciclo 0" — atenção ao MIN(w.createdAt): num usuário recém-criado no primeiríssimo plano, findEarliestActiveCreatedAt retorna a data do plano atual. Se o serviço tentasse agregar [createdAt, hoje] aí, misturaria dados de um ciclo recém-nascido (ex.: usuário treina no mesmo dia da geração). Regra de ouro: a fonte da verdade para "há comparação possível" é o repositório de snapshots, não o de planos. Se findFirstByUserIdOrderByCycleEndDateDesc retorna vazio → available=false, e o sistema não computa nenhum delta (nem agrega o ciclo atual para comparação). O snapshot do ciclo anterior só passa a existir após a primeira regeneração, então o "Ciclo 0" nunca gera deltas impossíveis.

Backend (kinetic-backend)
1. Nova entidade + migration
models/PlanCycleSnapshot.java — tabela plan_cycle_snapshots:
id UUID (PK), user_id UUID (FK → users, LAZY @ManyToOne)
cycle_start_date DATE, cycle_end_date DATE
goal VARCHAR (objetivo vigente no ciclo encerrado)
end_weight DOUBLE, total_volume DOUBLE
completed_sessions INT, target_sessions INT, adherence_percentage INT
volume_by_muscle TEXT (JSON serializado — opcional, para detalhar carga por grupo). No contrato do endpoint, este campo NÃO trafega como string crua: o PlanEvolutionResponseDTO deve expô-lo como Map<String, Double> (o StatsService desserializa o TEXT do banco com Jackson antes de devolver), e o tipo TS correspondente é Record<string, number> — nunca string. Isso impede que uma string JSON pura quebre os seletores/componentes no front-end.
created_at TIMESTAMP
resources/db/migration/V7__create_plan_cycle_snapshots.sql — seguir convenção do V5__add_status_to_workout_plans.sql (CREATE TABLE IF NOT EXISTS, índice em (user_id, cycle_end_date DESC)).
2. Repositório
repositories/PlanCycleSnapshotRepository.java: Optional<PlanCycleSnapshot> findFirstByUserIdOrderByCycleEndDateDesc(UUID userId).
repositories/WorkoutPlanRepository.java: adicionar consulta para obter o início do ciclo atual — @Query("SELECT MIN(w.createdAt) FROM WorkoutPlan w WHERE w.user.id = :userId AND w.status = 'active'") → Optional<LocalDateTime> findEarliestActiveCreatedAt(UUID userId). (Convive com archiveActivePlans e findByUserIdAndStatus existentes.)
3. Captura do snapshot na regeneração
services/WorkoutService.generateWorkoutForUser (linhas 38–128): a captura deve ocorrer antes de sobrescrever o perfil (linhas 107–117 já mudam goal/weight) e antes de archiveActivePlans (linha 121). Passos:
Logo após findUserByEmail, ler oldGoal = user.getGoal(), oldWeight = user.getWeight() e findEarliestActiveCreatedAt(user.getId()).
Se houver plano ativo (createdAt presente), após o sucesso da geração do Gemini e antes de archiveActivePlans, chamar um novo serviço que agrega o ciclo [createdAt.toLocalDate(), hoje] e persiste o PlanCycleSnapshot com oldGoal/oldWeight.
Como o método é @Transactional, falha do Gemini reverte tudo (inclusive o snapshot) — seguro.
Novo services/PlanCycleSnapshotService.java (ou método privado em StatsService, que já tem os repositórios): agrega reutilizando o que já existe:
sessões: WorkoutSessionRepository.countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(userId, start, end.plusDays(1))
volume total + por grupo: ExerciseSetLogRepository.findVolumeByMuscleGroupBetween(userId, start, end) (mesmo método usado em StatsService.volumeMapFromDB)
peso final: WeightHistoryRepository.findFirstByUserOrderByLoggedAtDesc(user) com fallback para oldWeight
target/aderência: nº de semanas do ciclo × user.getFrequency() (espelhar a fórmula de StatsPeriodParam.targetSessions)
⚠️ Trava de segurança — ciclos curtos (evitar divisão por zero / Infinity%): se o usuário regenerar poucos dias após gerar (ex.: não gostou da divisão), dias/7 arredonda para 0 semanas → targetSessions = 0 → aderência Infinity%. Aplicar guard clause: int weeks = Math.max(1, Math.ceil(diasCorridos / 7.0)); int target = Math.max(frequency, frequency * weeks); e, no cálculo de adherence_percentage, nunca dividir se target <= 0 (retornar 0). Mesma proteção deve existir tanto na captura do snapshot quanto no agregador do ciclo atual em getPlanEvolution.

4. Endpoint de evolução
dtos/PlanEvolutionResponseDTO.java (record):
PlanEvolutionResponseDTO(
  boolean available,            // false se não há snapshot anterior
  boolean currentCycleStarted,  // false se ciclo atual ainda sem sessões
  LocalDate currentCycleStart,
  String goal,
  MetricDeltaDTO weight,        // previous, current, delta, good (orientado ao objetivo)
  MetricDeltaDTO volume,
  MetricDeltaDTO adherence,
  int previousCompletedSessions,
  int currentCompletedSessions,
  StatsInsightDTO insight )     // reutiliza StatsInsightDTO existente
dtos/MetricDeltaDTO.java: (double previous, double current, double delta, boolean good).
good é orientado ao objetivo: peso → delta<0 é bom para emagrecimento, delta>0 para hipertrofia/massa; volume e aderência → maior é melhor.
services/StatsService.java: novo método getPlanEvolution(userEmail) que: lê o snapshot mais recente; se ausente → available=false; senão agrega o ciclo atual [planoAtivo.createdAt, hoje] (mesmos helpers do item 3), monta os MetricDeltaDTO e um insight de evolução/regressão (estender o motor de regras de buildInsight, agora ciente do objetivo).
controllers/StatsController.java: novo @GetMapping("/plan-evolution") → statsService.getPlanEvolution(email). (Espelha o /summary existente; pega o email via SecurityContextHolder.)
Endpoint separado (não embutido em /summary) de propósito: a comparação é independente do seletor de período (semana/mês/3M/ano) e não deve ser recalculada a cada toque no seletor.

Frontend (KineticApp/src)
5. Tipos
src/types/index.ts: adicionar MetricDeltaDTO e PlanEvolutionResponseDTO espelhando os records do backend (seguir o estilo dos DTOs de stats já presentes no arquivo).
6. Card de evolução
Novo src/components/PlanEvolutionCard.tsx (arquivo próprio — StatsScreen.tsx já tem 1115 linhas). Reutiliza:
DeltaChip e os formatadores de src/utils/statsUtils.ts (formatNumberPtBR, formatSignedNumberPtBR, formatSignedPercent, formatTotalVolume) — extrair DeltaChip de StatsScreen.tsx para um ponto compartilhável ou replicar o padrão visual (tokens T).
Mostra três linhas (Peso / Volume / Aderência) com valor anterior → atual e chip de delta colorido por good, mais o bloco de insight (mesmo visual de InsightBlock).
Estados vazios: available=false → "Regenere seu treino para começar a comparar ciclos."; currentCycleStarted=false → "Ciclo recém-iniciado — registre treinos para ver a comparação."
src/screens/StatsScreen.tsx:
Buscar /stats/plan-evolution uma vez no mount (novo useState + useEffect, independente de period), não dentro de fetchStats(period).
Renderizar <PlanEvolutionCard ... /> no topo da lista de cards (logo após InsightBlock, antes de ConsistencyCard).
Arquivos principais
Camada	Arquivo	Ação
BE model	models/PlanCycleSnapshot.java	criar
BE migration	resources/db/migration/V7__create_plan_cycle_snapshots.sql	criar
BE repo	repositories/PlanCycleSnapshotRepository.java	criar
BE repo	repositories/WorkoutPlanRepository.java	+ findEarliestActiveCreatedAt
BE service	services/PlanCycleSnapshotService.java	criar (agregação do ciclo)
BE service	services/WorkoutService.java	capturar snapshot antes de archiveActivePlans
BE service	services/StatsService.java	+ getPlanEvolution e insight ciente do objetivo
BE dto	dtos/PlanEvolutionResponseDTO.java, dtos/MetricDeltaDTO.java	criar
BE controller	controllers/StatsController.java	+ GET /plan-evolution
FE types	KineticApp/src/types/index.ts	+ tipos
FE component	KineticApp/src/components/PlanEvolutionCard.tsx	criar
FE screen	KineticApp/src/screens/StatsScreen.tsx	buscar + renderizar card
Verificação (end-to-end)
Backend sobe (cd kinetic-backend, ./mvnw spring-boot:run); migration V7 aplica sem erro (checar log do Flyway).
Fluxo de dados (via app ou REST client autenticado):
Usuário com plano ativo e algumas WorkoutSession registradas → GET /api/stats/plan-evolution retorna available=false (ainda não houve regeneração).
Regenerar (POST /api/workouts/generate) → confirma que uma linha em plan_cycle_snapshots foi criada com os números do ciclo encerrado (peso/volume/sessões/objetivo antigos).
Registrar novas sessões sob o plano novo → GET /api/stats/plan-evolution agora retorna available=true, com previous* = ciclo antigo e current* = ciclo novo, e good coerente com o objetivo.
Regenerar de novo → novo snapshot; a comparação passa a referenciar o ciclo intermediário.
Frontend (cd KineticApp, npx expo start): abrir StatsScreen → card "Evolução do Plano" renderiza; testar os três estados (sem snapshot / ciclo recém-iniciado / comparação completa). Confirmar que trocar o seletor de período não recarrega/afeta o card.
Regressão: GET /api/stats/summary continua idêntico (comparação por calendário intacta); regeneração segue arquivando o plano antigo normalmente.
Fora de escopo
Não altera a comparação por período de calendário existente (/summary).
Não cria histórico visual de múltiplos ciclos (apenas atual vs. anterior imediato).
EvolutionModal (check-in de peso) permanece como está.