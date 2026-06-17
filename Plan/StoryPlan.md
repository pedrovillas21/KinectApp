Plano: fluxo de criação de Story estilo Instagram
Context
Na SocialScreen, a barra do Squad tem a bolha "Seu story" (estilo Instagram). Hoje, ao tocá-la, handleAddStory abre a câmera direto e publica a story na hora — sem preview, sem legenda e sem opção de escolher da galeria (SocialScreen.tsx:162-181).

A infra de stories já existe e está correta de ponta a ponta:

Frontend: createStory / getStories / uploadMedia(uri, 'stories') em socialService.ts; StoryViewer para visualizar; tipos Story / StoryGroup / CreateStoryRequest em types/index.ts.
Backend: GET/POST /api/social/stories em SocialController.java:139-146, com DTOs e migration de stories ativas.
O que falta é apenas a UX de criação: trocar a câmera instantânea por uma tela de criação completa (câmera ou galeria → preview → legenda → "Adicionar ao story"). Nenhuma mudança de backend é necessária.

Abordagem
Reutilizar o padrão do NewPostModal (mesmo overlay BlurView, tema KINETIC, uploadMedia + create) para criar um novo modal dedicado a stories.

1. Novo componente: KineticApp/src/components/NewStoryModal.tsx
Espelhar a estrutura de NewPostModal.tsx, adaptado para story (aspect 9:16, sem intensidade/treino):

Props: { visible: boolean; onClose: () => void; onStoryCreated: () => void }.
Estado: imageUri: string | null, caption: string, posting: boolean.
Seleção de mídia (dois caminhos, igual ao Instagram):
pickFromCamera() → ImagePicker.requestCameraPermissionsAsync() + launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [9,16], quality: 0.8 }).
pickFromGallery() → requestMediaLibraryPermissionsAsync() + launchImageLibraryAsync({ ... aspect: [9,16] ... }).
Em ambos, if (!result.canceled) setImageUri(result.assets[0].uri).
Renderização condicional:
Sem imageUri: dois botões grandes — "📷 Câmera" e "🖼️ Galeria".
Com imageUri: preview vertical + TextInput de legenda (placeholder "Adicione uma legenda...") + botão "Adicionar ao story" + opção de trocar foto.
Estilo do preview: container com aspectRatio: 9/16 e a Image com resizeMode="cover" (preenche o quadro vertical sem distorcer fotos de proporções diferentes).
Publicar (handlePublish), reusando os serviços existentes:
const url = await uploadMedia(imageUri, 'stories');
await createStory({ imageUrl: url, caption: caption.trim() || undefined });
onStoryCreated();        // dispara loadStories() na tela
// reset (imageUri/caption) + onClose()
Em erro, manter modal aberto e exibir Alert.alert('Não foi possível publicar', ...) (mesmo tratamento do NewPostModal).
Reset no fechamento (blindagem): centralizar o reset de imageUri (→ null) e caption (→ '') numa função handleClose() usada tanto no botão "Cancelar"/✕ quanto após publicar com sucesso. Assim, se o usuário desistir de um story e reabrir o modal depois, a foto antiga não reaparece no preview. (O NewPostModal reseta só no sucesso — aqui cobrimos também o cancelamento.)
2. Ligar na SocialScreen (SocialScreen.tsx)
Adicionar estado const [showNewStory, setShowNewStory] = useState(false).
Substituir o corpo de handleAddStory por apenas setShowNewStory(true) (toda a lógica de câmera/upload migra para o modal). Pode-se remover a função e passar onAddStory={() => setShowNewStory(true)} direto no SquadBar.
Renderizar o modal junto dos demais (perto de NewPostModal):
<NewStoryModal
  visible={showNewStory}
  onClose={() => setShowNewStory(false)}
  onStoryCreated={loadStories}
/>
Limpar imports que deixam de ser usados na SocialScreen: ImagePicker, e createStory/uploadMedia (passam a ser usados só dentro do NewStoryModal). Manter getStories (usado por loadStories).
SquadBar não muda: ele já só dispara onAddStory (SquadBar.tsx:80-91).

Arquivos
Criar: KineticApp/src/components/NewStoryModal.tsx
Editar: KineticApp/src/screens/SocialScreen.tsx
Verificação
Rodar o app (cd KineticApp && npx expo start) com o backend ativo.
Na aba Social, tocar na bolha "Seu story":
Deve abrir o modal de criação (não a câmera direto, nem o "Novo Post").
Testar "Galeria": escolher foto → ver preview → digitar legenda → "Adicionar ao story".
Testar "Câmera": tirar foto → preview → publicar.
Após publicar: o anel neon deve aparecer na sua bolha (vem de loadStories → storyGroups), e tocá-la abre o StoryViewer mostrando a imagem e a legenda.
Conferir que o botão flutuante + continua abrindo o NewPostModal (post), separado do fluxo de story.