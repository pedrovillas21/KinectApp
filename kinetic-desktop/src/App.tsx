import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppShell from './layouts/AppShell';
import PhoneGate from './layouts/PhoneGate';
import PersonalShell from './layouts/PersonalShell';
import { useAuth } from './contexts/AuthContext';
import { homeForRole } from './config/nav';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import { getNetworkAnalytics } from './services/donoService';
import { PRIVACY_POLICY, TERMS_OF_USE } from './legal/documents';

// Telas fora do login vêm sob demanda: quem abre o login não baixa gráficos e telas de
// todos os papéis. Na troca de rota o React Router segura a tela atual até a nova carregar.
// 2FA só para contas de gestão, e traz o gerador de QR code.
const TwoFactorPage = lazy(() => import('./pages/TwoFactorPage'));
const InvitePage = lazy(() => import('./pages/InvitePage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const DemoCheckoutPage = lazy(() => import('./pages/DemoCheckoutPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const MyProfilePage = lazy(() => import('./pages/MyProfilePage'));
const EvolutionReportPage = lazy(() => import('./pages/EvolutionReportPage'));
const StudentsListPage = lazy(() => import('./pages/StudentsListPage'));
const StudentDetailPage = lazy(() => import('./pages/StudentDetailPage'));
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'));
const RootHomePage = lazy(() => import('./pages/root/RootHomePage'));
const CompaniesPage = lazy(() => import('./pages/root/CompaniesPage'));
const PersonaisPage = lazy(() => import('./pages/root/PersonaisPage'));
const CompliancePage = lazy(() => import('./pages/root/CompliancePage'));
const AuditEventsPage = lazy(() => import('./pages/root/audit/AuditEventsPage'));
const AuditAccessLogsPage = lazy(() => import('./pages/root/audit/AuditAccessLogsPage'));
const AuditAiPage = lazy(() => import('./pages/root/audit/AuditAiPage'));
const AuditLgpdPage = lazy(() => import('./pages/root/audit/AuditLgpdPage'));
const EmpresaHomePage = lazy(() => import('./pages/empresa/EmpresaHomePage'));
const FuncionariosPage = lazy(() => import('./pages/empresa/FuncionariosPage'));
const ClientesPage = lazy(() => import('./pages/empresa/ClientesPage'));
const FeedbacksPage = lazy(() => import('./pages/empresa/FeedbacksPage'));
const AnalyticsPage = lazy(() => import('./pages/empresa/AnalyticsPage'));
const UnitsPage = lazy(() => import('./pages/dono/UnitsPage'));
const UnitDetailPage = lazy(() => import('./pages/dono/UnitDetailPage'));

/** Catch-all: manda cada papel para a sua home (ou /login se deslogado). */
function RoleAwareRedirect() {
  const { isLoggedIn, isLoadingAuth, currentUser } = useAuth();
  if (isLoadingAuth) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(currentUser?.role)} replace />;
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Segunda etapa das contas de gestão (dono, filial, ROOT): app autenticador. */}
        <Route path="/login/2fa" element={<TwoFactorPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* Link de convite do personal: público, aberto pelo aluno no celular. */}
        <Route path="/convite/:code" element={<InvitePage />} />
        {/* Públicas: o app, as lojas e o cadastro apontam para cá. */}
        <Route path="/termos" element={<LegalPage doc={TERMS_OF_USE} />} />
        <Route path="/privacidade" element={<LegalPage doc={PRIVACY_POLICY} />} />

        {/* PERSONAL — telas atuais preservadas (header próprio), sem regressão.
            PhoneGate exige o celular (WhatsApp) antes de liberar o painel. */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['PERSONAL']}>
              <PhoneGate />
            </ProtectedRoute>
          }
        >
          <Route element={<PersonalShell />}>
            <Route path="/students" element={<StudentsListPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/assinatura" element={<BillingPage />} />
            <Route path="/financeiro" element={<FinancePage />} />
            <Route path="/perfil" element={<MyProfilePage />} />
          </Route>
          {/* Sem barra lateral: relatório para imprimir e checkout de demonstração. */}
          <Route path="/students/:id/relatorio" element={<EvolutionReportPage />} />
          <Route path="/assinatura/checkout-demo" element={<DemoCheckoutPage />} />
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
          {/* Auditoria: submenu na barra lateral. A key separa o estado (filtros) de cada categoria. */}
          <Route path="auditoria">
            <Route index element={<Navigate to="acoes" replace />} />
            <Route path="acoes" element={<AuditEventsPage key="ADMIN" category="ADMIN" />} />
            <Route path="seguranca" element={<AuditEventsPage key="SECURITY" category="SECURITY" />} />
            <Route path="acessos" element={<AuditAccessLogsPage />} />
            <Route path="saude" element={<AuditEventsPage key="HEALTH" category="HEALTH" />} />
            <Route path="ia" element={<AuditAiPage />} />
            <Route path="cobranca" element={<AuditEventsPage key="BILLING" category="BILLING" />} />
            <Route path="lgpd" element={<AuditLgpdPage />} />
          </Route>
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

        {/* DONO — rede de empresas: cadastra e acompanha as filiais. */}
        <Route
          path="/dono"
          element={
            <ProtectedRoute allowedRoles={['DONO']}>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <AnalyticsPage
                load={getNetworkAnalytics}
                title="Visão geral da rede"
                subtitle="Todas as filiais somadas: retenção, volume e desempenho"
              />
            }
          />
          <Route path="filiais" element={<UnitsPage />} />
          <Route path="filiais/:id" element={<UnitDetailPage />} />
        </Route>

        <Route path="*" element={<RoleAwareRedirect />} />
      </Routes>
    </Suspense>
  );
}
