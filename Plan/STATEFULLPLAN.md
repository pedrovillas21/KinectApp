Plano: Correção do 401 no startup + Refresh Token revogável
Context
Ao abrir o app, o HomeScreen dispara /home/dashboard e /workouts/my-plans e recebe 401, mesmo o app funcionando depois. Causa raiz: a restauração de sessão em AuthContext.loadStoredSession considera a sessão válida apenas porque existe um token no AsyncStorage, sem checar expiração. Com JWT_EXPIRATION_MS=86400000 (24h), um token vencido de uma sessão anterior é enviado e o backend rejeita com 401.

Foram acordadas três soluções, sendo as duas primeiras já triviais e a terceira a mais estrutural:

Validar expiração na restauração de sessão (evita disparar requests fadados ao 401).
Eliminar a chamada duplicada de loadDashboard no HomeScreen.
Refresh token revogável (stateful) com rotação, para o usuário não ser deslogado a cada 24h e permitir logout/invalidacão server-side.
Nota sobre o estado atual do working tree: nesta sessão as soluções 1 e 2 já foram aplicadas, e a solução 3 foi implementada numa versão stateless (refresh token = JWT de 30 dias, sem rotação). Como a decisão final é stateful + rotação, este plano descreve o que manter, alterar e reverter para chegar ao design escolhido.

Solução 1 — Validar expiração na restauração de sessão ✅ (manter)
Já aplicado e validado (type-check limpo). Mantido como está:

KineticApp/src/utils/jwt.ts — novo util self-contained: decodeJwt() e isJwtExpired(token, skew=30s) (decodifica o payload e checa exp; não valida assinatura, isso é do backend).
KineticApp/src/contexts/AuthContext.tsx (loadStoredSession) — só restaura a sessão se o access token for válido; caso contrário tenta refresh (ver Solução 3) e, falhando, limpa o storage.
Solução 2 — Remover chamada duplicada no HomeScreen ✅ (manter)
Já aplicado. KineticApp/src/screens/HomeScreen.tsx agora chama loadDashboard apenas via useFocusEffect (que já cobre a montagem inicial); o useEffect redundante e seu import foram removidos.

Solução 3 — Refresh token stateful + rotação ⬅️ (foco do trabalho)
Design: o refresh token passa a ser um token opaco aleatório persistido no banco (não mais um JWT). O access token continua sendo um JWT curto (24h). A cada /auth/refresh o token antigo é invalidado e um novo par (access + refresh) é emitido (rotação). O logout e a troca de senha revogam tokens no servidor.

Backend — novos artefatos
Migration Flyway kinetic-backend/src/main/resources/db/migration/V6__create_refresh_tokens_table.sql (próxima versão após V5). Espelhar o padrão de V3__create_user_login_streaks_table.sql:

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256 hex do token bruto
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
Guardamos o hash do token (não o token bruto) — vazamento do banco não expõe tokens utilizáveis.

Entidade kinetic-backend/src/main/java/com/kinetic/models/RefreshToken.java — espelhar o estilo de UserLoginStreak.java (Lombok @Getter/@Setter/@NoArgsConstructor, @Id UUID, @ManyToOne(fetch = LAZY) para User, @CreationTimestamp). Campos: id, user, tokenHash, expiryDate, createdAt.

Repository kinetic-backend/src/main/java/com/kinetic/repositories/RefreshTokenRepository.java (extends JpaRepository<RefreshToken, UUID>): Optional<RefreshToken> findByTokenHash(String), void deleteByTokenHash(String), void deleteByUser(User) (marcar @Modifying @Transactional nos deletes derivados conforme necessário).

Service kinetic-backend/src/main/java/com/kinetic/services/RefreshTokenService.java (@Service, @Transactional nos métodos que mutam):

String createForUser(User user) — gera token bruto via SecureRandom (32 bytes → base64url), persiste o RefreshToken com tokenHash = sha256(raw) e expiryDate = now + refreshExpiration, retorna o bruto.
RotationResult rotate(String rawToken) — findByTokenHash(sha256(raw)); se ausente ou expiryDate no passado → apaga (se existir) e lança exceção; senão deleta o antigo, chama createForUser(user) e gera novo access JWT via JwtUtil.generateToken(email); retorna (novoAccess, novoRefreshBruto).
void revoke(String rawToken) — deleteByTokenHash(sha256(raw)) (idempotente).
void revokeAllForUser(User user) — deleteByUser(user).
Helper privado sha256Hex(String).
Backend — alterações em artefatos existentes
JwtUtil.java — reverter as adições stateless desta sessão (generateRefreshToken, validateRefreshToken, claim type, guard em validateToken, refreshExpiration). Volta a gerar apenas o access token (estado original). jwt.refresh-expiration passa a ser lido pelo RefreshTokenService (TTL do refresh no banco).

