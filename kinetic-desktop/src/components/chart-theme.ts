/** Cores e tooltip dos gráficos de linha/barra das telas de ROOT e EMPRESA. */
export const CHART = {
  mark: '#00a5b8', // série validada (dataviz) para dark
  grid: 'rgba(255,255,255,0.06)',
  tick: 'rgba(245, 246, 247, 0.36)',
} as const;

export const chartTooltipStyle = {
  background: '#1c1b1b',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f5f6f7',
  padding: '8px 12px',
} as const;
