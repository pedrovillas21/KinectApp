// Copia os arquivos dos buckets do Storage de um projeto Supabase para outro,
// mantendo os mesmos caminhos (as keys gravadas no banco continuam valendo).
//
// Uso (na pasta deste script):
//   node --env-file=.env.migracao copiar-storage.mjs            -> só lista o que copiaria
//   node --env-file=.env.migracao copiar-storage.mjs --executar -> copia de verdade
//
// Idempotente: arquivo que já existe no destino é sobrescrito (x-upsert), então dá
// para rodar no ensaio e de novo na virada.

const ORIGEM = { url: process.env.ORIGEM_SUPABASE_URL, key: process.env.ORIGEM_SERVICE_ROLE_KEY };
const DESTINO = { url: process.env.DESTINO_SUPABASE_URL, key: process.env.DESTINO_SERVICE_ROLE_KEY };
const BUCKETS = (process.env.BUCKETS ?? 'avatars,social-media').split(',').map((b) => b.trim());
const EXECUTAR = process.argv.includes('--executar');

for (const [nome, valor] of Object.entries({ ...ORIGEM, ...DESTINO })) {
  if (!valor) {
    console.error('Faltam variáveis no .env.migracao (veja .env.migracao.example).');
    process.exit(1);
  }
}

const headers = (projeto) => ({ Authorization: `Bearer ${projeto.key}`, apikey: projeto.key });

// A API lista uma "pasta" por vez; item sem id é subpasta.
async function listar(bucket, prefixo = '') {
  const arquivos = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${ORIGEM.url}/storage/v1/object/list/${bucket}`, {
      method: 'POST',
      headers: { ...headers(ORIGEM), 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: prefixo, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
    });
    if (!res.ok) throw new Error(`listar ${bucket}/${prefixo}: ${res.status} ${await res.text()}`);
    const itens = await res.json();
    for (const item of itens) {
      const caminho = prefixo ? `${prefixo}/${item.name}` : item.name;
      if (item.id === null) arquivos.push(...(await listar(bucket, caminho)));
      else arquivos.push({ caminho, tipo: item.metadata?.mimetype ?? 'application/octet-stream' });
    }
    if (itens.length < 1000) return arquivos;
  }
}

async function copiar(bucket, { caminho, tipo }) {
  const alvo = encodeURI(caminho);
  const origem = await fetch(`${ORIGEM.url}/storage/v1/object/${bucket}/${alvo}`, { headers: headers(ORIGEM) });
  if (!origem.ok) throw new Error(`baixar: ${origem.status}`);
  const corpo = Buffer.from(await origem.arrayBuffer());
  const destino = await fetch(`${DESTINO.url}/storage/v1/object/${bucket}/${alvo}`, {
    method: 'POST',
    headers: { ...headers(DESTINO), 'Content-Type': tipo, 'x-upsert': 'true' },
    body: corpo,
  });
  if (!destino.ok) throw new Error(`enviar: ${destino.status} ${await destino.text()}`);
}

let falhas = 0;
for (const bucket of BUCKETS) {
  const arquivos = await listar(bucket);
  console.log(`\n[${bucket}] ${arquivos.length} arquivo(s)${EXECUTAR ? '' : ' — simulação, nada copiado'}`);
  if (!EXECUTAR) continue;
  let feitos = 0;
  for (const arquivo of arquivos) {
    try {
      await copiar(bucket, arquivo);
      feitos++;
      if (feitos % 50 === 0) console.log(`  ${feitos}/${arquivos.length}`);
    } catch (e) {
      falhas++;
      console.error(`  FALHA ${arquivo.caminho}: ${e.message}`);
    }
  }
  console.log(`  copiados: ${feitos}/${arquivos.length}`);
}
if (!EXECUTAR) console.log('\nRode com --executar para copiar.');
process.exit(falhas ? 1 : 0);
