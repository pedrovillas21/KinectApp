# Kinetic App

Aplicativo de treino e acompanhamento físico com geração de fichas de treino por IA,
dashboards de evolução, ranking comunitário e autenticação completa.

O repositório é um monorepo com duas aplicações:

| Pasta | Stack | Descrição |
|-------|-------|-----------|
| [`kinetic-backend/`](kinetic-backend/) | Java 17 · Spring Boot 3.5 | API REST, autenticação JWT, persistência PostgreSQL e integração com Google Gemini |
| [`KineticApp/`](KineticApp/) | React Native · Expo 54 · TypeScript | Aplicativo mobile (Android/iOS/Web) |

---

## Visão geral da arquitetura

- **Backend** — Spring Boot (Web, Data JPA, Security, Validation), banco PostgreSQL
  (hospedado no Supabase), migrações versionadas com **Flyway**, autenticação via
  **JWT** (access + refresh token) e geração de treinos via **Google Gemini**.
- **Frontend** — Expo / React Native com React Navigation (stack, bottom-tabs e drawer),
  comunicação com a API via `axios` (com refresh automático de token), gráficos via
  `react-native-gifted-charts` e tema próprio (`src/theme/`).

### Principais endpoints da API

Base: `http://<host>:8080/api`

| Recurso | Método | Rota |
|---------|--------|------|
| Autenticação | `POST` | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/verify-email`, `/auth/reset-password` |
| Usuário | `GET` / `POST` | `/users/profile`, `/users/weight` |
| Home (dashboard) | `GET` | `/home/dashboard` |
| Treinos | `POST` / `GET` | `/workouts/generate`, `/workouts/my-plans` |
| Sessões | `POST` / `GET` | `/sessions/log`, `/sessions/monthly-stats`, `/sessions/weekly-activity` |
| Estatísticas | `GET` | `/stats/summary` |

---

## Pré-requisitos

- **Java 17** (JDK)
- **Maven** — opcional; o projeto inclui o wrapper `mvnw`/`mvnw.cmd`
- **Node.js 18+** e **npm**
- **Expo Go** no celular (ou um emulador Android/iOS) para rodar o app
- Acesso a um banco **PostgreSQL** (ex.: projeto no [Supabase](https://supabase.com))
- Uma **chave de API do Google Gemini** (para a geração de treinos por IA)

---

## 1. Subindo o backend (`kinetic-backend`)

### 1.1. Configurar variáveis de ambiente

O backend lê as configurações de um arquivo `.env` (via `spring-dotenv`). Use o template
[`kinetic-backend/.env.example`](kinetic-backend/.env.example) como base:

```bash
cd kinetic-backend
cp .env.example .env   # Windows (PowerShell): Copy-Item .env.example .env
```

Depois preencha os valores no `.env` (ele **não** é versionado):

| Variável | Obrigatória | Descrição |
|----------|:----------:|-----------|
| `DB_URL` | ✅ | URL JDBC do PostgreSQL (ex.: pooler do Supabase) |
| `DB_USERNAME` | ✅ | Usuário do banco (no Supabase: `postgres.<project-id>`) |
| `DB_PASSWORD` | ✅ | Senha do banco (use aspas se tiver caracteres especiais) |
| `JWT_SECRET` | ✅ | Segredo p/ assinar os tokens (base64, ≥ 256 bits) |
| `JWT_EXPIRATION_MS` | ✅ | Validade do access token, em ms |
| `JWT_REFRESH_EXPIRATION_MS` | ✅ | Validade do refresh token, em ms |
| `GOOGLE_AI_API_KEY` | ✅ | Chave da API do Google Gemini (geração de treinos) |
| `CORS_ALLOWED_ORIGINS` | ❌ | Origens liberadas (default: `http://localhost:8081,http://localhost:19006`) |

> 💡 Para gerar um `JWT_SECRET` aleatório: `openssl rand -base64 64`.

> O `ddl-auto` está em `validate` e o **Flyway** roda as migrações de
> `src/main/resources/db/migration/` automaticamente na inicialização.

### 1.2. Rodar a aplicação

A partir da pasta `kinetic-backend/`:

```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

A API sobe em **http://localhost:8080**.

Para gerar um JAR executável:

```bash
.\mvnw.cmd clean package
java -jar target/kinetic-backend-0.0.1-SNAPSHOT.jar
```

---

## 2. Subindo o app mobile (`KineticApp`)

### 2.1. Instalar dependências

A partir da pasta `KineticApp/`:

```bash
npm install
```

### 2.2. Configurar a URL da API

Use o template [`KineticApp/.env.example`](KineticApp/.env.example) e ajuste a URL do backend:

```bash
cd KineticApp
cp .env.example .env   # Windows (PowerShell): Copy-Item .env.example .env
```

| Variável | Descrição |
|----------|-----------|
| `EXPO_PUBLIC_API_URL` | URL base do backend, **sem** a barra final (o cliente axios adiciona `/api`) |

> **Testando no celular físico (Expo Go):** `localhost` aponta para o próprio celular,
> não para o seu computador. Use o **IP da sua máquina na rede local**, por exemplo:
> `EXPO_PUBLIC_API_URL=http://192.168.0.10:8080`. Garanta também que esse IP/origem
> esteja liberado no `CORS_ALLOWED_ORIGINS` do backend, se necessário.

### 2.3. Rodar o app

```bash
npm start          # abre o Expo Dev Tools (leia o QR Code com o Expo Go)
npm run android    # abre direto no emulador/dispositivo Android
npm run ios        # abre no simulador iOS (somente macOS)
npm run web        # abre no navegador
```

---

## Fluxo rápido para testar localmente

1. Configure `kinetic-backend/.env` com o banco, JWT e a chave do Gemini.
2. Suba o backend: `cd kinetic-backend && .\mvnw.cmd spring-boot:run`.
3. Configure `KineticApp/.env` com `EXPO_PUBLIC_API_URL`.
4. Instale e rode o app: `cd KineticApp && npm install && npm start`.
5. Abra no Expo Go (celular) ou em um emulador, registre um usuário e teste o fluxo.

---

## Estrutura do repositório

```
KinectApp/
├── kinetic-backend/        # API Spring Boot (Java 17)
│   └── src/main/java/com/kinetic/
│       ├── controllers/    # Endpoints REST
│       ├── services/       # Regras de negócio (Auth, Stats, Gemini, Workout...)
│       ├── models/         # Entidades JPA
│       ├── repositories/   # Spring Data repositories
│       ├── dtos/           # Objetos de transferência
│       ├── security/       # JWT, filtros e UserDetails
│       └── config/         # SecurityConfig / CORS
│   └── src/main/resources/db/migration/  # Migrações Flyway
├── KineticApp/             # App React Native / Expo
│   └── src/
│       ├── screens/        # Telas (Auth, Home, Stats, Profile, Onboarding...)
│       ├── components/     # Componentes reutilizáveis
│       ├── contexts/       # AuthContext / ThemeContext
│       ├── services/       # Cliente axios da API
│       ├── routes/         # Navegação
│       └── theme/          # Cores e design tokens
├── Plan/                   # Documentos de planejamento e design
└── graphify-out/           # Grafo de conhecimento do código
```

---

## Notas

- Os arquivos `.env` (backend e app) **não são versionados** — cada desenvolvedor
  precisa criar o seu localmente.
- O backend exige conexão com um PostgreSQL válido na inicialização; sem isso, as
  migrações do Flyway falham e a aplicação não sobe.
</content>
</invoke>
