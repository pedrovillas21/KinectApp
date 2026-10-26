/** Largura máxima enviada: é o tamanho em que a foto aparece no app e no painel. */
const MAX_WIDTH = 1080;
const QUALITY = 0.8;

/**
 * Reduz a foto no navegador antes do upload (até 1080 px de largura, JPEG 80%): de alguns MB
 * para ~150–300 KB, sem diferença visível na tela. Se o navegador não conseguir decodificar
 * a imagem, segue com o arquivo original (o backend barra acima de 3 MB).
 */
export async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.\w+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
