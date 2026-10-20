import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BellOff, ChevronRight, MessageCircle, ShieldCheck } from 'lucide-react';
import Avatar from '../Avatar';
import { EASE_OUT } from '../motion/primitives';
import { whatsappUrl } from '../../utils/whatsapp';
import type { RiskAlert, StudentEngagement, TrainerLink } from '../../types';

/** "Já falei com o aluno" esconde o alerta por alguns dias (só neste navegador). */
const SNOOZE_KEY = 'kinetic:risk-snooze';
const SNOOZE_DAYS = 3;
const COLLAPSED_LIMIT = 6;

type SnoozeMap = Record<string, number>;

function readSnoozes(): SnoozeMap {
  try {
    const raw = localStorage.getItem(SNOOZE_KEY);
    const parsed = raw ? (JSON.parse(raw) as SnoozeMap) : {};
    const now = Date.now();
    // Descarta adiamentos vencidos para o mapa não crescer para sempre.
    return Object.fromEntries(Object.entries(parsed).filter(([, until]) => until > now));
  } catch {
    return {};
  }
}

function writeSnoozes(map: SnoozeMap) {
  try {
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
  } catch {
    // Sem storage (aba anônima/bloqueio): o adiamento vale só até recarregar.
  }
}

/** Mensagem de WhatsApp pronta, conforme o motivo principal do alerta. */
function outreachMessage(alert: RiskAlert, studentFirstName: string, trainerFirstName?: string): string {
  const hi = `Oi, ${studentFirstName}!${trainerFirstName ? ` Aqui é ${trainerFirstName}.` : ''}`;
  switch (alert.type) {
    case 'NUNCA_TREINOU':
      return `${hi} Vi que você ainda não registrou nenhum treino no app. Ficou alguma dúvida sobre a ficha? Posso te ajudar a começar.`;
    case 'INATIVO':
      return `${hi} Senti sua falta nos treinos nos últimos dias. Está tudo bem? Se a rotina apertou, posso ajustar a ficha para encaixar melhor.`;
    default:
      return `${hi} Notei que a frequência dos treinos caiu um pouco. Como você está? Podemos ajustar a ficha ou os dias para facilitar.`;
  }
}

const lastSessionLabel = (e: StudentEngagement): string => {
  if (e.daysSinceLastSession === null) return 'Nunca registrou treino';
  if (e.daysSinceLastSession === 0) return 'Último treino hoje';
  if (e.daysSinceLastSession === 1) return 'Último treino ontem';
  return `Último treino há ${e.daysSinceLastSession} dias`;
};

interface Item {
  link: TrainerLink;
  engagement: StudentEngagement;
}

/**
 * Alertas de risco de abandono da carteira: quem precisa de um contato agora,
 * com o motivo e um atalho de WhatsApp com mensagem pronta.
 */
