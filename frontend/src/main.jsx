import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import './i18n'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'

// Capture PWA install prompt globally
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
});

// Production performance boost: Disable console logs in non-dev environments
if (!import.meta.env.DEV) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  // Keep console.warn and console.error for critical visibility
}

// Register service worker for both dev and production to support push notifications.
// Note: In vite.config.js, devOptions.enabled: true must also be set.
import('virtual:pwa-register').then(({ registerSW }) => {
  if (import.meta.env.DEV) console.log('[SW] Attempting registration via virtual:pwa-register');
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (import.meta.env.DEV) console.log('[SW] Registered successfully:', swUrl);
      if (registration && import.meta.env.DEV) console.log('[SW] Registration scope:', registration.scope);
    },
    onRegisterError(error) {
      if (import.meta.env.DEV) console.error('[SW] Registration error:', error);
    }
  });
}).catch(err => {
  if (import.meta.env.DEV) console.error('[SW] Failed to load virtual:pwa-register:', err);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <SocketProvider>
                <App />
              </SocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
