import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FlaskConical } from 'lucide-react';
import { confirmDemoAiPack, confirmDemoPayment, getBilling } from '../services/billingService';
import { qk, queryClient } from '../services/queryClient';
import { errorMessage } from '../utils/errors';
import { formatBRL } from '../utils/money';
import type { BillingOverview } from '../types';

/**
 * Checkout de mentira do modo demo (billing.gateway=demo): no lugar da página
 * de pagamento do Asaas, simula a confirmação para testar o fluxo inteiro.
 * Com ?item=ai-pack paga o pacote extra de IA em vez da assinatura.
 */
/** O que esta tela cobra: o pacote de IA ou o plano pendente. Fora do gateway demo, nada. */
function checkoutItem(billing: BillingOverview | null, isPack: boolean) {
  if (!billing || billing.gatewayMode !== 'DEMO') return null;
  if (isPack) {
    if (!billing.aiPackCheckoutUrl) return null;
    return {
      title: 'Pacote extra de IA',
      detail: `${formatBRL(billing.aiPack.priceCents)} · ${billing.aiPack.credits} fichas com IA, pagamento único`,
      success: `${billing.aiPack.credits} fichas extras liberadas`,
    };
  }
  const plan = billing.plans.find((p) => p.code === billing.plan);
  if (billing.status !== 'PENDENTE' || plan?.priceCents == null) return null;
  return {
    title: `Plano ${plan.name}`,
    detail: `${formatBRL(plan.priceCents)}/mês · ${
      plan.maxStudents === null ? 'alunos ilimitados' : `até ${plan.maxStudents} alunos`
    }`,
    success: `Plano ${plan.name} ativo`,
  };
}

export default function DemoCheckoutPage() {
  const navigate = useNavigate();
  const isPack = useSearchParams()[0].get('item') === 'ai-pack';
  const billingQ = useQuery({ queryKey: qk.billing, queryFn: getBilling });
  const billing = billingQ.data ?? null;
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (billingQ.isError) toast.error('Não foi possível carregar a cobrança.');
  }, [billingQ.isError]);

  const item = checkoutItem(billing, isPack);

  const handlePay = async () => {
    if (!item) return;
    setPaying(true);
    try {
      await (isPack ? confirmDemoAiPack() : confirmDemoPayment());
      await queryClient.invalidateQueries({ queryKey: qk.billing });
      toast.success(item.success, { description: 'Pagamento simulado com sucesso.' });
      navigate('/assinatura', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível simular o pagamento.'));
      setPaying(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-k-bg px-4 text-k-text">
      <div className="flex w-full max-w-[420px] flex-col gap-5 rounded-2xl border border-k-ghost bg-k-surface1 p-7">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-k-warn/10 px-3 py-1 text-[12.5px] font-semibold text-k-warn">
          <FlaskConical className="h-3.5 w-3.5" />
          Checkout de demonstração
        </span>
        {!billing ? (
          <p className="text-sm text-k-text-dim">Carregando…</p>
        ) : item ? (
          <>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{item.title}</h1>
              <p className="mt-1 text-sm text-k-text-dim">{item.detail}</p>
            </div>
            <p className="text-sm leading-relaxed text-k-text-dim">
              Aqui entraria a página de pagamento do Asaas (Pix, boleto ou cartão). Nenhum valor será cobrado.
            </p>
            <button
              type="button"
              onClick={() => void handlePay()}
              disabled={paying}
              className="h-12 rounded-xl bg-k-primary text-sm font-bold text-k-on-primary disabled:opacity-50"
            >
              {paying ? 'Confirmando…' : 'Simular pagamento aprovado'}
            </button>
          </>
        ) : (
          <p className="text-sm text-k-text-dim">Não há cobrança em aberto para pagar.</p>
        )}
        <Link to="/assinatura" className="text-center text-[13px] font-semibold text-k-text-dim hover:text-k-text">
          Voltar para Meu plano
        </Link>
      </div>
    </div>
  );
}
