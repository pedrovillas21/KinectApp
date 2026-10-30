import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  /** Slot à direita da barra superior para ações (botões, seletor de período). */
  actions?: ReactNode;
  /**
   * Ações largas (seletor de período, filtro): no celular não cabem ao lado do
   * título e descem para baixo do subtítulo, na largura toda.
   */
  wideActions?: boolean;
}

/**
 * Cabeçalho das páginas do AppShell, no padrão das telas do personal: barra de 60px + título da página.
 * No celular a barra é a do app: título da página + ações numa linha só.
 */
export default function PageHeader({ title, subtitle, actions, wideActions = false }: Props) {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-k-bg/85 px-4 backdrop-blur-[14px] md:h-[60px] md:px-8">
        <span className="truncate text-[17px] font-semibold md:text-sm md:font-normal md:text-k-text-muted">{title}</span>
        {actions && (
          <div className={`ml-auto flex shrink-0 items-center gap-2 ${wideActions ? 'max-sm:hidden' : ''}`}>{actions}</div>
        )}
      </header>
      <section className="mx-auto flex w-full max-w-[1160px] flex-col gap-1.5 px-4 pt-4 md:px-8 md:pt-9">
        <h1 className="text-[28px] font-semibold leading-[34px] tracking-[-0.02em] max-md:sr-only">{title}</h1>
        {subtitle && <p className="text-sm text-k-text-dim md:text-base">{subtitle}</p>}
        {wideActions && actions && <div className="mt-2 flex sm:hidden [&>*]:w-full">{actions}</div>}
      </section>
    </>
  );
}
