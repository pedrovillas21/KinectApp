# Migração do Supabase: projeto antigo (us-west-2) → projeto novo (São Paulo)

Duas rodadas: um **ensaio** com o projeto antigo no ar (ninguém é afetado) e a **virada**
(backend desligado por alguns minutos). Os comandos são para PowerShell, rodados nesta pasta.

## 0. Preparação (uma vez)

1. **Projeto novo** na conta nova, região **South America (São Paulo)**. Guarde a senha do banco.
2. **Storage do projeto novo:** criar os buckets `avatars` (**Public**) e `social-media` (**privado**).
3. **Docker Desktop aberto** (usamos a imagem oficial do Postgres para ter `pg_dump`; não precisa instalar nada).
4. `Copy-Item .env.migracao.example .env.migracao` e preencher as URLs e service role keys dos dois projetos.
5. Pegar a string de conexão dos dois projetos: botão **Connect** → **Session pooler** (porta 5432).
   Anote host e usuário, por exemplo:
   - antigo: host `aws-1-us-west-2.pooler.supabase.com`, usuário `postgres.qdwheebglgcmyrqriiol`
   - novo: host `aws-?-sa-east-1.pooler.supabase.com`, usuário `postgres.<ref-novo>`

   Use o *session pooler*, não a conexão direta `db.<ref>.supabase.co`: a direta é só IPv6 e
   costuma falhar dentro do Docker no Windows.

## 1. Ensaio (projeto antigo continua no ar)

```powershell
# Dump do schema public do projeto antigo -> kinetic.dump nesta pasta
docker run --rm -e PGPASSWORD="SENHA_ANTIGA" -v "${PWD}:/dump" postgres:17 `
  pg_dump -h aws-1-us-west-2.pooler.supabase.com -p 5432 -U postgres.qdwheebglgcmyrqriiol -d postgres `
  --schema=public --no-owner -Fc -f /dump/kinetic.dump

# Restore no projeto novo
docker run --rm -e PGPASSWORD="SENHA_NOVA" -v "${PWD}:/dump" postgres:17 `
  pg_restore -h <host-novo> -p 5432 -U postgres.<ref-novo> -d postgres --no-owner /dump/kinetic.dump
```

- Um erro `schema "public" already exists` no restore é esperado e inofensivo. Qualquer outro erro: pare e investigue.
- Se precisar repetir o restore, apague antes as tabelas do projeto novo (SQL Editor:
  `DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres, service_role;`).

Depois:

1. `node --env-file=.env.migracao copiar-storage.mjs` (simulação: só conta os arquivos), depois com `--executar`.
2. No SQL Editor do projeto novo: rodar `pos-restauracao.sql` (trocando `<ref-antigo>`/`<ref-novo>`).
3. Rodar `contar-linhas.sql` nos **dois** projetos e comparar.
4. Subir o backend **local** com um `.env` apontando para o projeto novo (variáveis da seção 3) e testar:
   login, ver ficha, registrar treino, feed com imagem, foto de perfil, painel web.
   O Flyway deve dizer que o schema está atualizado, **sem aplicar migration nenhuma**.

Se tudo passou, o ensaio está aprovado. Apague o projeto novo e recrie-o vazio? **Não precisa**:
na virada, limpe o schema (comando `DROP SCHEMA` acima) e repita os passos — é mais rápido.

## 2. Virada (minutos de parada)

1. Desligar o backend que aponta para o projeto antigo (ninguém mais grava lá).
2. Limpar o schema `public` do projeto novo (comando do ensaio).
3. Repetir dump → restore → `copiar-storage.mjs --executar` → `pos-restauracao.sql` → `contar-linhas.sql`.
4. Trocar o `.env` do backend (seção 3) e religar.
5. Testar o mesmo roteiro do ensaio, agora pelo app no celular.

## 3. Variáveis que mudam no `.env` do backend

| Variável | Valor novo |
|---|---|
| `DB_URL` | `jdbc:postgresql://<host-novo>:5432/postgres` |
| `DB_USERNAME` | `postgres.<ref-novo>` |
| `DB_PASSWORD` | senha do projeto novo |
| `SUPABASE_URL` | `https://<ref-novo>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key do projeto novo |

Nada muda no app nem no painel web: eles falam só com o backend.

## 4. Depois

- **Pausar** (não apagar) o projeto antigo e deixá-lo assim por ~2 semanas como rede de segurança.
- Apagar `kinetic.dump` e `.env.migracao` desta pasta: contêm dados e chaves de produção.
- Atualizar `supabase/config.toml` (`project_id`) se usar o Supabase CLI.