AuthResponseDTO.java — manter o campo refreshToken adicionado (agora é o token opaco).

RefreshResponseDTO.java — alterar para retornar o par rotacionado: record RefreshResponseDTO(String token, String refreshToken).

RefreshTokenDTO.java — manter (request { refreshToken } com @NotBlank). Reutilizado por /refresh e /logout.

AuthService.java:

login(...) — após autenticar, refreshTokenService.createForUser(user) e retornar o par.
refresh(String rawToken) — delega a refreshTokenService.rotate(...) e devolve RefreshResponseDTO(novoAccess, novoRefresh).
logout(String rawToken) — delega a refreshTokenService.revoke(...).
resetPassword(...) — adicionar refreshTokenService.revokeAllForUser(user) (invalida sessões após troca de senha).
AuthController.java:

/refresh — manter, agora retorna { token, refreshToken }; em erro responde 401.
novo POST /logout recebendo RefreshTokenDTO, chama authService.logout(...), responde 200 (idempotente). Já coberto por /api/auth/** permitAll em SecurityConfig.
Config (application.properties, .env, .env.example) — manter jwt.refresh-expiration / JWT_REFRESH_EXPIRATION_MS=2592000000 (30 dias). É o TTL persistido no banco.

Frontend — alterações (delta sobre o que já está aplicado)
KineticApp/src/services/api.ts:

refreshAccessToken() — o /auth/refresh agora devolve { token, refreshToken }; gravar ambos (AsyncStorage.multiSet de access + refresh). Atualizar o tipo da resposta.
Manter o refreshPromise (dedup de refresh simultâneo) — agora é essencial: com rotação, dois /auth/refresh paralelos invalidariam o token entre si. O dedup garante uma única rotação em voo para os 401 concorrentes (dashboard + my-plans no startup).
Manter _retry guard + retry da request original; signOut só no fracasso do refresh.
KineticApp/src/contexts/AuthContext.tsx:

signIn — manter (já grava o refresh via multiSet).
signOut — antes de limpar, ler o refresh token e chamar /auth/logout (best-effort, via cliente "cru" sem interceptors, ignorando erro de rede), depois multiRemove local.
loadStoredSession — manter (o refreshAccessToken agora também persiste o refresh rotacionado).
Trade-off conhecido (documentar, não bloquear)
Com rotação, se o app for morto no meio de uma renovação e o novo refresh não chegar a ser persistido, o cliente fica com um refresh já invalidado → logout forçado no próximo uso. O dedup via refreshPromise + persistência imediata mitiga o caso comum. Endurecimento opcional (fora do escopo): reuse-detection (detectar reuso de um refresh já rotacionado e revogar toda a família de tokens daquele usuário).

Arquivos críticos
Backend (novos): models/RefreshToken.java, repositories/RefreshTokenRepository.java, services/RefreshTokenService.java, db/migration/V6__create_refresh_tokens_table.sql.

Backend (alterar/reverter): security/JwtUtil.java (reverter p/ access-only), services/AuthService.java, controllers/AuthController.java, dtos/RefreshResponseDTO.java.

Frontend (alterar): src/services/api.ts, src/contexts/AuthContext.tsx.

Frontend (manter): src/utils/jwt.ts, src/screens/HomeScreen.tsx.

Verificação
Compilação/typecheck

Backend: cd kinetic-backend && ./mvnw -q -DskipTests compile.
Frontend: KineticApp/node_modules/.bin/tsc --noEmit -p KineticApp/tsconfig.json.
Migration — subir o backend e confirmar que o Flyway aplica V6 e cria refresh_tokens (sem erro de validate).

Fluxo de rotação (backend, via curl/Insomnia)

POST /api/auth/login → recebe { token, refreshToken }.
POST /api/auth/refresh com o refresh → 200 { token, refreshToken } (novo par).
Repetir /refresh com o refresh antigo → 401 (prova a rotação/invalidação).
POST /api/auth/logout com um refresh válido → 200; depois /refresh com ele → 401.
Trocar senha (/reset-password) e tentar /refresh com refresh anterior → 401.
Fluxo no app (Expo) — login; forçar expiração do access (ou esperar) e disparar uma ação que faça request → renovação silenciosa, sem 401 visível, e o refresh armazenado é atualizado; logout → reabrir o app cai na tela de Login. Pode ser validado com /run ou /verify.

Grafo — após implementar, graphify update . (instrução do CLAUDE.md).