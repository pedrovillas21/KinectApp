/** Dinheiro em centavos (inteiro) para não arrastar erro de ponto flutuante. */

export const formatBRL = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** "150" / "150,5" / "1.500,00" / "R$ 89,90" → centavos; null se não for um valor válido. */
export function parseBRLToCents(input: string): number | null {
  const clean = input.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/** Centavos → texto editável no input ("150,00"). */
export const centsToInput = (cents: number): string => (cents / 100).toFixed(2).replace('.', ',');
