import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppShell from './layouts/AppShell';
import PhoneGate from './layouts/PhoneGate';
import { useAuth } from './contexts/AuthContext';
import { homeForRole } from './config/nav';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import InvitePage from './pages/InvitePage';
import BillingPage from './pages/BillingPage';
import DemoCheckoutPage from './pages/DemoCheckoutPage';
import FinancePage from './pages/FinancePage';
import MyProfilePage from './pages/MyProfilePage';
import EvolutionReportPage from './pages/EvolutionReportPage';
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
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      {/* Link de convite do personal: público, aberto pelo aluno no celular. */}
      <Route path="/convite/:code" element={<InvitePage />} />

      {/* PERSONAL — telas atuais preservadas (header próprio), sem regressão.
          PhoneGate exige o celular (WhatsApp) antes de liberar o painel. */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['PERSONAL']}>
            <PhoneGate />
          </ProtectedRoute>
        }
      >
        <Route path="/students" element={<StudentsListPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/students/:id/relatorio" element={<EvolutionReportPage />} />
        <Route path="/assinatura" element={<BillingPage />} />
        <Route path="/assinatura/checkout-demo" element={<DemoCheckoutPage />} />
        <Route path="/financeiro" element={<FinancePage />} />
        <Route path="/perfil" element={<MyProfilePage />} />
      </Route>

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
