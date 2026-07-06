Plano: Job de varredura de mídia órfã no Supabase Storage
Contexto
Quando um usuário cria um post ou story com imagem, o fluxo é em duas etapas: o app sobe o arquivo para o bucket social-media (POST /api/social/media) e depois cria a linha em social_posts com a URL. Se a segunda etapa falha (erro de rede, app morto, crash), o objeto fica no bucket sem linha correspondente no banco — uma mídia órfã.

Hoje existe limpeza compensatória no cliente (NewPostModal.tsx/NewStoryModal.tsx chamam deleteMedia() no catch), que cobre ~90% dos casos — falhas transacionais imediatas. Ela não cobre app morto entre o upload e o persist, falha de rede que deixa estado incompleto, nem órfãos antigos.

O todo recomenda, como melhor custo-benefício, um job de varredura no backend: varre o bucket e apaga objetos com mais de X horas que não têm linha correspondente no banco. Resolve todos os órfãos (inclusive os de app morto) sem tocar no fluxo de criação.

Escopo decidido: apenas órfãos (mídia sem linha em social_posts). Stories expiradas ainda têm linha no banco, então não são tocadas — GC de stories expiradas fica fora.

Segurança decidida: modo dry-run via property (default true) — a primeira rodada só loga o que apagaria; depois de validar o mapeamento bucket→banco nos logs, liga-se a exclusão real flipando a property.

Estado atual (o que já existe)
Storage: Supabase Storage, bucket social-media, pastas posts/ e stories/. Key = {folder}/{uuid}.{ext}. URL pública guardada em social_posts.image_url.
StorageService.java já faz upload() e delete(publicUrl) via Supabase REST API com RestClient. Não tem operação de listar o bucket — é o que falta para varrer.
SocialPostRepository.java — repo JPA de social_posts.
@EnableScheduling já está ativo em KineticApplication.java.
Padrão de job agendado a seguir: RefreshTokenService.purgeExpiredTokens() (@Scheduled(cron=...) + @Transactional + log de contagem). Slots usados: 03:00 (CommunityStatsService) e 04:00 (RefreshTokenService) → usar 05:00.
Mudanças
1. StorageService — adicionar listar + deletar por key (reuso)
kinetic-backend/.../services/StorageService.java

Extrair a lógica de "URL pública → key" (hoje inline em delete(), linhas 122-127) para um helper privado keyFromPublicUrl(String publicUrl), e fazer delete() delegar para um novo deleteByKey(String key). Assim o job reusa deleteByKey direto com a key.
Novo método list(String folder) que chama a list API do Supabase: POST {supabaseUrl}/storage/v1/object/list/{bucket} com body JSON {"prefix":"{folder}/","limit":1000,"offset":<n>,"sortBy":{"column":"name","order":"asc"}} e os mesmos headers apikey/Authorization. Retorna uma lista de um pequeno record RemoteObject(String key, Instant createdAt) — onde key = folder + "/" + name (o name vem relativo ao prefixo) e createdAt vem do campo created_at do item.
Blindagem do parsing (Jackson): a list API do Supabase devolve metadados em snake_case (name, id, created_at, updated_at). Anotar o record de desserialização com @JsonProperty("created_at") (e @JsonIgnoreProperties(ignoreUnknown = true)) para não ler a data como null — se vier null, o objeto passaria no filtro de idade e órfão antigo seria ignorado (ou, pior, um arquivo recém-criado seria tratado como velho). Tratar createdAt == null defensivamente: não apagar (pula o objeto).
Paginar: a API limita por chamada; iterar incrementando offset até a página voltar com menos itens que o limit.
Restringir folder à mesma whitelist ALLOWED_FOLDERS já existente (linha 34).
Best-effort como delete(): em RestClientResponseException, logar warn e devolver o que tiver.
2. SocialPostRepository — buscar todas as URLs de mídia
kinetic-backend/.../repositories/SocialPostRepository.java

@Query("SELECT p.imageUrl FROM SocialPost p WHERE p.imageUrl IS NOT NULL")
List<String> findAllImageUrls();
Projeção só da coluna (não carrega entidades) — alinhado ao "sem entity loading" dos outros jobs. Para volumes muito grandes no futuro, dá para trocar por checagem paginada, mas para a escala atual carregar o conjunto de keys em memória é suficiente.

