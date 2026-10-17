import PageHeader from '../components/PageHeader';
import { EmptyCard } from '../components/stat-primitives';
import { Clock } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
}

/** Rota de feature ainda não construída (placeholder "no caro": auditoria, faturamento). */
export default function ComingSoonPage({ title, subtitle }: Props) {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title={title} subtitle={subtitle} icon={<Clock className="w-5 h-5" />} />
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyCard>
          Em breve. Esta área ainda está em construção e será liberada em uma próxima
          entrega do painel.
        </EmptyCard>
      </div>
    </div>
  );
}
