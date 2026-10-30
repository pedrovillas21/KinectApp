import { useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { inviteMessage, whatsappShareUrl } from '../../utils/invite';

/**
 * Botões de envio de um link de convite recém-gerado: copiar a mensagem pronta
 * (link + código) ou abrir o WhatsApp com ela preenchida.
 */
export default function InviteShare({
  code,
  trainerFirstName,
  compact = false,
}: {
  code: string;
  trainerFirstName?: string;
  /** Versão menor, para a linha do convite na lista de pendentes. */
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const message = inviteMessage(code, trainerFirstName);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success('Convite copiado', { description: 'Cole a mensagem na conversa com o aluno.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar. Selecione o link e copie manualmente.');
    }
  };

  const height = compact ? 'h-9 px-3 text-[13px]' : 'h-11 px-[18px] text-sm';

  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={`flex items-center gap-2 rounded-xl border border-white/10 bg-k-surface1 font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text ${height}`}
      >
        {copied ? <Check className="h-4 w-4 text-k-primary" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copiado' : 'Copiar convite'}
      </button>
      <a
        href={whatsappShareUrl(message)}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 rounded-xl bg-[#25D366] font-bold text-black transition-[box-shadow] hover:shadow-[0_0_0_4px_rgba(37,211,102,0.18)] ${height}`}
      >
        <MessageCircle className="h-4 w-4" />
        Enviar no WhatsApp
      </a>
    </div>
  );
}
