import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getSquad } from '../services/socialService';
import type { SquadMember } from '../types';

const POLL_INTERVAL_MS = 20_000;

/** Squad com presença, atualizado a cada 20 s com o app em primeiro plano. */
export default function useSquadStatus() {
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const fetchStatus = async () => {
    try {
      const data = await getSquad();
      setSquadMembers(data);
    } catch {
      // silent — stale data is acceptable
    }
  };

  const startPolling = () => {
    if (intervalRef.current) return;
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startPolling();

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const wasBackground = appStateRef.current?.match(/inactive|background/);
      const isActive = nextState === 'active';
      appStateRef.current = nextState;

      if (wasBackground && isActive) {
        startPolling();
      } else if (!isActive) {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      sub.remove();
    };
  }, []);

  return { members: squadMembers, refresh: fetchStatus };
}