3. Novo OrphanMediaCleanupService (o job)
kinetic-backend/.../services/OrphanMediaCleanupService.java

@Service, injeta StorageService e SocialPostRepository (construtor / @RequiredArgsConstructor).
Properties (via @Value):
social.media.cleanup.grace-hours (default 24) — só apaga objetos mais velhos que isso, garantindo folga > tempo entre upload e persist (evita corrida com upload em andamento).
social.media.cleanup.dry-run (default true) — quando true, só loga "apagaria X".
Método @Scheduled(cron = "0 0 5 * * *") (05:00, após os jobs de 03h/04h):
Set<String> knownKeys (HashSet) = repo.findAllImageUrls() mapeado por keyFromPublicUrl (expor o helper como package-private ou método utilitário em StorageService), ignorando URLs que não pertencem ao bucket. Usar HashSet é essencial: a checagem knownKeys.contains(key) por objeto é O(1); numa List seria O(N) e a varredura degradaria conforme o feed cresce.
Para cada pasta em {"posts","stories"}: storageService.list(folder).
Candidato a órfão = objeto cujo key não está em knownKeys e createdAt é anterior a now - graceHours.
Se dryRun → log.info("[dry-run] removeria {} mídia(s) órfã(s): {}", n, keys). Senão → storageService.deleteByKey(key) para cada um e log.info da contagem.
Guarda de segurança: registrar no log o total listado vs. total de keys conhecidas antes de apagar; o @Transactional(readOnly = true) na leitura garante que falha na query do banco aborta o job (não apaga nada com conjunto vazio por erro).
4. Documentar as properties
kinetic-backend/.../resources/application.properties

Adicionar, perto do bloco supabase.* (linhas 24-31):

# Limpeza de mídia órfã (job diário às 05:00)
social.media.cleanup.grace-hours=${MEDIA_CLEANUP_GRACE_HOURS:24}
social.media.cleanup.dry-run=${MEDIA_CLEANUP_DRY_RUN:true}
5. Remover o todo da raiz
O arquivo todo na raiz era a anotação da dívida técnica que este plano implementa — apagá-lo ao concluir (ou esvaziá-lo).

Verificação (end-to-end)
Build: cd kinetic-backend && ./mvnw clean package (Windows: .\mvnw.cmd clean package).
Criar um órfão de teste: subir uma imagem sem criar post — POST /api/social/media?folder=posts (multipart) e não chamar createPost. Confirma que o objeto existe no bucket Supabase e não há linha em social_posts.
Rodar o job sob demanda (sem esperar 24h): em ambiente de dev, setar MEDIA_CLEANUP_GRACE_HOURS=0 e temporariamente o cron para 0 * * * * * (a cada minuto), ou extrair o corpo para um método público e disparar por um teste/endpoint de dev.
Validar dry-run: com dry-run=true (default), conferir no log a linha [dry-run] removeria N mídia(s) órfã(s): [...] listando a key do órfão — e nenhuma key de post/story real. Esse passo valida o mapeamento bucket→banco antes de qualquer exclusão.
Ligar exclusão: setar MEDIA_CLEANUP_DRY_RUN=false, rodar de novo, confirmar que o órfão sumiu do bucket e que posts/stories reais continuam intactos (feed e ring de stories no app seguem carregando as imagens).
Regressão: criar um post normal logo antes da janela do job e confirmar que sua mídia não é apagada (protegida pelo grace-hours e por já ter linha no banco).
Rodar graphify update . ao final para manter o grafo em dia.
Notas
Mantém o padrão dos jobs existentes (cron hardcoded, @Scheduled, log de contagem); só grace-hours/dry-run são externalizados porque viabilizam teste e a primeira execução segura.
Não toca no fluxo de criação de post/story nem na limpeza compensatória do cliente — é puramente aditivo.
Endpoint atômico de upload+criação (a 3ª opção do todo) continua como dívida futura, só justificável se surgir mais tipo de conteúdo com mídia ou exigência de conformidade.