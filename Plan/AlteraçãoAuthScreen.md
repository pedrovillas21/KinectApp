# Plano — Novo fluxo de login (Boas-vindas + Face ID para usuário recorrente)

## Contexto

Hoje o app KINETIC (React Native + Expo, backend Spring Boot + JWT) abre direto na
tela de login com e-mail/senha, e usuários recorrentes são **logados silenciosamente**
por `loadStoredSession` em [AuthContext.tsx](KinectApp/KineticApp/src/contexts/AuthContext.tsx#L119)
sempre que há token válido no AsyncStorage.

O mockup pede dois fluxos de entrada distintos:
1. **Novo usuário** — tela de boas-vindas (logo, tagline, bullets, "Criar conta grátis",
   "Já tenho conta · Entrar", link de Termos).
2. **Usuário recorrente** — card da "CONTA ATIVA" (nome, e-mail, streak 🔥), desbloqueio
   por **Face ID**, link "Trocar conta" e fallback "Usar e-mail e senha".

**Decisão validada com o usuário:** conta única lembrada (não multi-conta), migrar tokens
para `expo-secure-store`, **sem alterações de backend** (o Face ID é um portão *local* que
desbloqueia o refresh token de 30 dias já existente e o troca via `/auth/refresh`), e
**permitir entrar sem Face ID** em computadores/aparelhos sem biometria.

Resultado esperado: returning user vê o card + Face ID; novo usuário vê boas-vindas;
nenhum login silencioso — a entrada passa a exigir desbloqueio (biometria ou senha),
com fallback automático onde biometria não existe.

---

## Dependências novas (frontend)

Instalar via Expo (garante versões compatíveis):
```
npx expo install expo-local-authentication expo-secure-store expo-splash-screen
```
Configurar permissão de Face ID no `app.json` (iOS exige `NSFaceIDUsageDescription`):
adicionar o plugin `expo-local-authentication` com `faceIDPermission` em
[KinectApp/KineticApp/app.json](KinectApp/KineticApp/app.json) (verificar nome exato do arquivo de config Expo).

Nenhuma dependência ou endpoint novo no backend.

---

## Mudanças

### 1. Armazenamento seguro de tokens — novo módulo `tokenStorage`
**Arquivo novo:** `KinectApp/KineticApp/src/services/tokenStorage.ts`

- Wrapper sobre `expo-secure-store` com: `getAccessToken`, `setAccessToken`,
  `getRefreshToken`, `setRefreshToken`, `setTokens`, `clearTokens`.
- **Migração única explícita:** expor `migrateLegacyTokens()` — se houver tokens em
  AsyncStorage (`@kinetic_token`, `@kinetic_refresh_token`) e nada no SecureStore, mover
  para SecureStore e apagar do AsyncStorage. **É `await`-ado no bootstrap (item 6) antes de
  qualquer decisão de rota**, não "preguiçosamente na primeira leitura" — evita corrida
  entre migração e renderização.
- O **perfil do usuário** (`@kinetic_user`) e o **usuário lembrado** (item 2) **continuam em
  AsyncStorage** (não são segredos; SecureStore tem limite de ~2KB por chave).

**Refatorar para usar o módulo:**
- [api.ts](KinectApp/KineticApp/src/services/api.ts) — interceptor de request, `refreshAccessToken`
  e leituras/escritas de token passam a usar `tokenStorage` em vez de `AsyncStorage` direto.
- [AuthContext.tsx](KinectApp/KineticApp/src/contexts/AuthContext.tsx) — `signIn`, `signOut`,
  `loadStoredSession` idem.

### 2. Conceito de "usuário lembrado" + desbloqueio — `AuthContext.tsx`
**Arquivo:** [AuthContext.tsx](KinectApp/KineticApp/src/contexts/AuthContext.tsx)

- Nova chave `@kinetic_remembered_user` (AsyncStorage) com o mínimo para o card:
  `{ id, nome, email, streak? }`. Gravada em `signIn` (sucesso). O `streak` é preenchido
  quando já conhecido (cache do Home dashboard); senão o badge é omitido — sem backend.
- Novo estado exposto no contexto: `rememberedUser`.
- **`loadStoredSession` muda de comportamento:** primeiro `await migrateLegacyTokens()`,
  depois decide o estado; deixa de logar silenciosamente.
  - Se existe `rememberedUser` → mantém `isLoggedIn=false` e seta `rememberedUser`
    (rotas mostram a tela recorrente). Não restaura sessão sozinho.
  - Se não existe → `isLoggedIn=false`, sem `rememberedUser` (rotas mostram Boas-vindas).
- **Nova action `unlockSession()`** (chamada pela tela recorrente após Face ID OU pelo
  botão de fallback): lê o refresh token → `refreshAccessToken()` → se ok, carrega o user
  do storage, seta `isLoggedIn=true` e reaproveita a checagem de onboarding existente
  (`isOnboardedFromUser` + `fetchExistingPlans`). Se o refresh falhar (expirado/revogado),
  limpa o usuário lembrado e cai para Boas-vindas/Login.
- **Nova action `forgetRememberedUser()`** ("Trocar conta"): limpa tokens + `@kinetic_user`
  + `@kinetic_remembered_user` e zera estado → Boas-vindas.
- **`signOut` ("Sair da conta" no Profile)** passa a limpar também o `rememberedUser`
  (logout explícito volta para Boas-vindas, não para o card).

### 3. Telas novas
**Arquivo novo:** `KinectApp/KineticApp/src/screens/Auth/WelcomeScreen.js`
- Logo (`HeaderLogo`), tagline "O protocolo de treino que evolui com você.", 3 bullets.
- `PrimaryButton` "Criar conta grátis" → `navigation.navigate('Register')`.
- Botão secundário "Já tenho conta · Entrar" → `navigation.navigate('Login')`.
- Link de Termos de Uso / Privacidade (estático por ora).
- Usar `COLORS`/`ThemeContext` (padrão das telas Auth).

**Arquivo novo:** `KinectApp/KineticApp/src/screens/Auth/RecurringUserScreen.js`
- Lê `rememberedUser` do `AuthContext`. Card com iniciais/avatar, `nome`, `email`,
  badge de streak 🔥 (se houver `streak`).
- "Trocar conta" (topo direito) → `forgetRememberedUser()`.
- **Portão de segurança (sem botão inseguro de "Entrar").** Na montagem, checar o nível de
  segurança do aparelho com `LocalAuthentication.getEnrolledLevelAsync()`:
  - **`SecurityLevel.NONE`** (sem biometria E sem PIN/senha de tela): esconder o ícone de
    Face ID e **forçar** o caminho "Usar e-mail e senha" (único modo seguro). Não existe
    desbloqueio local possível.
  - **`SECRET` (PIN/senha de tela) ou `BIOMETRIC`:** ícone central dispara (e ao tocar)
    `authenticateAsync({ disableDeviceFallback: false, promptMessage, cancelLabel })`.
    A própria lib usa biometria quando há, e **cai para o PIN/senha do aparelho** quando a
    biometria falha ou não está cadastrada. Apenas em **sucesso** → `unlockSession()`.
    Isso preserva o portão também em PCs/aparelhos sem Face ID, mas com PIN — sem clique
    inseguro.
- Link "Usar e-mail e senha" (sempre visível) → `navigation.navigate('Login', { email: rememberedUser.email })`.
- **Nota de teste:** em emulador/simulador, cadastrar uma biometria/PIN no próprio
  emulador (ou usar o caminho de e-mail e senha) — não há atalho que pule o portão.

### 4. Roteamento — `AppRoutes.tsx`
**Arquivo:** [AppRoutes.tsx](KinectApp/KineticApp/src/routes/AppRoutes.tsx)
- No bloco `!isLoggedIn`, registrar `Welcome` e `RecurringUser` junto das telas existentes
  (Login, Register, ForgotPassword, VerifyCode, ResetPassword).
- `initialRouteName` dinâmico: `rememberedUser ? 'RecurringUser' : 'Welcome'`.

### 5. Ajuste no `LoginScreen.js`
**Arquivo:** [LoginScreen.js](KinectApp/KineticApp/src/screens/Auth/LoginScreen.js)
- Aceitar `route.params.email` para pré-preencher o campo de e-mail quando vindo de
  "Usar e-mail e senha". Mudança mínima no `useState` inicial.

### 6. Bootstrap sem "piscar" de tela — Splash até estar pronto
**Arquivo raiz:** [App.js](KinectApp/KineticApp/App.js)
- Chamar `SplashScreen.preventAutoHideAsync()` no topo do módulo (antes do componente).
- A Splash nativa permanece visível enquanto o `AuthProvider` faz o bootstrap:
  `migrateLegacyTokens()` + leitura de `rememberedUser`/perfil. Isso já é representado pelo
  estado `isLoadingAuth` do `AuthContext`.
- Quando `isLoadingAuth` vira `false`, esconder a splash com `SplashScreen.hideAsync()`
  (via `onLayout` do container raiz ou `useEffect`), e só então renderizar `AppRoutes`.
- Assim a rota inicial (`Welcome` vs `RecurringUser`) só é calculada **após** migração e
  leitura concluídas — elimina o flash de Boas-vindas antes de cair no card.
- [AppRoutes.tsx](KinectApp/KineticApp/src/routes/AppRoutes.tsx) mantém o early-return
  enquanto `isLoadingAuth` (agora coberto pela splash, sem tela em branco).

---

## Reaproveitamento
- `refreshAccessToken` / `/auth/refresh` já existentes (api.ts) — base do desbloqueio.
- `isOnboardedFromUser` + `fetchExistingPlans` (AuthContext) — reusar em `unlockSession`.
- `HeaderLogo`, `PrimaryButton`, `CustomInput`, `COLORS`, `ThemeContext` — padrão das telas Auth.
- Streak já existe no backend (`UserLoginStreak`, exposto no Home dashboard) — só cacheamos
  o valor; nada novo a implementar no servidor.

---

## Verificação (end-to-end)
1. `npx expo install ...` e iniciar o app (`npx expo start`).
2. **Novo usuário:** app limpo → abre **Boas-vindas**. "Criar conta grátis" → Register;
   "Já tenho conta" → Login. Login normal funciona e leva ao Onboarding/Home.
3. **Recorrente com biometria (device real):** após login, fechar e reabrir → abre o **card
   recorrente** com nome/e-mail. Face ID dispara; sucesso → entra direto na Home sem digitar senha.
4. **Trocar conta:** no card, tocar "Trocar conta" → volta para Boas-vindas; tokens limpos.
5. **Usar e-mail e senha:** no card, tocar o link → Login com e-mail pré-preenchido.
6. **Aparelho só com PIN (sem biometria):** desbloqueio cai automaticamente para o PIN/senha
   do aparelho via `authenticateAsync`; sucesso → Home. Não há atalho que pule o portão.
7. **Aparelho sem nenhuma segurança (`SecurityLevel.NONE`):** ícone de Face ID some e só
   resta "Usar e-mail e senha".
8. **Logout:** Profile → "Sair da conta" → volta para Boas-vindas (não para o card).
9. **Migração + sem flash:** usuário já logado (tokens em AsyncStorage) atualiza o app →
   splash segura até migrar; abre direto no card (sem piscar Boas-vindas) e sessão preservada.
10. **Refresh expirado:** simular refresh token inválido → desbloqueio falha graciosamente
    e cai para Boas-vindas/Login sem travar.