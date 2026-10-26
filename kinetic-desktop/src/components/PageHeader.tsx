import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  /** Slot à direita da barra superior para ações (botões, seletor de período). */
  actions?: ReactNode;
}

/** Cabeçalho das páginas do AppShell, no padrão das telas do personal: barra de 60px + título da página. */
export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.07] bg-k-bg/85 px-8 backdrop-blur-[14px]">
        <span className="text-sm text-k-text-muted">{title}</span>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </header>
      <section className="mx-auto flex w-full max-w-[1160px] flex-col gap-1.5 px-8 pt-9">
        <h1 className="text-[28px] font-semibold leading-[34px] tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="text-k-text-dim">{subtitle}</p>}
      </section>
    </>
  );
}
