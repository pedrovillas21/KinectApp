# 🧠 Plano de Integração API: Onboarding -> Back-end -> WorkoutScreen

## 1. Status Atual
- **UI:** O design do `WorkoutScreen` está 100% concluído, mas consome variáveis estáticas (`mockData`).
- **Segurança:** O Interceptor JWT no `api.js` já está configurado e injetando o token automaticamente nas requisições.

## 2. Objetivo
Substituir os dados mockados por dados reais, fazendo com que a requisição de geração de treino identifique o usuário logado via JWT, salve o treino no banco atrelado a ele, e exiba o resultado final na interface já existente.

## 3. Back-end (Spring Boot): Identidade e Persistência
1. **Captura de Identidade:** O `WorkoutController` e o `WorkoutService` não devem receber o ID do usuário no body da requisição. O ID deve ser extraído do Token JWT interceptado na requisição atual (via `SecurityContextHolder`).
2. **Geração via IA:** O serviço consome a API do Gemini com os dados fisiológicos do usuário enviados no body (`birthDate`, `weight`, `goal`, etc.).
3. **Persistência (Supabase/JPA):** O Array de treinos gerado pela IA (Dias A, B, C...) deve ser salvo no banco de dados com a chave estrangeira (Foreign Key) apontando para o `User` extraído do passo 1.
4. **Retorno:** Retornar o `List<WorkoutPlanResponseDTO>` com status 201 (Created).

## 4. Front-end (React Native): Fluxo de Comunicação
### A. Disparo da Requisição (Tela de Onboarding)
- Montar o objeto com as seleções do usuário (Idade calculada/Data de Nascimento, Peso, Altura, Frequência, Objetivo, Nível).
- Disparar `api.post('/workouts/generate', payload)`. O Axios já enviará o Token JWT no header.
- Capturar a resposta de sucesso e navegar para o `WorkoutScreen`, passando os dados do treino via parâmetros de rota (`navigation.navigate('WorkoutScreen', { workoutData: response.data })`) ou Context API.

### B. Injeção de Dados (WorkoutScreen)
- **Remoção de Código Morto:** Deletar imediatamente a constante `MOCK_DATA` e qualquer referência a ela.
- **Estado Dinâmico:** Capturar o `workoutData` que chegou da navegação (ou do banco, caso o usuário apenas abra o app e o treino já exista) e alocá-lo no estado do componente.
- **Mapeamento:** Garantir que o `FlatList`, `SectionList` ou `.map()` que renderiza o design já existente aponte para as propriedades do JSON real (ex: `item.name`, `item.sets`, `item.reps`, `item.weight`).