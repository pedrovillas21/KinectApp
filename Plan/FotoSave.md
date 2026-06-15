Plano: Armazenar fotos do feed social no servidor (Supabase Storage)
Context
Na rede social (SocialScreen.tsx), as fotos de posts e stories só aparecem no celular que tirou a foto. A causa: o ImagePicker retorna uma URI local do dispositivo (file:///...) e essa string é enviada direto para o backend:

NewPostModal.tsx → createPost({ imageUrl: imageUri })
SocialScreen.tsx:172 → createStory({ imageUrl: result.assets[0].uri })
O backend (SocialService.java createPost/createStory) salva essa string verbatim na coluna social_posts.image_url. Como é um caminho de arquivo de um celular específico, nenhum outro aparelho consegue resolver — daí "só vejo a foto no celular que tirei".

O lado bom: a renderização (FeedPost.tsx usa <ImageBackground source={{ uri: post.imageUrl }}>, StoryViewer.tsx idem) e a coluna image_url (String) já esperam uma URL remota. Falta só: subir os bytes para um lugar durável e gravar a URL pública em vez do caminho local.

Abordagem escolhida (confirmada com o usuário):

Onde: Supabase Storage — bucket de objetos no mesmo projeto que já hospeda o Postgres. Project ref qdwheebglgcmyrqriiol (deduzido de DB_USERNAME=postgres.qdwheebglgcmyrqriiol no .env), logo a base do Storage é https://qdwheebglgcmyrqriiol.supabase.co.
Quem sobe: o backend Spring. O app envia o arquivo (multipart) com o JWT atual; o Spring sobe pro Storage usando a service_role key (que nunca sai do servidor) e devolve a URL pública. Reusa a autenticação existente e não expõe segredos no app.
Resultado esperado: foto tirada por um usuário fica visível para todos os membros do squad, em qualquer aparelho.

Pré-requisito manual (Supabase Dashboard)
No projeto Supabase (qdwheebglgcmyrqriiol) → Storage → criar bucket público chamado social-media (Public bucket = ON). Bucket público dispensa políticas RLS de leitura e gera URLs .../object/public/... acessíveis direto pelo <Image>.
Em Project Settings → API, copiar a service_role secret key (NÃO a anon). Ela será usada só no backend.
Backend (kinetic-backend)
1. Variáveis de ambiente
.env (real, não commitado) e kinetic-backend/.env.example: adicionar
SUPABASE_URL=https://qdwheebglgcmyrqriiol.supabase.co
SUPABASE_SERVICE_ROLE_KEY=... (no .env.example deixar placeholder)
SUPABASE_STORAGE_BUCKET=social-media
application.properties: mapear as props e habilitar multipart:
supabase.url=${SUPABASE_URL}
supabase.service-role-key=${SUPABASE_SERVICE_ROLE_KEY}
supabase.storage.bucket=${SUPABASE_STORAGE_BUCKET:social-media}

spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
2. StorageService (novo, com.kinetic.services)
Serviço que sobe um MultipartFile para o Supabase Storage e devolve a URL pública. Usar RestClient (Spring 6, já disponível no Spring Boot 3.5) — sem dependência nova no pom.xml.

Método String upload(MultipartFile file, String folder):
Validar: arquivo não-vazio, contentType começa com image/, tamanho dentro do limite (senão lançar exceção tratada como 400).
Gerar key: {folder}/{userId-ou-uuid}/{UUID}.{ext} (ext derivada do content-type: jpeg→jpg, png→png, webp→webp).
POST {supabase.url}/storage/v1/object/{bucket}/{key}
Headers: Authorization: Bearer {service-role-key}, Content-Type: {file.contentType}, x-upsert: true
Body: file.getBytes()
Em sucesso, retornar a URL pública: {supabase.url}/storage/v1/object/public/{bucket}/{key}
Tratar erro de resposta (status != 2xx) lançando exceção de runtime → vira 500/erro tratado.
3. Endpoint de upload
Adicionar em SocialController.java (já estende BaseController, já protegido por JWT via anyRequest().authenticated() no SecurityConfig.java):

@PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<MediaUploadResponse> uploadMedia(
        @RequestParam(defaultValue = "posts") String folder,
        @RequestPart("file") MultipartFile file) {
    // currentUserEmail() disponível via BaseController para namespacing opcional do path
    String url = storageService.upload(file, folder);
    return ResponseEntity.status(HttpStatus.CREATED).body(new MediaUploadResponse(url));
}
Novo DTO MediaUploadResponse(String url) em com.kinetic.dtos.
Nenhuma mudança em CreatePostRequest/CreateStoryRequest/SocialPost/SocialService: eles continuam recebendo/gravando imageUrl como String — agora será a URL pública do Storage.
Frontend (KineticApp)
1. uploadMedia() em socialService.ts
Nova função que envia o arquivo como multipart/form-data. O cliente axios (api.ts) tem Content-Type: application/json como padrão e já injeta o Bearer token no interceptor — basta sobrescrever o header por requisição para o React Native montar o boundary:

export const uploadMedia = async (uri: string, folder: 'posts' | 'stories' = 'posts'): Promise<string> => {
  const name = uri.split('/').pop() ?? `${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(name);
  const ext = (match?.[1] ?? 'jpg').toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const form = new FormData();
  form.append('file', { uri, name, type } as any);
  const res = await api.post<{ url: string }>('/social/media', form, {
    params: { folder },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};
2. Subir antes de criar o post — NewPostModal.tsx
No handlePost, quando houver imageUri, chamar uploadMedia(imageUri, 'posts') para obter a URL pública e passar essa URL em createPost({ ..., imageUrl: url }). Tratar erro de upload (manter modal aberto, mostrar feedback) em vez do catch silencioso atual, já que upload pode falhar por rede.

3. Subir antes de criar a story — SocialScreen.tsx:161
No handleAddStory, trocar createStory({ imageUrl: result.assets[0].uri }) por: const url = await uploadMedia(result.assets[0].uri, 'stories'); e então createStory({ imageUrl: url }).

4. (Opcional, recomendado) Reduzir tamanho antes de subir
As imagens já saem comprimidas (quality: 0.8 no ImagePicker). Se quiser garantir limite/menos banda, adicionar expo-image-manipulator para redimensionar (ex.: largura máx. 1080px) dentro de uploadMedia. Não é bloqueante para o funcionamento.

Arquivos principais
Backend (criar/editar):

kinetic-backend/src/main/java/com/kinetic/services/StorageService.java (novo)
kinetic-backend/src/main/java/com/kinetic/dtos/MediaUploadResponse.java (novo)
SocialController.java (endpoint /media)
application.properties (props + multipart)
.env / .env.example (vars Supabase Storage)
Frontend (editar):

socialService.ts (uploadMedia)
NewPostModal.tsx (handlePost)
SocialScreen.tsx (handleAddStory)
Verificação (end-to-end)
Pré: bucket social-media público criado e SUPABASE_SERVICE_ROLE_KEY no .env.
Backend isolado: com o app rodando, autenticar e testar o endpoint via Postman/curl: POST /api/social/media?folder=posts com header Authorization: Bearer <jwt> e form-data file=@foto.jpg. Esperar 201 + { "url": "https://qdwheebglgcmyrqriiol.supabase.co/storage/v1/object/public/social-media/posts/..." }. Abrir a URL no navegador → a imagem carrega.
App: criar um post com foto (FAB → NewPostModal). Conferir no Supabase Dashboard → Storage que o arquivo apareceu e que o post no feed mostra a imagem.
Teste cruzado (o bug original): logar em outro dispositivo/emulador com um usuário do mesmo squad e confirmar que a foto do post e a story aparecem. Esse é o critério de aceite.
Persistência: dar refresh no feed (pull-to-refresh) e reabrir o app — a imagem continua carregando (vem da URL remota, não do cache local).
Após as mudanças de código, rodar graphify update . para manter o grafo atualizado (conforme CLAUDE.md).