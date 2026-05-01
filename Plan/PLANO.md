# 🧠 Plano de Desenvolvimento: Kinetic App - Evolução Onboarding & IA

## 1. Contexto Geral
- **Objetivo:** Aplicativo de diário de treinos com inteligência artificial generativa.
- **Usuário Alvo:** Frequentadores de academia (Iniciante ao Pro).
- **Stack:** React Native (Expo) | Java 17 (Spring Boot 3.2.x) | PostgreSQL (Supabase).

## 2. Nova Definição de Fluxo: Onboarding Dinâmico
O app deixará de usar apenas o "nível" para considerar um perfil fisiológico completo antes de chamar a IA.

### Campos de Captura (Front-end):
1. **Data de Nascimento:** (`birthDate`) - Para cálculo de idade dinâmica e contexto metabólico/hormonal.
2. **Peso Atual:** (`weight`) - Em kg.
3. **Altura:** (`height`) - Em metros.
4. **Objetivo:** (`goal`) - Dropdown: Ganho de Massa, Perda de Gordura, Performance.
5. **Frequência Semanal:** (`frequency`) - Dropdown: 3, 4, 5 ou 6 dias.
6. **Nível de Experiência:** (`level`) - Iniciante, Intermediário, Avançado.

## 3. Lógica do Back-end (Spring Boot)
### Conversão de Idade:
O `WorkoutService` deve converter a `birthDate` recebida no DTO em idade real usando:
`Period.between(birthDate, LocalDate.now()).getYears();`

### Integração com Gemini (Prompt Engineering):
O prompt será injetado com as variáveis de perfil. A IA deve ajustar:
- **Volume de Treino:** Frequência 3 (treinos densos) vs Frequência 6 (treinos distribuídos).
- **Metabolismo:** Ajustar sugestões de cardio e intensidade baseada na idade (diferenciando o vigor de um jovem de 21 anos do perfil de um adulto de 27+).
- **Cargas:** Sugestões iniciais baseadas no Peso e Nível informados.

## 4. Arquitetura Técnica & Regras de Ouro
- **Contrato JSON:** O retorno da IA deve ser sempre um **Array JSON** com o número de objetos igual à `frequency` escolhida.
- **JPA:** Proibido o uso de `@Data` em classes `@Entity` (usar `@Getter`, `@Setter`, `@NoArgsConstructor`).
- **Segurança:** Autenticação via JWT (7 dias de validade). Dados de perfil devem ser vinculados ao `userId` extraído do token.
- **Comunicação:** `RestClient` síncrono para chamadas externas à API do Google AI.

## 5. Próximas Tarefas Imediatas
1. **Back-end:** Criar `WorkoutRequestDTO` e atualizar o `WorkoutController`.
2. **Back-end:** Implementar lógica de cálculo de idade no `WorkoutService`.
3. **Back-end:** Refinar o `GeminiService` para aceitar o novo prompt dinâmico e iterativo.
4. **Front-end:** Alterar para adequar as novas requisções na tela de onboarding do front-end (mantenha o desing como está atualmente, apenas siga o mesmo template e adicione as novas abas informadas no documento.)
5. **Integração:** Conectar o formulário de Onboarding ao endpoint de geração de treino via Axios.
