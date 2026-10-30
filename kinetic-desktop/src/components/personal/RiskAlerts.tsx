import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BellOff, BellRing, ChevronRight, MessageCircle, ShieldCheck } from 'lucide-react';
import Avatar from '../Avatar';
import { EASE_OUT } from '../motion/primitives';
import PauseAlertDialog, { pauseReasonLabel, resumeStudentAlerts } from './PauseAlertDialog';
import { whatsappUrl } from '../../utils/whatsapp';
import type { RiskAlert, StudentEngagement, TrainerLink } from '../../types';
import { dayMonth } from '../../utils/dates';
import { firstNameOf } from '../../utils/names';

const COLLAPSED_LIMIT = 6;

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
 * Alertas de risco ALTO de abandono da carteira (muito tempo sem treinar, nunca
 * treinou, queda forte): quem precisa de um contato agora, com o motivo e um
 * atalho de WhatsApp com mensagem pronta.
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
  const [expanded, setExpanded] = useState(false);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [pausing, setPausing] = useState<Item | null>(null);

  const atRisk: Item[] = students
    .map((link) => ({ link, engagement: engagement[link.peer.id] }))
    // Só os casos graves; o dia a dia (faltou hoje) fica na fila de hoje. Congelado o personal não atende.
    .filter((i): i is Item => !!i.engagement && i.engagement.risk === 'ALTO' && !i.link.frozen)
    // Mais grave primeiro; entre iguais, quem está há mais tempo sem treinar.
    .sort((a, b) => {
      const sev = (i: Item) => (i.engagement.risk === 'ALTO' ? 0 : 1);
      const idle = (i: Item) => i.engagement.daysSinceLastSession ?? 999;
      return sev(a) - sev(b) || idle(b) - idle(a);
    });

  const snoozedCount = atRisk.filter((i) => i.engagement.pause).length;
  const pending = showSnoozed ? atRisk : atRisk.filter((i) => !i.engagement.pause);
  const shown = expanded ? pending : pending.slice(0, COLLAPSED_LIMIT);

  return (
    <section id="alertas-de-risco" aria-label="Alertas de risco" className="flex scroll-mt-24 flex-col rounded-xl border border-white/[0.08]">
      <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5 md:px-5">
        <div className="flex min-w-0 items-baseline gap-2.5 md:gap-3">
          <h2 className="truncate text-[15px] font-semibold">Precisam de um contato</h2>
          <span className="shrink-0 font-mono text-xs text-k-text-muted">
            {pending.length}
            <span className="max-sm:hidden"> {pending.length === 1 ? 'aluno' : 'alunos'}</span>
          </span>
        </div>
        {snoozedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowSnoozed((v) => !v)}
            className="shrink-0 whitespace-nowrap text-[13px] text-k-text-dim hover:text-k-text"
          >
            {showSnoozed ? (
              'Ocultar pausados'
            ) : (
              <>
                {snoozedCount} pausado{snoozedCount === 1 ? '' : 's'}
                <span className="max-sm:hidden"> · mostrar</span>
              </>
            )}
          </button>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4 text-sm text-k-text-dim md:px-5">
          <ShieldCheck className="h-5 w-5 text-k-success" />
          Nenhum aluno em risco alto de abandono agora. Bom trabalho!
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-white/[0.06]">
          <AnimatePresence initial={false}>
            {shown.map(({ link, engagement: e }) => {
              const primary = e.alerts[0];
              const high = e.risk === 'ALTO';
              const firstName = firstNameOf(link.peer.nome);
              const pause = e.pause;
              const isSnoozed = !!pause;
              return (
                <motion.li
                  key={link.peer.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isSnoozed ? 0.55 : 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                  className="flex flex-wrap items-start gap-x-3.5 gap-y-3 px-4 py-4 md:px-5"
                >
                  <div className="flex min-w-[min(280px,100%)] flex-1 items-start gap-3.5">
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
                      {pause && (
                        <p className="mt-1.5 text-[13px] text-k-text-dim">
                          <span className="font-medium text-k-text-soft">
                            {pauseReasonLabel(pause.reason)} · pausado até {dayMonth(pause.until)}
                          </span>
                          {pause.note && ` — ${pause.note}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 max-sm:w-full max-sm:pl-[46px]">
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
                      onClick={() =>
                        isSnoozed ? void resumeStudentAlerts(link.peer.id) : setPausing({ link, engagement: e })
                      }
                      title={isSnoozed ? undefined : 'Anote o motivo e esconda o alerta por alguns dias'}
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-k-text-dim transition-colors hover:bg-white/[0.06] hover:text-k-text"
                    >
                      {isSnoozed ? <BellRing className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                      {isSnoozed ? 'Reativar alerta' : 'Resolver'}
                    </button>
                    <Link
                      to={`/students/${link.peer.id}`}
                      aria-label={`Ver ${link.peer.nome}`}
                      className="flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-k-text-dim transition-colors hover:text-k-text max-sm:ml-auto"
                    >
                      <span className="max-sm:hidden">Ver aluno</span>
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
          className="mx-4 my-3 self-start md:mx-5 text-[13px] text-k-primary hover:underline"
        >
          {expanded ? 'Mostrar menos' : `Ver todos (${pending.length})`}
        </button>
      )}

      {pausing && (
        <PauseAlertDialog
          open
          studentId={pausing.link.peer.id}
          studentName={pausing.link.peer.nome}
          alertMessage={pausing.engagement.alerts[0]?.message}
          current={pausing.engagement.pause}
          onClose={() => setPausing(null)}
        />
      )}
    </section>
  );
}