export default function RiskAlerts({
  students,
  engagement,
  trainerFirstName,
}: {
  students: TrainerLink[];
  engagement: Record<string, StudentEngagement>;
  trainerFirstName?: string;
}) {
  const [snoozes, setSnoozes] = useState<SnoozeMap>(readSnoozes);
  const [expanded, setExpanded] = useState(false);
  const [showSnoozed, setShowSnoozed] = useState(false);

  const atRisk: Item[] = students
    .map((link) => ({ link, engagement: engagement[link.peer.id] }))
    .filter((i): i is Item => !!i.engagement && i.engagement.risk !== 'OK')
    // Mais grave primeiro; entre iguais, quem está há mais tempo sem treinar.
    .sort((a, b) => {
      const sev = (i: Item) => (i.engagement.risk === 'ALTO' ? 0 : 1);
      const idle = (i: Item) => i.engagement.daysSinceLastSession ?? 999;
      return sev(a) - sev(b) || idle(b) - idle(a);
    });

  const now = Date.now();
  const snoozedCount = atRisk.filter((i) => (snoozes[i.link.peer.id] ?? 0) > now).length;
  const pending = showSnoozed ? atRisk : atRisk.filter((i) => (snoozes[i.link.peer.id] ?? 0) <= now);
  const shown = expanded ? pending : pending.slice(0, COLLAPSED_LIMIT);

  const snooze = (studentId: string) => {
    const next = { ...readSnoozes(), [studentId]: Date.now() + SNOOZE_DAYS * 86_400_000 };
    writeSnoozes(next);
    setSnoozes(next);
  };

  const unsnooze = (studentId: string) => {
    const next = { ...readSnoozes() };
    delete next[studentId];
    writeSnoozes(next);
    setSnoozes(next);
  };

  return (
    <section id="alertas-de-risco" aria-label="Alertas de risco" className="flex scroll-mt-24 flex-col rounded-xl border border-white/[0.08]">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/[0.07] px-5 py-3.5">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[15px] font-semibold">Precisam de um contato</h2>
          <span className="font-mono text-xs text-k-text-muted">
            {pending.length} {pending.length === 1 ? 'aluno' : 'alunos'}
          </span>
        </div>
        {snoozedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowSnoozed((v) => !v)}
            className="text-[13px] text-k-text-dim hover:text-k-text"
          >
            {showSnoozed ? 'Ocultar adiados' : `${snoozedCount} adiado${snoozedCount === 1 ? '' : 's'} · mostrar`}
          </button>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-4 text-sm text-k-text-dim">
          <ShieldCheck className="h-5 w-5 text-k-success" />
          Nenhum aluno em risco de abandono agora. Bom trabalho!
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-white/[0.06]">
          <AnimatePresence initial={false}>
            {shown.map(({ link, engagement: e }) => {
              const primary = e.alerts[0];
              const high = e.risk === 'ALTO';
              const firstName = link.peer.nome.trim().split(/\s+/)[0] ?? link.peer.nome;
              const isSnoozed = (snoozes[link.peer.id] ?? 0) > now;
              return (
                <motion.li
                  key={link.peer.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isSnoozed ? 0.55 : 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                  className="flex flex-wrap items-start gap-x-3.5 gap-y-3 px-5 py-4"
                >
                  <div className="flex min-w-[280px] flex-1 items-start gap-3.5">
                    <Avatar name={link.peer.nome} avatarUrl={link.peer.avatarUrl} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <p className="truncate font-medium">{link.peer.nome}</p>
                        <span className={`inline-flex items-center gap-1.5 text-xs ${high ? 'text-k-alert' : 'text-k-warn'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${high ? 'bg-k-alert' : 'bg-k-warn'}`} />
                          {high ? 'Risco alto' : 'Atenção'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-k-text-soft">{primary.message}</p>
                      {e.alerts.slice(1).map((a) => (
                        <p key={a.type} className="text-[12.5px] text-k-text-muted">
                          {a.message}
                        </p>
                      ))}
                      <p className="mt-1 font-mono text-xs text-k-text-muted">
                        {lastSessionLabel(e)}
                        {e.adherencePercent !== null &&
                          ` · aderência ${e.adherencePercent}% (${e.adherenceWindowDays} dias)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {link.peer.phone ? (
                      <a
                        href={whatsappUrl(link.peer.phone, outreachMessage(primary, firstName, trainerFirstName))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.12] px-3 text-[13px] text-k-text transition-colors hover:bg-white/[0.06]"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-k-success" />
                        WhatsApp
                      </a>
                    ) : (
                      <span className="flex h-8 items-center px-1 text-xs text-k-text-muted">
                        Sem WhatsApp cadastrado
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => (isSnoozed ? unsnooze(link.peer.id) : snooze(link.peer.id))}
                      title={isSnoozed ? undefined : `Esconde este alerta por ${SNOOZE_DAYS} dias`}
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-k-text-dim transition-colors hover:bg-white/[0.06] hover:text-k-text"
                    >
                      <BellOff className="h-3.5 w-3.5" />
                      {isSnoozed ? 'Reativar alerta' : 'Já entrei em contato'}
                    </button>
                    <Link
                      to={`/students/${link.peer.id}`}
                      className="flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-k-text-dim transition-colors hover:text-k-text"
                    >
                      Ver aluno
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {pending.length > COLLAPSED_LIMIT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mx-5 my-3 self-start text-[13px] text-k-primary hover:underline"
        >
          {expanded ? 'Mostrar menos' : `Ver todos (${pending.length})`}
        </button>
      )}
    </section>
  );
}
