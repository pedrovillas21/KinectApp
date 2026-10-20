import { useEffect } from 'react';
import { API_URL, refreshAccessToken } from './api';
import { getAccessToken } from './tokenStorage';
import { qk, queryClient } from './queryClient';

/** O que mudou: "student" (treino, peso, protocolo), "students" (vínculo) ou "billing". */
export interface TrainerEvent {
  type: string;
  studentId: string | null;
}

/**
 * Escuta GET /api/trainer/events (SSE). Usa fetch e não EventSource para mandar o
 * token no header Authorization (nunca na URL). Reconecta sozinho com espera
 * crescente; `onReconnect` avisa que eventos podem ter sido perdidos no meio.
 */
export function listenTrainerEvents(onEvent: (e: TrainerEvent) => void, onReconnect: () => void): () => void {
  const ctrl = new AbortController();
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  void (async () => {
    let delay = 1_000;
    let connectedOnce = false;
    while (!ctrl.signal.aborted) {
      try {
        const res = await fetch(`${API_URL}/trainer/events`, {
          headers: { Authorization: `Bearer ${await getAccessToken()}`, Accept: 'text/event-stream' },
          signal: ctrl.signal,
        });
        if (res.status === 401) {
          // Token venceu: renova e tenta de novo; sem renovação o interceptor do axios já desloga.
          if (!(await refreshAccessToken())) return;
        } else if (res.ok && res.body) {
          if (connectedOnce) onReconnect();
          connectedOnce = true;
          delay = 1_000;
          const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
          let buffer = '';
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value.replace(/\r\n/g, '\n');
            let end: number;
            while ((end = buffer.indexOf('\n\n')) >= 0) {
              const data = buffer
                .slice(0, end)
                .split('\n')
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.slice(5).trim())
                .join('\n');
              buffer = buffer.slice(end + 2);
              // Linhas de comentário (": ping") não têm data: são só o batimento.
              if (data) {
                try {
                  onEvent(JSON.parse(data) as TrainerEvent);
                } catch {
                  // evento malformado: ignora
                }
              }
            }
          }
        }
      } catch {
        if (ctrl.signal.aborted) return;
      }
      await wait(delay);
      delay = Math.min(delay * 2, 30_000);
    }
  })();

  return () => ctrl.abort();
}

/** Mantém o cache do painel em dia: cada aviso do backend recarrega só o que está na tela. */
export function useTrainerLiveUpdates(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    return listenTrainerEvents(
      (event) =>
        void queryClient.invalidateQueries({
          queryKey: qk.trainer,
          // Dados de OUTRO aluno não mudaram: não recarrega o perfil aberto à toa.
          predicate: (q) => q.queryKey[1] !== 'student' || q.queryKey[2] === event.studentId,
        }),
      () => void queryClient.invalidateQueries({ queryKey: qk.trainer }),
    );
  }, [enabled]);
}
