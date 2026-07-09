import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KINETIC } from '../theme/kinetic';

/**
 * Exige sessão de PERSONAL: o AuthContext só marca isLoggedIn para esse papel,
 * então basta checar o login. Enquanto o bootstrap restaura a sessão salva,
 * mostra um splash para não "piscar" o /login.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: KINETIC.textMuted,
        }}
      >
        Carregando…
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
