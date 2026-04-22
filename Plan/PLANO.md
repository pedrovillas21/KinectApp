# 🤖 Execução: Fase 8 - Tela de Exercício Ativo (ActiveSessionScreen)

## 📌 Objetivo da Fase
Implementar a tela `ActiveSessionScreen` replicando estritamente o layout do mockup fornecido na imagem (`Exercicio_ativo.png`). Esta tela possui lógicas complexas de cronômetro global e paginação de exercícios baseada no array do treino do dia.

## 🛠️ Lógica de Negócio e Estados (Hooks)

### 1. Paginação de Exercícios (O Fluxo Principal)
- **Estado Inicial:** A tela DEVE iniciar renderizando apenas o **primeiro exercício** do array do treino (ex: `currentIndex = 0`).
- **Botão de Ação Primária (CTA Azul Neon):** - Se houver um próximo exercício no array: O botão deve exibir o texto "PRÓXIMO EXERCÍCIO ->". Ao clicar, o `currentIndex` avança (+1) e a tela atualiza para mostrar os dados do novo exercício.
  - Se for o **último exercício** do array: O botão deve mudar de cor/texto para "FINALIZAR TREINO". Ao clicar, ele deve parar o cronômetro e navegar o usuário de volta para a Home ou Tela de Resumo.
- **Botão Secundário:** O botão "Finalizar Treino" (com ícone de 'stop' abaixo do CTA) encerra o treino imediatamente, independentemente do exercício atual.

### 2. Cronômetro Global (Elapsed Time)
- **Auto-Start:** Utilize um `useEffect` para iniciar um contador (em segundos) automaticamente assim que a `ActiveSessionScreen` for montada.
- **Formatador:** Crie uma função auxiliar para converter os segundos totais no formato `MM:SS` (ex: 00:42) que ficará em destaque no topo da tela com fonte grande e cor Azul Neon.
- **Gerenciamento de Memória:** Utilize `useRef` para guardar a referência do `setInterval` e garanta a limpeza (`clearInterval`) quando o componente for desmontado para evitar memory leaks.

### 3. Componentização dos Cards de Série (SerieCard)
- Extraia a renderização das séries para um componente `src/components/SerieCard.js`.
- **Inputs:** Cada card de série DEVE ter dois `<TextInput>` (Peso Realizado e Reps Realizadas). 
- **Estado Visual:** Baseado no mockup, a "Série 01" (ativa) tem um estilo destacado (borda lateral azul neon) e as outras ficam "esmaecidas" até chegar a vez delas. 
- **Checkmark:** Implemente um botão circular de "Check" para o usuário confirmar que concluiu aquela série.

## 🎨 UI e Estilização (Baseado na Imagem)
- Extraia as cores, margens e tamanhos de fonte EXATAMENTE da imagem `Exercicio_ativo.png`.
- O cabeçalho deve exibir "ELAPSED TIME", o cronômetro em azul neon gigante, e um badge indicando o progresso (ex: "1/5 Exercícios").
- Certifique-se de que a tela utilize um `<ScrollView>` ou `<FlatList>` (se houver muitas séries) para que o botão de "Próximo Exercício" não empurre os cards para fora da área visível. Mantenha os botões fixos no rodapé se possível.