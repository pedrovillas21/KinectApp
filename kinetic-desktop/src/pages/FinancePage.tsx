import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  KeyRound,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import FormDialog, { formInputClass, formLabelClass } from '../components/personal/FormDialog';
import ConfirmDialog from '../components/personal/ConfirmDialog';
import { EASE_OUT, riseItem, staggerContainer } from '../components/motion/primitives';
import {
  PAYMENT_METHODS,
  getFinance,
  payCharge,
  removeStudentPlan,
  reopenCharge,
  savePixKey,
  setStudentPlan,
  waiveCharge,
} from '../services/financeService';
import { qk, refreshTrainerData } from '../services/queryClient';
import { centsToInput, formatBRL, parseBRLToCents } from '../utils/money';
import { dayMonth, monthLabel, shiftMonth, todayIso } from '../utils/dates';
import { whatsappUrl } from '../utils/whatsapp';
import { useAuth } from '../contexts/AuthContext';
import type { ChargeStatus, PaymentMethod, StudentChargeItem } from '../types';

const STATUS_META: Record<ChargeStatus, { label: string; className: string }> = {
  ATRASADO: { label: 'Atrasado', className: 'bg-k-alert/[0.14] text-k-alert' },
  PENDENTE: { label: 'Em aberto', className: 'bg-k-warn/[0.14] text-k-warn' },
  PAGO: { label: 'Pago', className: 'bg-k-success/[0.14] text-k-success' },
  CANCELADO: { label: 'Dispensado', className: 'bg-white/5 text-k-text-muted' },
};

const errorText = (err: unknown, fallback: string) => {
  const data = (err as { response?: { data?: unknown } }).response?.data;
  return typeof data === 'string' && data ? data : fallback;
};

/** Lembrete de cobrança pronto para o WhatsApp. */
function reminderMessage(c: StudentChargeItem, pixKey: string | null, trainerFirstName?: string): string {
  const first = c.studentName.trim().split(/\s+/)[0];
  const hi = `Oi, ${first}!${trainerFirstName ? ` Aqui é ${trainerFirstName}.` : ''}`;
  const value = formatBRL(c.amountCents);
  const when =
    c.status === 'ATRASADO'
      ? `que venceu em ${dayMonth(c.dueDate)}`
      : `com vencimento em ${dayMonth(c.dueDate)}`;
  const pix = pixKey ? `\n\nChave Pix: ${pixKey}` : '';
  return `${hi} Passando para lembrar da mensalidade de ${monthLabel(c.referenceMonth.slice(0, 7)).toLowerCase()}, no valor de ${value}, ${when}.${pix}\n\nSe já pagou, é só me avisar. Obrigado!`;
}

type PlanTarget = { studentId: string; studentName: string; amountCents?: number; dueDay?: number };

