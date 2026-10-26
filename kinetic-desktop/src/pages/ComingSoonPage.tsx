import PageHeader from '../components/PageHeader';
import { EmptyCard } from '../components/stat-primitives';

interface Props {
  title: string;
  subtitle?: string;
}

/** Rota de feature ainda não construída (placeholder "no caro": auditoria, faturamento). */
export default function ComingSoonPage({ title, subtitle }: Props) {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyCard>
          Em breve. Esta área ainda está em construção e será liberada em uma próxima
          entrega do painel.
        </EmptyCard>
      </div>
    </div>
  );
}
