Repaginação da Tela de Treinos + Tempo Médio e "Última vez feito"
Context
A tela atual de treinos (WorkoutScreen.tsx) usa um layout antigo (cards "programImageMock", grade de exercícios genérica). O design de referência em html/trainScreen/treinar.jsx define uma versão repaginada, alinhada ao design system KINETIC já usado na Home: card com faixa de cor por dia, badge "DIA", badge "Sugestão IA", chips de músculos e uma linha de métricas com três dados — nº de exercícios, tempo médio de conclusão e "Há X dias" desde a última execução — além de um botão "Iniciar treino" em gradiente e um rodapé de disclaimer de IA.

Hoje faltam dois dados no back-end para alimentar esse card:

Tempo médio de conclusão da ficha — o usuário quer que o Gemini estime isso no prompt e devolva por ficha.
Última vez que a ficha foi feita — já é rastreável: WorkoutExecutionLog (user + plano + completionDate) é gravado a cada sessão registrada em WorkoutSessionService.java:82-93. Basta consultar a última execução por plano e expor no contrato.
Decisões do usuário: (a) o card mantém os dois fluxos — tocar no corpo abre o detalhe de exercícios (view DETAIL restilizada) e o botão "Iniciar treino" vai direto pra ActiveSession; (b) fichas legadas sem tempo do Gemini usam o cálculo heurístico já existente como fallback.

Back-end (kinetic-backend)
1. Gemini estima o tempo — prompt + DTO
GeneratedWorkoutPlanDto.java: adicionar campo Integer estimatedDurationMinutes.
GeminiService.java buildPrompt(...):
Adicionar uma regra instruindo a IA a calcular a duração total média em minutos considerando séries, repetições e descansos de cada exercício (incluindo aquecimento), e a retorná-la no campo estimatedDurationMinutes de cada objeto de treino.
Atualizar o exemplo de estrutura JSON (o array dentro do texto bloco """...""") para incluir "estimatedDurationMinutes": 50 em cada objeto, ao lado de title/subtitle/tag/data.
Faixa sugerida no prompt: 30–90 min, coerente com 6–8 exercícios.
2. Persistir na entidade
WorkoutPlan.java: adicionar coluna @Column(name = "estimated_duration_minutes") private Integer estimatedDurationMinutes; (nullable — fichas antigas ficam null e caem no fallback).
WorkoutService.java generateWorkoutForUser(...) (≈ linha 90-95): workoutPlan.setEstimatedDurationMinutes(generatedDto.estimatedDurationMinutes()); ao montar cada WorkoutPlan.
3. Última execução por plano (sem N+1)
WorkoutExecutionLogRepository.java: novo método agregado que retorna a última completionDate por plano do usuário em uma só query:
@Query("SELECT l.workoutPlan.id, MAX(l.completionDate) FROM WorkoutExecutionLog l " +
       "WHERE l.user.id = :userId GROUP BY l.workoutPlan.id")
List<Object[]> findLatestCompletionPerPlan(@Param("userId") UUID userId);
Notas de blindagem (importante)
Planos arquivados/apagados: o filtro WHERE l.user.id = :userId retorna logs de qualquer plano do usuário, mas só consumimos via map.get(plan.getId()) para os planos active da listagem. Planos sem nenhum log simplesmente não entram no map → null → renderiza "Nunca". Comportamento correto, sem tratamento extra.
Cast defensivo do cursor de data: MAX(l.completionDate) pode voltar como java.sql.Timestamp ou LocalDateTime conforme a versão do driver do PostgreSQL. Ao montar o Map<UUID, LocalDateTime> a partir do List<Object[]>, fazer cast defensivo, p.ex.:
Object raw = row[1];
LocalDateTime last = (raw instanceof java.sql.Timestamp ts)
        ? ts.toLocalDateTime()
        : (LocalDateTime) raw;
