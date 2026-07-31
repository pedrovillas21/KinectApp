import { useEffect, useState } from 'react';
import { MessageSquareText, ShieldCheck, UserRound } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { listCompanyFeedbacks } from '../../services/feedbackService';
import type { Feedback } from '../../types';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listCompanyFeedbacks()
      .then((f) => !cancelled && setFeedbacks(f))
      .catch(() => !cancelled && setError('Não foi possível carregar os feedbacks.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Feedbacks"
        subtitle="Recebidos de alunos com vínculo corporativo"
        icon={<MessageSquareText className="w-5 h-5" />}
      />

      <div className="max-w-4xl w-full mx-auto px-6 py-6 flex flex-col gap-4">
        {/* Nota explicativa do filtro corporativo (a regra é aplicada no backend). */}
        <div className="flex gap-2.5 p-3.5 rounded-xl bg-k-primary-dim/40 border border-k-primary-soft text-k-text-dim text-xs leading-relaxed">
          <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-k-primary" />
          <p>
            Só vínculos corporativos (aluno atribuído a um personal <strong>pela empresa</strong>) geram
            feedback. Vínculos particulares (convite direto do personal) não aparecem aqui.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center p-8 py-10 rounded-2xl bg-k-surface2/30 border border-dashed border-k-ghost text-k-text-muted text-xs">
            {error}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-10 rounded-2xl bg-k-surface1/40 border border-dashed border-k-ghost gap-3">
            <div className="w-12 h-12 rounded-full bg-k-surface2 flex items-center justify-center text-k-text-muted">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <p className="font-bold text-sm text-k-text-dim">Nenhum feedback recebido ainda</p>
              <p className="text-xs text-k-text-muted mt-1.5 leading-relaxed">
                Quando seus alunos corporativos enviarem feedback pelo app, ele aparecerá aqui.
              </p>
            </div>
          </div>
        ) : (
          feedbacks.map((f) => (
            <div key={f.id} className="p-5 rounded-2xl bg-k-surface1/60 border border-k-ghost flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {f.anonymous ? (
                    <div className="w-9 h-9 rounded-full bg-k-surface2 border border-k-ghost flex items-center justify-center text-k-text-muted">
                      <UserRound className="w-4.5 h-4.5" />
                    </div>
                  ) : (
                    <Avatar name={f.studentName ?? '?'} size={36} />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{f.anonymous ? 'Anônimo' : f.studentName}</span>
                    <span className="text-[11px] text-k-text-muted">sobre {f.personalName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="bg-k-primary-dim text-k-primary border-k-primary-soft text-[10px]">
                    Corporativo
                  </Badge>
                  {f.anonymous && (
                    <Badge variant="outline" className="text-k-text-muted border-k-ghost text-[10px]">
                      Anônimo
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-k-text-dim leading-relaxed">{f.content}</p>
              <span className="text-[11px] text-k-text-muted">{formatDate(f.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
