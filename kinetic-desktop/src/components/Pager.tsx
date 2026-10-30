import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Page } from '../types';

/** Anterior/Próxima sobre um Page<T> do backend. Uma página só: não aparece. */
export default function Pager<T>({ page, onChange }: { page: Page<T>; onChange: (page: number) => void }) {
  if (page.totalPages <= 1) return null;
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3 pt-4">
      <Button variant="outline" size="sm" disabled={page.number === 0} onClick={() => onChange(page.number - 1)}>
        <ChevronLeft /> Anterior
      </Button>
      <span className="text-xs text-k-text-muted tabular-nums">
        Página {page.number + 1} de {page.totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page.last} onClick={() => onChange(page.number + 1)}>
        Próxima <ChevronRight />
      </Button>
    </nav>
  );
}
