/**
 * Teto do descanso que trava a próxima série: um erro de digitação na ficha
 * ("90min" no lugar de "90s") não pode prender o aluno na tela.
 */
export const MAX_REST_SECONDS = 10 * 60;

/**
 * Segundos de descanso a partir do texto livre da ficha ("60s", "90 seg", "2min",
 * "1min30", "1,5 min", "1:30", "90"). Faixa ("60-90s") usa o início. Null quando
 * não há tempo legível: aí a próxima série libera na hora, como antes.
 */
export function parseRestSeconds(label: string | null | undefined): number | null {
  if (!label) return null;
  const text = label.toLowerCase().replace(',', '.');

  const clock = text.match(/(\d+):(\d{1,2})/);
  let seconds: number;
  if (clock) {
    seconds = Number(clock[1]) * 60 + Number(clock[2]);
  } else {
    const min = text.match(/(\d+(?:\.\d+)?)\s*m(?:in)?/);
    const afterMin = min ? text.slice((min.index ?? 0) + min[0].length) : text;
    const sec = afterMin.match(/\d+/);
    seconds = (min ? Number(min[1]) * 60 : 0) + (sec ? Number(sec[0]) : 0);
  }

  seconds = Math.round(seconds);
  return seconds > 0 ? Math.min(seconds, MAX_REST_SECONDS) : null;
}
