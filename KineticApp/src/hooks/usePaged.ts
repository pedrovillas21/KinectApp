import { useCallback, useRef, useState } from 'react';
import type { Page } from '../types';

export interface PagedList<T> {
  items: T[];
  /** Última página carregada; -1 = nada carregado ainda. */
  page: number;
  last: boolean;
  loading: boolean;
  /** Carrega a página 0 (substitui a lista). */
  reload: () => Promise<void>;
  /** Carrega a próxima página, se houver. */
  loadMore: () => Promise<void>;
  /** Volta ao estado inicial (nada carregado). */
  reset: () => void;
  /** Atualiza itens localmente (ex.: contador de comentários). */
  update: (fn: (items: T[]) => T[]) => void;
}

/**
 * Lista paginada de um endpoint Spring `Page<T>`. Falha encerra a lista (last = true).
 * `initial` continua uma lista já carregada em outra tela (ex.: grade do perfil → publicações).
 */
export default function usePaged<T>(
  fetchPage: (page: number) => Promise<Page<T>>,
  initial?: { items: T[]; page: number; last: boolean },
): PagedList<T> {
  const [items, setItems] = useState<T[]>(initial?.items ?? []);
  const [page, setPage] = useState(initial?.page ?? -1);
  const [last, setLast] = useState(initial?.last ?? false);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  const load = useCallback(
    async (target: number) => {
      if (busy.current) return;
      busy.current = true;
      setLoading(true);
      try {
        const data = await fetchPage(target);
        setItems((prev) => (target === 0 ? data.content : [...prev, ...data.content]));
        setPage(target);
        setLast(data.last);
      } catch {
        if (target === 0) setItems([]);
        setPage(Math.max(target, 0));
        setLast(true);
      } finally {
        busy.current = false;
        setLoading(false);
      }
    },
    [fetchPage],
  );

  const reload = useCallback(() => load(0), [load]);
  const loadMore = useCallback(async () => {
    if (!last) await load(page + 1);
  }, [last, load, page]);
  const reset = useCallback(() => {
    setItems([]);
    setPage(-1);
    setLast(false);
  }, []);

  return { items, page, last, loading, reload, loadMore, reset, update: setItems };
}
