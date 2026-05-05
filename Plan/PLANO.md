# Plano de Integração: Onboarding -> IA Backend -> WorkoutScreen

Este documento descreve o roteiro técnico para substituir os dados mockados na `WorkoutScreen` por treinos reais gerados via IA, baseados nas informações coletadas durante o `OnboardingScreen`.

## 1. Objetivo
Integrar o fluxo de dados do usuário (idade, peso, altura, objetivo e frequência) com o serviço de geração de treinos no Back-end (Spring Boot + Gemini) e refletir o resultado em tempo real na interface mobile (React Native/Expo).

## 2. Contexto Técnico
- **Frontend:** React Native (Expo) + Axios + AsyncStorage.
- **Backend:** Java Spring Boot + Spring Security (JWT) + Gemini AI.
- **Endpoint de Geração:** `POST /api/workouts/generate` (exemplo).
- **Endpoint de Busca:** `GET /api/workouts/current`.

---

## 3. Etapas de Implementação

### Passo 1: Captura e Envio no Onboarding (Frontend)
No final do fluxo de Onboarding, o aplicativo deve consolidar o objeto de perfil e disparar a geração.
1. **Consolidação:** Reunir `age`, `weight`, `height`, `goal`, `level` e `frequency`.
2. **Requisição:** Enviar um `POST` para o back-end com esse corpo JSON.
3. **Persistência:** Garantir que o Token JWT está sendo enviado no header (via interceptor do `api.js`).
4. **Navegação:** Exibir um componente de `Loading` (ou animação de "Gerando seu treino...") enquanto a IA processa a requisição.

### Passo 2: Processamento e Persistência (Backend)
O Spring Boot deve receber os dados e vincular o treino ao usuário autenticado.
1. **Controller:** O `WorkoutController` recebe o `UserStatsDTO`.
2. **GeminiService:** O prompt deve usar os dados reais enviados pelo front para gerar o JSON do treino.
3. **Database:** Salvar o `WorkoutPlan` no banco de dados atrelado ao `userId` do token.
4. **Resposta:** Retornar o plano gerado com sucesso.

### Passo 3: Consumo em Tempo Real na WorkoutScreen (Frontend)
A tela de treinos deve deixar de ler o arquivo `mock.json` e buscar da API.
1. **useEffect:** Ao carregar a `WorkoutScreen`, disparar uma chamada `api.get('/workouts/my-plans')`.
2. **State Management:** Armazenar o retorno no estado `const [workout, setWorkout] = useState(null)`.
3. **Mapeamento:** Adaptar o design para iterar sobre o array de exercícios vindo do banco de dados.
4. **Tratamento de Vazio:** Se não houver treino no banco, redirecionar para o Onboarding ou mostrar botão de "Gerar Treino".

---

## 4. Checklist de Verificação
- [ ] O `api.js` está usando o IP correto da rede (não localhost).
- [ ] O `AsyncStorage` está recuperando o token corretamente antes da chamada.
- [ ] O Back-end está recebendo o peso/altura em tipos numéricos corretos (Double/Integer).
- [ ] O prompt da IA no Back-end está devidamente parametrizado com as variáveis do Onboarding.
- [ ] A `WorkoutScreen` exibe um Spinner de carregamento enquanto a API não responde.

---

## 5. Próximos Passos (Feature Web)
- Garantir que as estatísticas de carga salvas na `WorkoutScreen` sejam enviadas via `PATCH` ou `POST` para o endpoint de métricas, permitindo que o Dashboard Web do professor consuma esses dados posteriormente.
