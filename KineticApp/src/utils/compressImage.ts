import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Largura máxima enviada: é o tamanho em que a foto aparece no app e no painel. */
const MAX_WIDTH = 1080;
const QUALITY = 0.8;

/**
 * Reduz a foto antes do upload (até 1080 px de largura, JPEG 80%): uma foto de celular
 * cai de 2–5 MB para ~150–300 KB, sem diferença visível na tela, e o bucket do Storage
 * dura muito mais. Se a redução falhar, segue com o original (o backend barra acima de 3 MB).
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    const original = await ImageManipulator.manipulate(uri).renderAsync();
    const image =
      original.width > MAX_WIDTH
        ? await ImageManipulator.manipulate(uri).resize({ width: MAX_WIDTH }).renderAsync()
        : original;
    const saved = await image.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
    return saved.uri;
  } catch {
    return uri;
  }
}
