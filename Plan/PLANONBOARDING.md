# 🛡️ Plano de Refatoração: Onboarding Clínico e Blindagem do Prompt (IA)

## 1. Visão Geral
O objetivo é adicionar uma etapa de "Anamnese" (Histórico Clínico) no processo de Onboarding do usuário e atualizar o motor de geração de treinos (Spring Boot) para que a IA respeite restrições médicas, inclua aquecimentos obrigatórios e adicione disclaimers de segurança, elevando o padrão ético do aplicativo.

## 2. Refatoração Back-end (Java Spring Boot)

### A. Atualização de Entidades e DTOs
- **Entidade `User` (ou `UserProfile`):** Adicionar um novo campo `String medicalConditions` (ou `injuries`).
- **DTOs do Onboarding:** Atualizar o request DTO do onboarding para receber o campo `medicalConditions`.
- **`GenerateWorkoutRequestDto`:** Adicionar o campo `medicalConditions` para que ele seja passado ao serviço da IA.

### B. Refatoração do `buildPrompt` (Serviço de IA)
No método que constrói a String do prompt enviado ao Gemini/OpenAI, injetar as seguintes regras rígidas:

1.  **Injeção da Condição Médica:** 
    - Adicionar ao perfil do aluno: *"Condições Médicas/Lesões: ${medicalConditions}."*
2.  **Regra de Aquecimento/Mobilidade:**
    - Adicionar a instrução: *"REGRA DE ESTRUTURA: O primeiro exercício da lista 'data' de cada treino deve ser obrigatoriamente um exercício de MOBILIDADE ou AQUECIMENTO DINÂMICO focado na articulação principal do grupo muscular do dia (Ex: Rotação de manguito para treino de peito/ombro). NUNCA inicie um treino direto com carga pesada."*
3.  **Regra de Segurança de Impacto (IMC):**
    - Adicionar a instrução: *"REGRA DE SEGURANÇA: Se o objetivo do aluno for PERDA DE GORDURA e o IMC calculado for superior a 30, substitua exercícios de alto impacto (saltos, pliometria, corrida intensa) por opções de baixo impacto para preservar as articulações."*
4.  **Ajuste da "Armadilha da Carga":**
    - Modificar a instrução de carga: *"Ao sugerir peso no campo 'suggestedWeight', priorize a indicação através de RPE (Percepção de Esforço, ex: RPE 7-8) ou RIR (Repetições na Reserva). Se sugerir um peso absoluto (kg), deixe claro que é apenas um 'Exemplo Ilustrativo', pois a força absoluta varia."*
5.  **Disclaimer Ético:**
    - Adicionar a instrução: *"NOTA ÉTICA OBRIGATÓRIA: Adicione no campo 'subtitle' ou 'description' principal do treino o aviso: 'Sugestão gerada por IA. Consulte um profissional de Educação Física presencialmente antes de iniciar, respeitando seus limites.' "*

## 3. Refatoração Front-end (React Native / TypeScript)

### A. Nova Tela/Etapa no Onboarding (`MedicalHistoryScreen.tsx` ou Step equivalente)
- **Objetivo:** Coletar o histórico de lesões antes de gerar o primeiro treino.
- **UI/UX:**
    - **Título:** "Segurança em primeiro lugar."
    - **Subtítulo:** "Você possui alguma lesão, dor articular ou restrição médica que devemos saber para adaptar o seu treino?"
    - **Componente:** Um input de texto (TextArea) livre com um *placeholder* do tipo: "Ex: Hérnia de disco lombar L4-L5, dor no ombro direito, asma... ou deixe em branco se não houver restrições."
    - Como alternativa de UX, pode incluir "Chips" (botões de seleção rápida) com os problemas mais comuns: `[Joelho]`, `[Lombar]`, `[Ombro]`, `[Nenhuma restrição]`.
- **Integração:** Adicionar essa nova informação ao Payload final que faz o `POST` para o endpoint de finalização do Onboarding.

## 4. Diretrizes
- Manter o padrão TypeScript estrito no Front-end (sem `any`).
- Garantir que se o usuário pular a etapa ou marcar "Nenhuma", o Back-end envie a string "Nenhuma restrição relatada" para o prompt da IA, evitando que a IA alucine problemas que não existem.

# 🛠️ Adendo ao Plano: Persistência e Tratamento de Exceção da IA

Por favor, integre as seguintes regras técnicas ao plano de "Onboarding Clínico e Blindagem do Prompt" antes de iniciar a execução:

## 1. Back-end: Ajuste na Entidade `User` (JPA/Hibernate)
Para evitar erros de *Data Truncation* (texto longo demais para a coluna), garanta que o novo campo `medicalConditions` seja mapeado como um texto longo.
- **Ação (Java):** Na entidade `User` (ou onde o perfil estiver mapeado), declare o campo assim:
  ```java
  @Column(columnDefinition = "TEXT")
  private String medicalConditions;
  
2. Back-end: Regra de Tratamento "Zero Lesões" no Prompt
A IA precisa ter uma instrução clara para não ficar na defensiva caso o usuário seja saudável.

Ação (Prompt Builder): Adicione a seguinte condicional lógica no método que constrói a string do prompt:

Lógica (Pseudo-código): Se medicalConditions for nulo, vazio, "Nenhuma", ou "Nada", injete no prompt: "Condições Médicas: Nenhuma restrição relatada. O usuário é saudável. Pode seguir o protocolo padrão de hipertrofia sem restrições articulares."

Caso contrário, injete: "Atenção a Condições Médicas/Lesões: ${medicalConditions}. Adapte o treino rigorosamente para não agravar este quadro."

3. Front-end: UX Híbrida na MedicalHistoryScreen.tsx
Implemente uma interface híbrida:

Chips de seleção rápida (Ex: [Ombro], [Joelho], [Lombar], [Nenhuma]).

Campo de Texto Multilinha (TextArea) abaixo dos chips, habilitado apenas se "Nenhuma" não estiver selecionado.

Se o usuário clicar em "Nenhuma" ou deixar tudo em branco, o payload do Onboarding deve enviar explicitamente a string "Nenhuma" para o back-end.