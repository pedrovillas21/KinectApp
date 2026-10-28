type HttpError = { response?: { data?: unknown } };

/** Texto de erro do backend (o corpo vem em texto) ou o fallback. */
export function errorMessage(err: unknown, fallback: string): string {
  const data = (err as HttpError).response?.data;
  return typeof data === 'string' && data ? data : fallback;
}
