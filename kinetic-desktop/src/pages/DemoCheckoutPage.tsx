import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FlaskConical } from 'lucide-react';
import { billingErrorMessage, confirmDemoPayment, formatBRL, getBilling } from '../services/billingService';
import type { BillingOverview } from '../types';

/**
 * Checkout de mentira do modo demo (billing.gateway=demo): no lugar da página
 * de pagamento do Asaas, simula a confirmação para testar o fluxo inteiro.
 */
export default function DemoCheckoutPage() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    getBilling()
      .then(setBilling)
      .catch(() => toast.error('Não foi possível carregar a cobrança.'));
  }, []);

  const plan = billing?.plans.find((p) => p.code === billing.plan);
  const payable = billing?.gatewayMode === 'DEMO' && billing.status === 'PENDENTE' && plan?.priceCents != null;

  const handlePay = async () => {
    setPaying(true);
    try {
      await confirmDemoPayment();
      toast.success(`Plano ${plan?.name} ativo`, { description: 'Pagamento simulado com sucesso.' });
      navigate('/assinatura', { replace: true });
    } catch (err) {
      toast.error(billingErrorMessage(err, 'Não foi possível simular o pagamento.'));
      setPaying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-k-bg px-4 text-k-text">
      <div className="flex w-full max-w-[420px] flex-col gap-5 rounded-2xl border border-k-ghost bg-k-surface1 p-7">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-k-warn/10 px-3 py-1 text-[12.5px] font-semibold text-k-warn">
          <FlaskConical className="h-3.5 w-3.5" />
          Checkout de demonstração
        </span>
        {!billing ? (
          <p className="text-sm text-k-text-dim">Carregando…</p>
        ) : payable && plan ? (
          <>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Plano {plan.name}</h1>
              <p className="mt-1 text-sm text-k-text-dim">
                {formatBRL(plan.priceCents!)}/mês · até {plan.maxStudents} alunos
              </p>
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
