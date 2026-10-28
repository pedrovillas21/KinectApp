import { useEffect, useState } from 'react';
import type { EmpresaAnalytics, StatsPeriodId } from '../../types';

/**
 * Analytics de uma unidade por período, para a Visão Geral e a tela de Analytics.
 * Trocar o período refaz a busca; a resposta de um período anterior é descartada.
 */
export default function useEmpresaAnalytics(
  load: (period: StatsPeriodId) => Promise<EmpresaAnalytics>,
  errorText: string,
) {
  const [period, setPeriod] = useState<StatsPeriodId>('month');
  const [data, setData] = useState<EmpresaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load(period)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(errorText))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period, load, errorText]);

  return { period, setPeriod, data, loading, error };
}
