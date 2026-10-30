import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import { Toaster } from '@/components/ui/sonner';
import './theme/theme.css';

// Painel aberto durante um deploy: os pedaços antigos das telas somem do servidor e a
// próxima tela não carrega. Recarregar busca a versão nova.
window.addEventListener('vite:preloadError', () => window.location.reload());

// PWA: só em produção (em dev o cache do SW atrapalharia o HMR).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user": respeita o "reduzir movimento" do sistema operacional. */}
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            {/* No celular, acima da barra de navegação inferior (60px + área segura). */}
            <Toaster richColors position="bottom-right" mobileOffset={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }} />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </MotionConfig>
  </StrictMode>,
);
