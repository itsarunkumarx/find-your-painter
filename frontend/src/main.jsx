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
import { registerSW } from 'virtual:pwa-register'

// Capture PWA install prompt globally
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  // Dispatch a custom event so components can listen for it if they missed it
  window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
});

// Register Service Worker
const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    console.log('SW Registered:', swUrl);
  },
  onRegisterError(error) {
    console.error('SW Registration error:', error);
  }
})

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