export default function FinancePage() {
  const { currentUser } = useAuth();
  const trainerFirstName = currentUser?.nome.trim().split(/\s+/)[0];
  const [month, setMonth] = useState(() => todayIso().slice(0, 7));
  const financeQ = useQuery({ queryKey: qk.finance(month), queryFn: () => getFinance(month) });
  const data = financeQ.data ?? null;
  const loadError = financeQ.isError && !data;
  const [busyId, setBusyId] = useState<string | null>(null);

  const [planTarget, setPlanTarget] = useState<PlanTarget | null>(null);
  const [planAmount, setPlanAmount] = useState('');
  const [planDay, setPlanDay] = useState('10');
  const [savingPlan, setSavingPlan] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<PlanTarget | null>(null);

  const [payTarget, setPayTarget] = useState<StudentChargeItem | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('PIX');
  const [payDate, setPayDate] = useState(todayIso());
  const [paying, setPaying] = useState(false);

  const [pixDraft, setPixDraft] = useState<string | null>(null);

  // Cobrança paga/plano salvo mexem também na caixa "Hoje": recarrega o que estiver na tela.
  const load = () => void refreshTrainerData();

  const run = async (id: string, action: () => Promise<void>, success: string, failure: string) => {
    setBusyId(id);
    try {
      await action();
      toast.success(success);
      load();
    } catch (err) {
      toast.error(errorText(err, failure));
    } finally {
      setBusyId(null);
    }
  };

  const openPlan = (target: PlanTarget) => {
    setPlanTarget(target);
    setPlanAmount(target.amountCents ? centsToInput(target.amountCents) : '');
    setPlanDay(String(target.dueDay ?? 10));
  };

  const planCents = parseBRLToCents(planAmount);
  const planDayNum = Number(planDay);
  const planValid = planCents !== null && planCents >= 100 && planDayNum >= 1 && planDayNum <= 28;

  const handleSavePlan = async () => {
    if (!planTarget || !planValid || planCents === null) return;
    setSavingPlan(true);
    try {
      await setStudentPlan(planTarget.studentId, planCents, planDayNum);
      toast.success(`Mensalidade de ${planTarget.studentName.split(' ')[0]} salva`);
      setPlanTarget(null);
      load();
    } catch (err) {
      toast.error(errorText(err, 'Não foi possível salvar a mensalidade.'));
    } finally {
      setSavingPlan(false);
    }
  };

  const handlePay = async () => {
    if (!payTarget) return;
    setPaying(true);
    try {
      await payCharge(payTarget.id, payMethod, payDate);
      toast.success(`Pagamento de ${payTarget.studentName.split(' ')[0]} registrado`);
      setPayTarget(null);
      load();
    } catch (err) {
      toast.error(errorText(err, 'Não foi possível registrar o pagamento.'));
    } finally {
      setPaying(false);
    }
  };

  const handleSavePix = async () => {
    if (pixDraft === null) return;
    try {
      await savePixKey(pixDraft);
      toast.success(pixDraft.trim() ? 'Chave Pix salva' : 'Chave Pix removida');
      setPixDraft(null);
      load();
    } catch (err) {
      toast.error(errorText(err, 'Não foi possível salvar a chave Pix.'));
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-k-bg text-k-text">
      <header className="z-30 flex shrink-0 flex-wrap items-center gap-3.5 border-b border-k-ghost bg-k-bg/85 px-8 py-3.5 backdrop-blur-[14px]">
        <Link
          to="/students"
          aria-label="Voltar para alunos"
          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
        >
          <ArrowLeft className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-x-0.5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight font-stretch-semi-expanded">Financeiro</h1>
          <p className="text-[12.5px] text-k-text-muted">Mensalidades dos seus alunos</p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-[14px] border border-k-ghost bg-k-surface1 p-1">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-k-text-dim hover:bg-k-surface2 hover:text-k-text"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[150px] text-center text-sm font-semibold">{monthLabel(month)}</span>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-k-text-dim hover:bg-k-surface2 hover:text-k-text"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-8 pb-16 pt-10">
          {loadError ? (
            <div className="rounded-[18px] border border-dashed border-white/[0.14] p-10 text-center">
              <p className="text-k-text-dim">Não foi possível carregar o financeiro.</p>
              <button
                type="button"
                onClick={() => load()}
                className="mt-4 h-10 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold hover:bg-k-surface2"
              >
                Tentar de novo
              </button>
            </div>
          ) : !data ? (
            <div role="status" aria-label="Carregando financeiro" className="k-skeleton h-32 rounded-[18px] bg-k-surface1" />
          ) : (
            <>
              <motion.section
                aria-label="Resumo do mês"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4"
              >
                <MoneyTile label="Previsto no mês" icon={<Wallet className="h-[18px] w-[18px]" />} cents={data.expectedCents} />
                <MoneyTile label="Recebido" icon={<Check className="h-[18px] w-[18px]" />} cents={data.receivedCents} tone="success" />
                <MoneyTile label="Em aberto" icon={<Clock className="h-[18px] w-[18px]" />} cents={data.pendingCents} tone="warn" />
                <MoneyTile
                  label="Atrasado"
                  icon={<AlertTriangle className="h-[18px] w-[18px]" />}
                  cents={data.overdueCents}
                  tone="alert"
                  foot={data.overdueCount > 0 ? `${data.overdueCount} cobrança${data.overdueCount === 1 ? '' : 's'}` : 'Nada atrasado'}
                />
              </motion.section>

              <PixKeyBar
                pixKey={data.pixKey}
                draft={pixDraft}
                onEdit={() => setPixDraft(data.pixKey ?? '')}
                onChange={setPixDraft}
                onSave={() => void handleSavePix()}
                onCancel={() => setPixDraft(null)}
              />

              <section aria-label="Cobranças" className="flex flex-col gap-4">
                <h2 className="font-display text-[22px] font-extrabold tracking-tight font-stretch-semi-expanded">
                  Cobranças
                </h2>
                {data.charges.length === 0 ? (
                  <p className="rounded-[18px] border border-dashed border-white/[0.14] p-8 text-center text-sm text-k-text-muted">
                    {data.plans.length === 0
                      ? 'Defina a mensalidade dos seus alunos abaixo para acompanhar os pagamentos aqui.'
                      : 'Nenhuma cobrança neste mês.'}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {data.charges.map((c) => (
                      <ChargeRow
                        key={c.id}
                        charge={c}
                        busy={busyId === c.id}
                        pixKey={data.pixKey}
                        trainerFirstName={trainerFirstName}
                        currentMonth={month}
                        onPay={() => {
                          setPayTarget(c);
                          setPayMethod('PIX');
                          setPayDate(todayIso());
                        }}
                        onWaive={() => void run(c.id, () => waiveCharge(c.id), 'Cobrança dispensada', 'Não foi possível dispensar.')}
                        onReopen={() => void run(c.id, () => reopenCharge(c.id), 'Cobrança reaberta', 'Não foi possível reabrir.')}
                      />
                    ))}
                  </ul>
                )}
              </section>

              <section aria-label="Mensalidades" className="flex flex-col gap-4">
                <h2 className="font-display text-[22px] font-extrabold tracking-tight font-stretch-semi-expanded">
                  Mensalidades
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
                  {data.plans.map((p) => (
                    <div key={p.studentId} className="flex items-center gap-3 rounded-[16px] border border-k-ghost bg-k-surface1 p-4">
                      <Avatar name={p.studentName} avatarUrl={p.studentAvatarUrl} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.studentName}</p>
                        <p className="text-[12.5px] text-k-text-muted">
                          {formatBRL(p.amountCents)} · vence dia {p.dueDay}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Editar mensalidade de ${p.studentName}`}
                        onClick={() => openPlan(p)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-k-text-dim hover:bg-k-surface2 hover:text-k-text"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(p)}
                        className="h-9 rounded-xl border border-white/10 px-2.5 text-[12.5px] font-semibold text-k-text-dim hover:border-k-alert/40 hover:text-k-alert"
                      >
                        Encerrar
                      </button>
                    </div>
                  ))}
                  {data.studentsWithoutPlan.map((s) => (
                    <div
                      key={s.studentId}
                      className="flex items-center gap-3 rounded-[16px] border border-dashed border-white/[0.14] p-4"
                    >
                      <Avatar name={s.studentName} avatarUrl={s.studentAvatarUrl} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{s.studentName}</p>
                        <p className="text-[12.5px] text-k-text-muted">Sem mensalidade definida</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPlan(s)}
                        className="flex h-9 items-center gap-1.5 rounded-xl bg-k-primary px-3 text-[13px] font-bold text-k-on-primary"
                      >
                        <Plus className="h-4 w-4" />
                        Definir
                      </button>
                    </div>
                  ))}
                </div>
                {data.plans.length === 0 && data.studentsWithoutPlan.length === 0 && (
                  <p className="text-sm text-k-text-muted">Convide alunos para definir as mensalidades deles.</p>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <FormDialog
        open={!!planTarget}
        title={`Mensalidade de ${planTarget?.studentName.split(' ')[0] ?? ''}`}
        description="As cobranças são criadas todo mês com este valor. Mudar o valor ajusta as cobranças em aberto a partir deste mês."
        submitLabel="Salvar mensalidade"
        busy={savingPlan}
        submitDisabled={!planValid}
        onSubmit={() => void handleSavePlan()}
        onCancel={() => setPlanTarget(null)}
      >
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <label className="flex flex-col gap-2">
            <span className={formLabelClass}>Valor (R$)</span>
            <input
              inputMode="decimal"
              placeholder="150,00"
              value={planAmount}
              onChange={(e) => setPlanAmount(e.target.value)}
              autoFocus
              className={formInputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={formLabelClass}>Vence dia</span>
            <input
              type="number"
              min={1}
              max={28}
              value={planDay}
              onChange={(e) => setPlanDay(e.target.value)}
              className={formInputClass}
            />
          </label>
        </div>
        {planAmount && !planValid && (
          <p className="text-[13px] text-k-alert">Informe um valor (mínimo R$ 1,00) e um dia de 1 a 28.</p>
        )}
      </FormDialog>

      <FormDialog
        open={!!payTarget}
        title="Registrar pagamento"
        description={
          payTarget
            ? `${payTarget.studentName} · ${formatBRL(payTarget.amountCents)} · ${monthLabel(payTarget.referenceMonth.slice(0, 7))}`
            : undefined
        }
        submitLabel="Registrar"
        busy={paying}
        onSubmit={() => void handlePay()}
        onCancel={() => setPayTarget(null)}
      >
        <div className="flex flex-col gap-2">
          <span className={formLabelClass}>Forma de pagamento</span>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={payMethod === m.id}
                onClick={() => setPayMethod(m.id)}
                className={`h-9 rounded-xl border px-3 text-[13px] font-semibold transition-colors ${
                  payMethod === m.id
                    ? 'border-k-primary/50 bg-k-primary-dim text-k-primary'
                    : 'border-white/10 text-k-text-dim hover:text-k-text'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-2">
          <span className={formLabelClass}>Data do pagamento</span>
          <input
            type="date"
            max={todayIso()}
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            className={formInputClass}
          />
        </label>
      </FormDialog>

      <ConfirmDialog
        open={!!removeTarget}
        title={`Encerrar a mensalidade de ${removeTarget?.studentName.split(' ')[0] ?? ''}?`}
        description="Novas cobranças deixam de ser criadas e as que ainda não venceram são canceladas. Cobranças atrasadas continuam na lista."
        confirmLabel="Encerrar mensalidade"
        destructive
        busy={busyId === removeTarget?.studentId}
        onConfirm={() => {
          if (!removeTarget) return;
          const target = removeTarget;
          void run(target.studentId, () => removeStudentPlan(target.studentId), 'Mensalidade encerrada', 'Não foi possível encerrar.').then(
            () => setRemoveTarget(null),
          );
        }}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}

function MoneyTile({
  label,
  icon,
  cents,
  tone = 'primary',
  foot,
}: {
  label: string;
  icon: ReactNode;
  cents: number;
  tone?: 'primary' | 'success' | 'warn' | 'alert';
  foot?: string;
}) {
  const toneClass = {
    primary: 'bg-k-primary-dim text-k-primary',
    success: 'bg-k-success/[0.12] text-k-success',
    warn: 'bg-k-warn/[0.12] text-k-warn',
    alert: 'bg-k-alert/[0.12] text-k-alert',
  }[tone];
  return (
    <motion.div variants={riseItem} className="flex flex-col gap-3 rounded-[18px] border border-k-ghost bg-k-surface1 p-5">
      <span className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-k-text-dim">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[11px] ${toneClass}`}>{icon}</span>
      </span>
      <span className="font-display text-[28px] font-extrabold leading-none tabular-nums">{formatBRL(cents)}</span>
      {foot && <span className="text-[12.5px] text-k-text-muted">{foot}</span>}
    </motion.div>
  );
}

function PixKeyBar({
  pixKey,
  draft,
  onEdit,
  onChange,
  onSave,
  onCancel,
}: {
  pixKey: string | null;
  draft: string | null;
  onEdit: () => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="flex flex-wrap items-center gap-3 rounded-[16px] border border-k-ghost bg-k-surface1 px-4 py-3"
    >
      <KeyRound className="h-4 w-4 text-k-primary" />
      {draft === null ? (
        <>
          <span className="text-sm text-k-text-dim">
            {pixKey ? (
              <>
                Chave Pix nos lembretes: <strong className="font-semibold text-k-text">{pixKey}</strong>
              </>
            ) : (
              'Cadastre sua chave Pix para ela ir junto no lembrete de cobrança.'
            )}
          </span>
          <button type="button" onClick={onEdit} className="ml-auto text-[13px] font-semibold text-k-primary hover:underline">
            {pixKey ? 'Alterar' : 'Cadastrar chave Pix'}
          </button>
        </>
      ) : (
        <form
          className="flex flex-1 flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <input
            autoFocus
            maxLength={140}
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            placeholder="CPF, e-mail, celular ou chave aleatória"
            className="h-10 min-w-[240px] flex-1 rounded-xl border border-white/10 bg-k-bg px-3 text-sm focus:border-k-primary"
          />
          <button type="submit" className="h-10 rounded-xl bg-k-primary px-4 text-sm font-bold text-k-on-primary">
            Salvar
          </button>
          <button type="button" onClick={onCancel} className="h-10 rounded-xl border border-white/10 px-3 text-sm text-k-text-dim">
            Cancelar
          </button>
        </form>
      )}
    </motion.div>
  );
}

function ChargeRow({
  charge: c,
  busy,
  pixKey,
  trainerFirstName,
  currentMonth,
  onPay,
  onWaive,
  onReopen,
}: {
  charge: StudentChargeItem;
  busy: boolean;
  pixKey: string | null;
  trainerFirstName?: string;
  currentMonth: string;
  onPay: () => void;
  onWaive: () => void;
  onReopen: () => void;
}) {
  const meta = STATUS_META[c.status];
  const open = c.status === 'PENDENTE' || c.status === 'ATRASADO';
  const otherMonth = c.referenceMonth.slice(0, 7) !== currentMonth;
  const method = PAYMENT_METHODS.find((m) => m.id === c.paymentMethod)?.label;
  // Aluno excluiu a conta: o pagamento fica como registro de renda e não pode ser alterado.
  const retained = c.studentId === null;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-[16px] border border-k-ghost bg-k-surface1 p-4">
      <Avatar name={c.studentName} avatarUrl={c.studentAvatarUrl} size={40} />
      <div className="min-w-[180px] flex-1">
        <p className="truncate text-sm font-semibold">
          {c.studentName}
          {!c.activeStudent && !retained && (
            <span className="ml-2 text-[12px] font-normal text-k-text-muted">(saiu da carteira)</span>
          )}
        </p>
        <p className="text-[12.5px] text-k-text-muted">
          {formatBRL(c.amountCents)} · vence {dayMonth(c.dueDate)}
          {otherMonth && ` · ref. ${monthLabel(c.referenceMonth.slice(0, 7)).toLowerCase()}`}
          {c.status === 'PAGO' && c.paidAt && ` · pago em ${dayMonth(c.paidAt)}${method ? ` (${method})` : ''}`}
        </p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${meta.className}`}>{meta.label}</span>
      <div className="flex flex-wrap gap-2">
        {open && (
          <>
            {c.studentPhone && (
              <a
                href={whatsappUrl(c.studentPhone, reminderMessage(c, pixKey, trainerFirstName))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#25D366]/40 px-3 text-[13px] font-semibold text-[#25D366] hover:bg-[#25D366]/10"
              >
                <MessageCircle className="h-4 w-4" />
                Lembrar
              </a>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={onWaive}
              className="h-9 rounded-xl border border-white/10 px-3 text-[13px] font-semibold text-k-text-dim hover:text-k-text disabled:opacity-50"
            >
              Dispensar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onPay}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-k-primary px-3 text-[13px] font-bold text-k-on-primary disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Recebi
            </button>
          </>
        )}
        {!open && !retained && (
          <button
            type="button"
            disabled={busy}
            onClick={onReopen}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-[13px] font-semibold text-k-text-dim hover:text-k-text disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Desfazer
          </button>
        )}
      </div>
    </li>
  );
}
