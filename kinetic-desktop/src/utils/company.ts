/** Máscara de CNPJ (00.000.000/0000-00) enquanto digita. */
export const formatCnpj = (value: string): string =>
  value
    .replace(/\D/g, '')
    .substring(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');

/**
 * Apelido de login (rede ou filial): minúsculas, números e hífen, sem acento, até 40
 * caracteres — o mesmo formato que o backend aceita.
 */
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .substring(0, 40);
