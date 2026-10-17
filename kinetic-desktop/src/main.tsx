import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import { Toaster } from '@/components/ui/sonner';
import './theme/theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user": respeita o "reduzir movimento" do sistema operacional. */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
);
