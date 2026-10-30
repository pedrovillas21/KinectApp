import { useEffect } from 'react';

import {
  clearPendingInviteCode,
  getPendingInviteCode,
  redeemErrorMessage,
  redeemInviteCode,
} from '../services/trainerService';
import { showAlert } from '../components/ui/AlertHost';

/**
 * Assim que o aluno entra, resgata o código de convite digitado no cadastro, só se
 * foi esta conta que o digitou. Erro definitivo (400/402/404/409) descarta o código
 * guardado e avisa o aluno (com 402 o código segue válido e pode ser usado depois em
 * Perfil); falha de rede mantém para a próxima entrada.
 */
export default function usePendingInviteRedeem(userEmail: string | null) {
  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;

    (async () => {
      const code = await getPendingInviteCode(userEmail);
      if (!code || cancelled) return;
      try {
        const link = await redeemInviteCode(code);
        await clearPendingInviteCode();
        showAlert('Personal conectado', `Agora ${link.peer.nome} acompanha seus treinos.`);
      } catch (e) {
        const status = (e as { response?: { status?: number } }).response?.status;
        if (status === 400 || status === 402 || status === 404 || status === 409) {
          await clearPendingInviteCode();
          showAlert('Código de convite', redeemErrorMessage(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userEmail]);
}
