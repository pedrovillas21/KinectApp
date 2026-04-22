# 🤖 Execução: Fase 9 - Aba Social e Feed Privado (SocialScreen)

## 📌 Objetivo da Fase
Implementar a `SocialScreen` replicando estritamente o layout do mockup fornecido na imagem (`Social_desing.jpg`). Esta tela funciona como um feed restrito a amigos adicionados (Squad) e permite a postagem de novas fotos utilizando a câmera nativa do dispositivo.

## 🛠️ Componentização e Estrutura de Dados

### 1. Mock de Dados (src/utils/mockData.js)
- Atualize o arquivo de mocks para incluir duas novas arrays:
  - `mockSquad`: Array de amigos (id, nome, avatarUrl, hasNewUpdate).
  - `mockFeed`: Array de postagens (id, author: {nome, avatarUrl}, timestamp, category, imageUrl, duration, calories, likesCount, commentsCount, caption, isLikedByMe). Garanta que os posts pertençam apenas aos usuários do `mockSquad`.

### 2. Componente: Squad Bar (src/components/SquadBar.js)
- **Layout:** Um bloco contendo um título "Squad" e um botão "Add +" no topo.
- **Lista:** Uma `<FlatList>` horizontal exibindo os avatares dos amigos.
- **Estilo do Avatar:** Baseado na imagem, os avatares devem ser circulares. Aplique uma borda Azul Neon (Cyan) para amigos com atualizações recentes, e uma borda cinza para os demais. O último item da lista deve ser um botão de busca (ícone de lupa).

### 3. Componente: Feed Post (src/components/FeedPost.js)
- **Cabeçalho do Post:** Avatar do autor, Nome, Tempo da postagem e Categoria (ex: "2 HRS AGO • HIGH INTENSITY"), com um botão de 3 pontinhos à direita.
- **Imagem e Overlay:** - A imagem principal da postagem deve ocupar a largura do card com cantos arredondados.
  - **Crucial:** Implemente uma `View` com fundo semi-transparente (estilo "Glass" com blur, escurecido na base) sobrepondo a parte inferior da imagem. Esta view exibirá as métricas do treino (Ex: "DURATION 45 MIN" e "CALORIES 420 KCAL").
  - Adicione suporte a badges (ex: "NEW PR") no canto superior direito da imagem.
- **Ações e Legenda:** Ícone de coração (curtida), ícone de balão (comentário) e contadores. Abaixo, o nome do autor em negrito seguido do texto da legenda.
- **Interatividade:** O clique no ícone de coração deve alternar o estado local do componente (preencher o coração e somar +1 no contador).

### 4. Integração de Câmera e Tela Principal (SocialScreen)
- **Layout Base:** A tela será composta pela `SquadBar` no topo e uma `<FlatList>` vertical renderizando os `FeedPost` logo abaixo.
- **Floating Action Button (FAB):** Crie um botão flutuante circular (cor Azul Neon) com um ícone de "+" posicionado no canto inferior direito.
- **Lógica da Câmera:** Utilize a biblioteca `expo-image-picker` nativa do Expo. Ao clicar no FAB, acione o método para abrir a câmera do dispositivo (`launchCameraAsync`). 

## 🎨 UI e Estilização (Fonte da Verdade: Social_desing.jpg)
- O design DEVE ser extraído inteiramente da imagem fornecida.
- Preste atenção especial aos espaçamentos (padding interno dos posts) e ao contraste das fontes pequenas em cinza (texto secundário) contra o fundo `#131313`.