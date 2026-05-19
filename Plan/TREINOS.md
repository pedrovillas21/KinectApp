# Plano de Implementação: Back-end da Home & Lógica de Fichas Dinâmicas (Kinetic App)

Este guia orienta a implementação da inteligência do back-end em Java Spring Boot para alimentar o padrão BFF (Backend-For-Frontend) da tela inicial do Kinetic. 

A regra central é a **Progressão Fluida**: o treino exibido não é travado pelo dia do calendário. Assim que um treino é marcado como concluído, a fila avança e a próxima ficha fica imediatamente disponível para início, permitindo múltiplas sessões no mesmo dia (aderência > 100%).

---

## 1. Persistência de Dados (JPA/Hibernate)

### 1.1. Alterações na Entidade `User`
Adicionar a flag que controla o redirecionamento ou exibição do prompt de onboarding na Home.
* **Campo:** `private Boolean workoutOnboardingCompleted = false;`
* **Mapeamento:** `@Column(name = "workout_onboarding_completed", nullable = false)`

### 1.2. Entidade de Log: `WorkoutExecutionLog`
Rastreia cada ficha realizada pelo usuário para calcular a ordem e as métricas.
* **Campos Essenciais:**
    * `id` (Long, PK)
    * `userId` (Long, FK)
    * `workoutId` (Long, FK - ID da ficha específica realizada)
    * `completionDate` (LocalDateTime - Data e hora exata do término)
    * `durationMinutes` (Integer)

---

## 2. Motor de Busca de Treinos (`WorkoutService`)

### 2.1. Lógica do Algoritmo "Próxima Ficha Pendente"
Para suportar o avanço instantâneo sem travas temporárias, a busca deve avaliar a **sequência de execução**, ignorando se os treinos ocorreram no mesmo dia.

* **Assinatura do Método:** `public WorkoutDTO getNextPendingWorkout(Long userId)`
* **Fluxo do Algoritmo:**
    1. Buscar a lista de todas as fichas ativas no programa atual do usuário (Ex: `[Ficha A, Ficha B, Ficha C]`), ordenadas por uma ordem sequencial predefinida.
    2. Buscar o último registro na tabela `WorkoutExecutionLog` para o `userId` ordenado por `completionDate DESC` (limite 1).
    3. **Condicional de Decisão:**
        * *Caso 1 (Histórico Vazio):* Se o usuário nunca treinou ou não há logs, retornar a **Ficha A** (primeira da lista).
        * *Caso 2 (Histórico Ativo):* Se houver log, extrair o `workoutId` do último treino executado.
    4. Localizar o índice deste último `workoutId` dentro da lista de fichas ativas.
    5. Definir o próximo índice: `proximoIndice = (indiceUltimoExecutado + 1) % listaDeFichas.size()`.
    6. Retornar a ficha correspondente ao `proximoIndice`.

> **Nota Arquitetural:** Como essa consulta roda em tempo real a cada requisição ao dashboard, assim que o endpoint de finalizar treino inserir um novo registro em `WorkoutExecutionLog`, a próxima chamada ao `GET /home/dashboard` calculará automaticamente o novo índice, fazendo a interface avançar instantaneamente para a próxima ficha.

---

## 3. Arquitetura do Contrato BFF (`HomeDashboardResponseDTO`)

Criar as estruturas necessárias (Java Records ou Classes POJO) para mapear perfeitamente o payload unificado consumido pelo front-end (`src/types/index.ts`).

```java
public record HomeDashboardResponseDTO(
    Boolean workoutOnboardingCompleted,
    String userFirstName,
    Integer streakDays,
    NextWorkoutDTO nextWorkout,
    AdherenceDTO adherence,
    List<RankingItemDTO> ranking,
    List<WeeklyActivityDTO> weeklyActivity
) {}

public record NextWorkoutDTO(
    Long workoutId,
    String title,
    String divisionTag, // Ex: "PUSH - DIA 3 DE 5"
    Integer estimatedMinutes,
    Integer exerciseCount,
    String targetMuscles // Ex: "Peito, Tríceps, Ombro"
) {}
4. Camada de Orquestração (HomeAggregatorService)
Criar um serviço unificado que atua como fachada/agregador para compor o DTO da Home em uma única consulta, reduzindo a latência do aplicativo.

Classe: HomeAggregatorService

Injeções de Dependência: UserService, WorkoutService, StatsService, RankingService.

Método Principal: public HomeDashboardResponseDTO buildDashboardData(Long userId)

Lógica interna:

Buscar dados básicos do usuário (Nome, flag de onboarding).

Se workoutOnboardingCompleted for false, retornar o DTO apenas com as informações cadastrais básicas (demais blocos populados com objetos vazios/estruturados para o fallback do front).

Se true, invocar workoutService.getNextPendingWorkout(userId) para preencher o nextWorkout.

Invocar statsService para calcular o streak atual, a aderência mensal e agrupar os minutos treinados nos últimos 7 dias.

Invocar rankingService para retornar a lista mockada/calculada da Arena semanal.

5. Exposição da API (HomeController)
Endpoint: GET /api/home/dashboard

Segurança: Requer token JWT ativo (recuperar usuário autenticado via contexto de segurança).

Java
@RestController
@RequestMapping("/api/home")
public class HomeController {

    private final HomeAggregatorService homeAggregatorService;

    public HomeController(HomeAggregatorService homeAggregatorService) {
        this.homeAggregatorService = homeAggregatorService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<HomeDashboardResponseDTO> getDashboard(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        HomeDashboardResponseDTO data = homeAggregatorService.buildDashboardData(userPrincipal.getId());
        return ResponseEntity.ok(data);
    }
}
6. Checklist para Execução na IA
[ ] Adicionar coluna workout_onboarding_completed na tabela/entidade User.

[ ] Criar a entidade e repositório para WorkoutExecutionLog.

[ ] Escrever a lógica de rotação cíclica baseada em índice no WorkoutService.

[ ] Implementar os records/DTOs espelhando a tipagem do Front-end.

[ ] Construir o HomeAggregatorService orquestrando os serviços parceiros.

[ ] Mapear o HomeController protegendo a rota por autenticação.

[ ] Verificar se a resposta do endpoint com dados zerados não quebra o front-end quando o onboarding for falso.