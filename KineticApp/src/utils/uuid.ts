// UUID v4 sem dependência nativa (o Hermes não expõe crypto.randomUUID). Serve
// para chaves de idempotência, não para segredos: Math.random não é criptográfico.
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
