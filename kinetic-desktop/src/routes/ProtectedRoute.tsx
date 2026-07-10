import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { homeForRole } from '../config/nav';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  children: ReactNode;
  /**
   * Papéis autorizados a ver esta rota. Se omitido, basta estar logado.
   * Um papel logado fora da lista é redirecionado para a home dele (não 404),
   * evitando que um EMPRESA caia numa tela de ROOT e vice-versa.
   */
  allowedRoles?: string[];
}

/**
 * Gate de sessão + papel. Enquanto o bootstrap restaura a sessão salva, mostra
 * um esqueleto para não "piscar" o /login.
 */
export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isLoggedIn, isLoadingAuth, currentUser } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-k-bg">
        <div className="flex flex-col gap-4 w-full max-w-sm px-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={homeForRole(currentUser.role)} replace />;
  }

  return <>{children}</>;
}
