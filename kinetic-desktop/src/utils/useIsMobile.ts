import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

/** Abaixo do breakpoint md do Tailwind. Para o que CSS não resolve (ex.: altura de gráfico do recharts). */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}
