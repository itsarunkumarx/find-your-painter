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

// Register service worker ONLY in production.
// In development, we forcefully unregister to prevent HMR/WebSocket interference.
if (!import.meta.env.DEV) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
    });
  }).catch(err => {
    console.error('[SW] Failed to load virtual:pwa-register:', err);
  });
} else {
  // Prevent older Service Workers from hijacking local dev traffic
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((boolean) => {
          if (boolean) console.log('[SW] Successfully unregistered existing worker for dev stability');
        });
      }
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <BrowserRouter>
            <AuthProvider>
              <SocketProvider>
                <App />
              </SocketProvider>
            </AuthProvider>
          </BrowserRouter>
        </GoogleOAuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
