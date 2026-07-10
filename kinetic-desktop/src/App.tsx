import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppShell from './layouts/AppShell';
import { useAuth } from './contexts/AuthContext';
import { homeForRole } from './config/nav';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentsListPage from './pages/StudentsListPage';
import StudentDetailPage from './pages/StudentDetailPage';
import ComingSoonPage from './pages/ComingSoonPage';
import RootHomePage from './pages/root/RootHomePage';
import CompaniesPage from './pages/root/CompaniesPage';
import PersonaisPage from './pages/root/PersonaisPage';
import CompliancePage from './pages/root/CompliancePage';
import EmpresaHomePage from './pages/empresa/EmpresaHomePage';
import FuncionariosPage from './pages/empresa/FuncionariosPage';
import ClientesPage from './pages/empresa/ClientesPage';
import FeedbacksPage from './pages/empresa/FeedbacksPage';
import AnalyticsPage from './pages/empresa/AnalyticsPage';

/** Catch-all: manda cada papel para a sua home (ou /login se deslogado). */
function RoleAwareRedirect() {
  const { isLoggedIn, isLoadingAuth, currentUser } = useAuth();
  if (isLoadingAuth) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(currentUser?.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* PERSONAL — telas atuais preservadas (header próprio), sem regressão. */}
      <Route
        path="/students"
        element={
          <ProtectedRoute allowedRoles={['PERSONAL']}>
            <StudentsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:id"
        element={
          <ProtectedRoute allowedRoles={['PERSONAL']}>
            <StudentDetailPage />
          </ProtectedRoute>
        }
      />

      {/* ROOT — app-shell com sidebar + rotas filhas. */}
      <Route
        path="/root"
        element={
          <ProtectedRoute allowedRoles={['ROOT']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootHomePage />} />
        <Route path="empresas" element={<CompaniesPage />} />
        <Route path="personais" element={<PersonaisPage />} />
        <Route path="usuarios" element={<CompliancePage />} />
        <Route
          path="auditoria"
          element={<ComingSoonPage title="Auditoria" subtitle="Logs de sistema e histórico de acessos" />}
        />
        <Route
          path="faturamento"
          element={<ComingSoonPage title="Faturamento" subtitle="Métricas de negócio macro" />}
        />
      </Route>

      {/* EMPRESA — app-shell com sidebar + rotas filhas. */}
      <Route
        path="/empresa"
        element={
          <ProtectedRoute allowedRoles={['EMPRESA']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmpresaHomePage />} />
        <Route path="funcionarios" element={<FuncionariosPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="feedbacks" element={<FeedbacksPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>

      <Route path="*" element={<RoleAwareRedirect />} />
    </Routes>
  );
}
