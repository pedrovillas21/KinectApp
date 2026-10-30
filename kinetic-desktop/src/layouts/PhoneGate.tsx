import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import PhoneDialog from '../components/PhoneDialog';
import { getMyPhone } from '../services/userService';
import { qk, queryClient } from '../services/queryClient';
import { useTrainerLiveUpdates } from '../services/trainerEvents';

/**
 * Celular do personal logado (DDD + número). Buscado uma vez; o PhoneDialog atualiza
 * o cache ao salvar. `phone` é null se ainda não cadastrado ou se a busca falhou.
 */
export function useMyPhone() {
  const query = useQuery({ queryKey: qk.myPhone, queryFn: getMyPhone, staleTime: Infinity });
  return {
    query,
    phone: query.data ?? null,
    setPhone: (phone: string) => queryClient.setQueryData(qk.myPhone, phone),
  };
}

/**
 * Layout das rotas do PERSONAL: o celular virou obrigatório (atalho de WhatsApp com
 * os alunos) e o backend responde PHONE_REQUIRED para o resto da API enquanto ele
 * faltar. Por isso as telas só montam depois do cadastro — assim já carregam os dados
 * liberados. Falha de rede na checagem não bloqueia (a própria tela mostra o erro).
 */
export default function PhoneGate() {
  const { signOut } = useAuth();
  const { query, setPhone } = useMyPhone();
  const missing = query.data === null;
  // Avisos em tempo real só depois do celular: antes disso o backend barra a API.
  useTrainerLiveUpdates(!query.isPending && !missing);

  if (query.isPending) {
    return <div className="h-dvh w-full bg-k-bg" />;
  }

  if (missing) {
    return (
      <div className="h-dvh w-full bg-k-bg">
        <PhoneDialog
          open
          onOpenChange={() => undefined}
          phone={null}
          onSaved={setPhone}
          required
          onSignOut={() => void signOut()}
        />
      </div>
    );
  }

  return <Outlet />;
}
