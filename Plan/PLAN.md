🚀 Plano de Implementação: Tracking de Sobrecarga e Histórico de Peso
1. Visão Geral
Expandir o domínio de registros do sistema para suportar estatísticas avançadas (Progressive Overload e Histórico Fisiológico). O sistema deve passar a registrar cada série/repetição/carga por exercício durante uma sessão de treino, além de manter um histórico de pesagens do usuário.

2. Refatoração do Banco de Dados (Entidades)
A. Atualizar ExerciseSetLog (Já existente)
Ação: Manter os campos atuais (id UUID, setNumber, repsPerformed, weightUsed, loggedAt, e a relação @ManyToOne com Exercise).

Adição: Criar a relação @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "session_id", nullable = false) @JsonIgnore private WorkoutSession workoutSession;

Regra: Manter o uso de @Getter, @Setter, @NoArgsConstructor, @AllArgsConstructor. Proibido usar @Data.

B. Atualizar/Criar WorkoutSession
Ação: Deve conter id, user (@ManyToOne), durationInSeconds (Integer), sessionDate (LocalDate).

Adição: Criar a relação bidirecional: @OneToMany(mappedBy = "workoutSession", cascade = CascadeType.ALL, orphanRemoval = true) private List<ExerciseSetLog> setLogs = new ArrayList<>();

Comportamento: O CascadeType.ALL é crucial para que, ao salvar a Sessão, o Hibernate salve os Logs automaticamente.

C. Nova Entidade WeightHistory
Ação: Criar entidade para o gráfico mensal de peso.

Campos: id (Long/Identity), user (@ManyToOne), weight (Double), loggedAt (LocalDate - default LocalDate.now()).

3. Contratos da API (DTOs - Usar record)
A. LogSessionRequestDTO
SetLogDto: public record SetLogDto(@NotNull UUID exerciseId, @NotNull Integer setNumber, @NotNull Integer repsPerformed, @NotNull Double weightUsed) {}

Payload Principal: public record LogSessionRequestDTO(@NotNull @Positive Integer durationInSeconds, @NotNull LocalDate date, @NotEmpty List<SetLogDto> exercisesLog) {}

B. UpdateWeightRequestDTO
Payload: public record UpdateWeightRequestDTO(@NotNull @Positive Double newWeight) {}

4. Camada de Serviço (SessionService e UserService)
A. Lógica de logSession (@Transactional)
Extrair o e-mail do usuário via SecurityContextHolder e buscar o User no banco.

Instanciar um novo WorkoutSession (setando usuário, duração e data).

Iterar sobre a lista exercisesLog do DTO:

Para cada item, buscar o Exercise no repositório usando o exerciseId (lançar ResourceNotFoundException se não achar).

Instanciar um ExerciseSetLog.

Ligar o ExerciseSetLog ao Exercise e à WorkoutSession atual.

Adicionar o ExerciseSetLog na lista setLogs da WorkoutSession.

Salvar o WorkoutSession via repositório. O JPA fará os inserts de tudo via cascade.

B. Lógica de updateUserWeight (@Transactional)
Extrair usuário via SecurityContextHolder.

Atualizar o campo estático do usuário (user.setWeight(dto.newWeight())) e salvar o usuário.

Instanciar um WeightHistory (com o peso novo, usuário e data atual) e salvar no WeightHistoryRepository.

5. Controladores (Endpoints)
POST /api/sessions/log: Recebe LogSessionRequestDTO, chama o serviço e retorna 201 Created.

POST /api/users/weight: Recebe UpdateWeightRequestDTO, chama o serviço e retorna 200 OK.

6. 🚨 Regras Restritas de Arquitetura para a IA
Segurança: Nunca trafegar ou receber userId nos corpos das requisições POST. A identidade deve ser extraída exclusivamente do JWT (SecurityContext).

Design: Não utilizar anotação @Data do Lombok em Entidades JPA para evitar problemas cíclicos no toString(). Use getters e setters explícitos.

Resiliência: Valide os inputs do DTO com jakarta.validation.constraints.

Performance: Use FetchType.LAZY em todas as relações @ManyToOne.