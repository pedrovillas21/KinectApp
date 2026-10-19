import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import { RESOURCE_CACHE_PREFIX as PREFIX } from '../services/resourceCache';

export interface FocusResource<T> {
  /** Último valor conhecido: do servidor ou, até ele responder, do cache do aparelho. */
  data: T | undefined;
  /** Sem nenhum dado ainda (nem cache): mostrar o carregamento da tela. */
  loading: boolean;
  /** A última busca falhou; `data` continua com o valor anterior. */
  error: boolean;
  /** `data` veio do servidor nesta tela (não só do cache do aparelho). */
  fresh: boolean;
  /** Puxar para atualizar: resolve quando a busca termina. */
  refresh: () => Promise<void>;
}

/**
 * Dados de tela no modelo "mostra o que tem e atualiza por trás" (stale-while-revalidate):
 * - abre na hora com o último valor salvo no aparelho, por usuário;
 * - busca de novo a cada foco da tela, sem disparar outra busca se uma já estiver em andamento;
 * - descarta respostas de buscas antigas (ex.: trocou o período antes da resposta chegar);
 * - falha não apaga o que está na tela: liga `error` para a tela oferecer "tentar de novo".
 *
 * `key` identifica o dado (ex.: "stats/summary?month"); `null` pausa a busca.
 */
export default function useFocusResource<T>(key: string | null, fetcher: () => Promise<T>): FocusResource<T> {
  const { currentUser } = useContext(AuthContext);
  const storageKey = key && currentUser ? `${PREFIX}${currentUser.id}:${key}` : null;

  const [state, setState] = useState<{ key: string | null; data: T | undefined; error: boolean; fresh: boolean }>({
    key: storageKey,
    data: undefined,
    error: false,
    fresh: false,
  });
  const inflight = useRef<{ key: string; promise: Promise<void> } | null>(null);
  const currentKey = useRef(storageKey);
  currentKey.current = storageKey;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Troca de chave (período, usuário): começa do cache dessa chave.
  useEffect(() => {
    setState({ key: storageKey, data: undefined, error: false, fresh: false });
    if (!storageKey) return;
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!active || raw == null) return;
        // Só preenche se o servidor ainda não respondeu.
        setState((s) => (s.key === storageKey && s.data === undefined ? { ...s, data: JSON.parse(raw) as T } : s));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [storageKey]);

  const load = useCallback((): Promise<void> => {
    const keyAtStart = currentKey.current;
    if (!keyAtStart) return Promise.resolve();
    if (inflight.current?.key === keyAtStart) return inflight.current.promise;

    const promise = fetcherRef
      .current()
      .then((data) => {
        if (currentKey.current !== keyAtStart) return; // resposta de uma chave antiga
        setState({ key: keyAtStart, data, error: false, fresh: true });
        AsyncStorage.setItem(keyAtStart, JSON.stringify(data)).catch(() => {});
      })
      .catch((err: unknown) => {
        if (currentKey.current !== keyAtStart) return;
        console.warn(`[useFocusResource] ${keyAtStart} falhou:`, err);
        setState((s) => ({ ...s, error: true }));
      })
      .finally(() => {
        if (inflight.current?.promise === promise) inflight.current = null;
      });
    inflight.current = { key: keyAtStart, promise };
    return promise;
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, storageKey]),
  );

  const current = state.key === storageKey ? state : { data: undefined, error: false, fresh: false };
  return {
    data: current.data,
    loading: current.data === undefined && !current.error,
    error: current.error,
    fresh: current.fresh,
    refresh: load,
  };
}