(chave row[0] é UUID).
4. Expor no contrato da listagem
WorkoutPlanResponseDTO.java: adicionar campos Integer estimatedDurationMinutes e LocalDateTime lastCompletedAt. Substituir/adicionar uma factory que receba o lastCompletedAt:
fromEntity(WorkoutPlan plan, LocalDateTime lastCompletedAt).
estimatedDurationMinutes: usar plan.getEstimatedDurationMinutes(); se null, fallback heurístico reutilizando a mesma fórmula de HomeAggregatorService.java:107-110 — max(20, round(totalSets * 1.2)). Extrair essa fórmula para um helper estático reutilizável (ex.: método em WorkoutPlanResponseDTO ou util compartilhado) para não duplicar.
WorkoutService.java getMyPlans(...) (linha 152-159):
Injetar WorkoutExecutionLogRepository.
Carregar findLatestCompletionPerPlan(user.getId()) num Map<UUID, LocalDateTime>.
Mapear cada plano com WorkoutPlanResponseDTO.fromEntity(plan, map.get(plan.getId())).
lastCompletedAt será serializado como ISO; a formatação "Há X dias / Hoje / Ontem / Nunca" fica no front-end.
Migração de schema: a coluna nova é nullable; com o ddl-auto atual do projeto o Hibernate cria a coluna automaticamente. Confirmar a estratégia no application.properties durante a execução.

Front-end (KineticApp)
5. Contrato de tipos
AuthContext.tsx WorkoutPlanItem (linha 46-54): adicionar estimatedDurationMinutes?: number | null; e lastCompletedAt?: string | null;.
6. Helper de data relativa
Criar/extrair formatRelativeDays(iso?: string | null): string que devolve "Hoje", "Ontem", "Há N dias", "Há N semanas" ou "Nunca" quando null. Existe um timeAgo local em StoryViewer.tsx:27 como referência de estilo — reaproveitar a abordagem num util compartilhado (ex.: src/utils/), e idealmente trocar o timeAgo do StoryViewer para consumir o mesmo util (opcional).
7. Repaginar WorkoutScreen.tsx
Manter a estrutura LIST / DETAIL e os hooks de fetch atuais (fetchWorkoutPlans, useFocusEffect). Trocar só a UI:

View LIST — novo renderWorkoutCard (espelhando treinar.jsx FichaCompacta + FichaBottom):

Paleta de acento por índice/dia (A/B/C ciclando) — mapear os ACCENTS do JSX para os tokens KINETIC (primary, primaryDeep, primaryDim). Reaproveitar expo-linear-gradient como em NextWorkoutCard.tsx.
Faixa superior em gradiente; badge "DIA {tag}"; badge "✦ Sugestão IA" (SVG react-native-svg, não emoji).
Título = item.title; chips de músculos = músculos únicos derivados de item.data (dedup, igual ao LinkedHashSet do back-end), fallback "Corpo inteiro".
Linha de métricas: {n} exercícios · {estimatedDurationMinutes} min · {formatRelativeDays(lastCompletedAt)} (com ícones SVG dumbbell / clock / history como no JSX; estado "Nunca" em cor mais apagada — KINETIC.textMuted).
Botão "Iniciar treino" em gradiente → onPress chama navigation.navigate('ActiveSession', { workoutData: item }) direto.
Tocar no corpo do card (área fora do botão) → openRoutineDetail(item.id) (mantém DETAIL).
Header da seção "SUAS FICHAS" + subtítulo, e rodapé disclaimer de IA (IADisclaimer do JSX) como ListFooterComponent.
View DETAIL: manter a lista de exercícios atual, apenas alinhando cores/tipografia ao KINETIC (ajuste leve; sem mudança de fluxo). O botão "INICIAR TREINO" do footer continua indo pra ActiveSession.

Substituir os estilos hard-coded antigos (programImageMock, etc.) pelos novos; remover estilos órfãos.
Verificação (end-to-end)
Back-end: subir o kinetic-backend (.\mvnw.cmd spring-boot:run) e confirmar que a coluna estimated_duration_minutes é criada.
Geração: gerar uma ficha nova (fluxo de onboarding / POST /api/workouts/generate) e checar no log/responde que cada plano traz estimatedDurationMinutes preenchido pelo Gemini.
Listagem: GET /api/workouts/my-plans deve retornar estimatedDurationMinutes (do Gemini ou heurística) e lastCompletedAt (null em ficha nunca feita).
Última execução: registrar uma sessão (POST de log com workoutPlanId), recarregar my-plans e confirmar que lastCompletedAt mudou e o card mostra "Hoje".
Front-end: rodar o app (Expo), abrir a aba Treinar e validar: card novo, três métricas corretas, "Nunca" em ficha não feita, botão "Iniciar treino" → ActiveSession, toque no card → DETAIL.
Atualizar o grafo: graphify update . após as mudanças.
Arquivos principais
Back: GeneratedWorkoutPlanDto.java, GeminiService.java, WorkoutPlan.java, WorkoutService.java, WorkoutExecutionLogRepository.java, WorkoutPlanResponseDTO.java
Front: AuthContext.tsx, WorkoutScreen.tsx, novo util de data relativa