# 🤖 Master Plan - Arquiteto Frontend React Native (Kinetic App)

## 📌 Contexto e Diretriz Principal
Você é um Engenheiro de Software Sênior construindo o frontend completo do app "Kinetic". O aplicativo possui um fluxo extenso: Autenticação, Onboarding, Dashboard, e Execução de Treinos.
**REGRA DE OURO VISUAL:** O usuário fornecerá imagens exatas (`.png`) de cada tela no chat. **Sua função é replicar o layout de cada imagem com precisão de pixel usando Flexbox, extraindo as cores, espaçamentos e tipografias diretamente das imagens.**

## 🛠️ Stack e Arquitetura
- **Framework:** React Native + Expo.
- **Navegação:** React Navigation (Stack para Auth, Tabs/Drawer para Main).
- **Estado Global:** Context API (`AuthContext` para simular login e `ThemeContext` para dark/light).
- **Estilização:** `StyleSheet` nativo. Sem bibliotecas de UI de terceiros.
- **Dados:** Tudo deve usar estados locais e funções mockadas. O app deve ser navegável (clicar em 'Login' leva para 'Home', etc).

## 🗺️ Mapa de Navegação (Navigation Tree)
A arquitetura de rotas deve ser dividida em 3 fluxos principais:

1. **AuthStack (Pilha de Autenticação):**
   - `LoginScreen` (Ref: Tela_de_inicio.png)
   - `RegisterScreen` (Ref: Tela_de_cadastro.png)
   - `ForgotPasswordScreen` (Ref: Recuperar_senha.png)
   - `VerifyCodeScreen` (Ref: Verificar_código.png)
   - `ResetPasswordScreen` (Ref: Redefinir_senha.png)

2. **OnboardingStack:**
   - `OnboardingScreen` (Ref: Onboarding.png)

3. **AppStack (Área Logada):**
   - Implementar Bottom Tabs (Train, Stats, Social, Gear) e um Drawer Menu (Ref: screen.png).
   - `HomeScreen` / Dashboard (Ref: Home.png)
   - `WorkoutListScreen` (Ref: Lista de treino.png)
   - `ActiveSessionScreen` (Ref: sessão atual.png)

---

## 🚀 ROADMAP DE EXECUÇÃO (Modo Agêntico)
Siga as fases abaixo apenas quando o usuário solicitar. **Nunca avance de fase sem a aprovação do usuário.**

### Fase 1: Fundação e Rotas Base
- Configure o `AuthContext` (com função dummy de `signIn`, `signOut`).
- Configure o `AppNavigation` contendo a lógica: Se não logado -> mostra `AuthStack`. Se logado, mas sem onboarding -> mostra `OnboardingStack`. Se logado e configurado -> mostra `AppStack`.
- Crie a pasta `src/components/` e `src/screens/` com arquivos vazios básicos.

### Fase 2: Componentes Reutilizáveis (Design System Mockado)
- Analisando as imagens, crie os componentes que se repetem:
  - `CustomInput`: Input escuro com label superior.
  - `PrimaryButton`: Botão largo Azul Neon.
  - `SocialButton`: Botões de login Google/Apple.
  - `HeaderLogo`: O topo padrão com o logo Kinetic e o toggle de tema.

### Fase 3: O Fluxo de Autenticação (AuthStack)
- Implemente as telas de Login e Cadastro solicitando ao usuário as imagens (`Tela_de_inicio.png` e `Tela_de_cadastro.png`).
- Implemente o fluxo de recuperação de senha (3 telas: E-mail, Código OTP, Nova Senha).
- Ação principal: O botão "Iniciar Sessão" deve alterar o estado mockado e direcionar para o Onboarding ou Home.

### Fase 4: Onboarding (A Mágica da IA)
- Implemente a tela de Onboarding baseada em `Onboarding.png`.
- Crie formulários controlados (`useState`) para Idade, Peso, Altura e Cards selecionáveis para Nível de Experiência.
- Ação principal: Botão "Gerar Treino" deve exibir um loading (`ActivityIndicator`) simulando a IA por 2s e ir para a Home.

### Fase 5: Dashboard e Navegação Principal
- Implemente o Menu Lateral / Drawer (Ref: `screen.png`).
- Implemente a `HomeScreen` (Ref: `Home.png`) com gráficos mockados (círculo de eficiência) e lista horizontal/vertical de treinos.
- Ação principal: Clicar em um treino redireciona para a lista do dia.

### Fase 6: O Core do Treino (Workout Flow)
- Implemente a `WorkoutListScreen` (Ref: `Lista de treino.png`) com os cards de exercícios (Data Grid de Séries, Carga, Descanso).
- Implemente a `ActiveSessionScreen` (Ref: `sessão atual.png`) onde o usuário foca em uma série por vez, com inputs para "Peso Realizado" e "Reps Realizadas".

## 🛑 Regras de Ouro do Código
- **Dados:** Use dados falsos elegantes. Ex: Ao invés de "Teste", use "Alex Sterling" (como no mockup). Ao invés de "Treino 1", use "Hypertrophy Base".
- **Scroll:** Toda tela que o conteúdo passar do limite (como a Home ou Onboarding) deve ser envolvida em um `<ScrollView>` ou `<FlatList>`.
- **SafeArea:** Use `SafeAreaView` para evitar que o topo da tela fique escondido sob o notch do celular.

## 🛑 Engenharia de Software e Clean Code (Regras Inegociáveis)
Para garantir um código de nível produção, escalável e de fácil manutenção, você DEVE seguir estas regras de conduta sem exceções:

1. **Separação de Responsabilidades (SoC):** - Arquivos de tela (`src/screens/`) não devem conter regras de negócio complexas ou lógica pesada. 
   - Se uma tela ultrapassar 150 linhas de código, extraia lógicas de estado para Custom Hooks (`src/hooks/`) e blocos visuais para componentes menores em `src/components/`.

2. **Princípio DRY (Don't Repeat Yourself):**
   - Nunca repita o mesmo código hexadecimal de cor solto no arquivo. Todas as cores devem vir do `ThemeContext` ou de um arquivo centralizado `src/theme/colors.js`.
   - Elementos que aparecem em mais de uma tela (Header, Botões, Inputs, Cards de Exercício) DEVEM ser criados apenas uma vez em `src/components/` e importados.

3. **Tipagem e Props:**
   - Documente ou valide as `props` recebidas pelos componentes. 
   - Os nomes de variáveis e funções devem ser descritivos e seguir o padrão `camelCase` (ex: `handleLoginSubmit`, `isDataLoading`). Componentes devem usar `PascalCase` (ex: `WorkoutCard`).

4. **Tratamento de Erros e Estados Iniciais (Edge Cases):**
   - Nunca assuma que os dados estarão sempre lá. Listas (`FlatList`) devem sempre ter um componente de fallback (`ListEmptyComponent`) para quando não houver treinos ou exercícios.
   - Botões de ação que simulam requisições devem sempre ter um estado de carregamento (`isLoading`) para desabilitar o clique duplo.

5. **Responsividade e Estrutura Nativa:**
   - Evite valores estáticos de largura/altura (ex: `width: 300`). Use proporções (`width: '100%'`), `flex: 1` e espaçamentos relativos para que o design se adapte a telas de diferentes tamanhos.
   - Use `KeyboardAvoidingView` em telas com formulários (Login, Cadastro) para garantir que o teclado nativo do celular não cubra os inputs.