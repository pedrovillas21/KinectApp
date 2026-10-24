import { useEffect, useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PhoneDialog from '../components/PhoneDialog';
import { getMyPhone } from '../services/userService';
import { useTrainerLiveUpdates } from '../services/trainerEvents';

type PhoneState = 'checking' | 'missing' | 'ok';

interface PhoneGateContext {
  /** Celular (DDD + número); null só se a checagem falhou por rede. */
  phone: string | null;
  setPhone: (phone: string) => void;
}

/** Celular do personal logado, para as telas sob o PhoneGate (ex.: botão do cabeçalho). */
export const usePersonalPhone = (): PhoneGateContext => useOutletContext<PhoneGateContext>();

/**
 * Layout das rotas do PERSONAL: o celular virou obrigatório (atalho de WhatsApp com
 * os alunos) e o backend responde PHONE_REQUIRED para o resto da API enquanto ele
 * faltar. Por isso as telas só montam depois do cadastro — assim já carregam os dados
 * liberados. Falha de rede na checagem não bloqueia (a própria tela mostra o erro).
 */
export default function PhoneGate() {
  const { signOut } = useAuth();
  const [state, setState] = useState<PhoneState>('checking');
  const [phone, setPhone] = useState<string | null>(null);
  // Avisos em tempo real só depois do celular: antes disso o backend barra a API.
  useTrainerLiveUpdates(state === 'ok');

  useEffect(() => {
    let active = true;
    getMyPhone()
      .then((current) => {
        if (!active) return;
        setPhone(current);
        setState(current ? 'ok' : 'missing');
      })
      .catch(() => active && setState('ok'));
    return () => {
      active = false;
    };
  }, []);

  if (state === 'checking') {
    return <div className="h-screen w-screen bg-k-bg" />;
  }

  if (state === 'missing') {
    return (
      <div className="h-screen w-screen bg-k-bg">
        <PhoneDialog
          open
          onOpenChange={() => undefined}
          phone={null}
          onSaved={(saved) => {
            setPhone(saved);
            setState('ok');
          }}
          required
          onSignOut={() => void signOut()}
        />
      </div>
    );
  }

  return <Outlet context={{ phone, setPhone } satisfies PhoneGateContext} />;
}
