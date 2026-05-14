# Plano de Refatoração: Onboarding Flow (React -> TSX Estrito)

## Objetivo
Refatorar o componente `OnboardingScreen.js` para TypeScript (`OnboardingScreen.tsx`), garantindo tipagem estrita (proibido o uso de `any`), ajustando a coleta de dados de idade para data de nascimento e inserindo uma nova etapa de texto livre (Anamnese).

## Diretrizes de Tipagem (Strict TypeScript)
* Nenhuma variável, parâmetro ou retorno de função deve ser tipado como `any`.
* Criar as seguintes interfaces/types base no topo do arquivo ou em um arquivo de tipos separado:

\`\`\`typescript
export type GoalType = 'loss' | 'mass' | 'perf' | '';
export type LevelType = 'beg' | 'int' | 'pro' | '';

export interface OnboardingForm {
  goal: GoalType;
  birthDate: string; // Formato esperado: 'YYYY-MM-DD'
  weight: number;
  height: number;
  level: LevelType;
  days: number[];
  anamnesis: string;
}
\`\`\`
* Todas as props de componentes (ex: `StepGoalProps`, `TopBarProps`) devem ter interfaces claramente definidas.

## Tarefa 1: Substituição de "Idade" por "Data de Nascimento"
* **Componente Alvo:** `StepMetrics`
* **Ação:** Remover o seletor `WheelPicker` de Idade (age) e substituir por um campo de Data de Nascimento (`birthDate`).
* **Implementação:** Utilizar um input nativo `<input type="date" />`, mas ele deve ser fortemente estilizado para manter a consistência com o Design System atual (fundo dark, cores da paleta `K`, sem bordas brancas padrão).
* **Estado:** Atualizar a inicialização do estado `form` no componente principal de `age: 25` para `birthDate: ''`.

## Tarefa 2: Criação da Etapa de Anamnese
* **Novo Componente:** Criar `StepAnamnesis` (que será a nova Etapa 5).
* **Conteúdo:** * Utilizar o componente `StepHeader` (ex: Título: "Anamnese", Subtítulo: "Relate lesões, limitações físicas ou equipamentos disponíveis").
  * Inserir um `<textarea>` estilizado usando a paleta do Design System (fundo `K.s1` ou `K.s2`, texto `K.text`, borda sutil focada em `K.primary`).
* **Estado:** Ligar o valor do textarea à propriedade `form.anamnesis`.

## Tarefa 3: Atualização do Controlador Principal (`OnboardingFlow`)
* **Total de Etapas:** Atualizar a contagem total de passos no `TopBar` e na lógica de renderização para refletir 6 passos no total (0 a 5).
* **Renderização Condicional:** Atualizar a ordem de exibição no `return` principal:
  * Step 0: Goal
  * Step 1: Metrics (Agora com birthDate)
  * Step 2: Level
  * Step 3: Freq
  * Step 4: Anamnesis (Nova etapa inserida aqui)
  * Step 5: Generating
* **Lógica de Avanço (`canAdvance`):**
  * Atualizar a validação do `step === 1` para garantir que `birthDate` seja preenchido (junto com weight e height).
  * O `step === 4` (Anamnese) será opcional. O botão de continuar deve estar habilitado mesmo se a string for vazia.
* **Componente `StepDone`:** Atualizar o resumo final para exibir a Data de Nascimento ou o cálculo da idade baseado na data, removendo a referência à antiga variável `age` estática.