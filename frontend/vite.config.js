import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    // dedupe ensures only ONE copy of React is ever loaded — prevents
    // "Invalid hook call" / "Cannot read properties of null (reading 'useContext')"
    // These errors happen when multiple copies of React are bundled together.
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },

  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'Find Your Painter',
        short_name: 'FYPainter',
        description: 'Find and connect with verified professional painters near you.',
        theme_color: '#1a1a2e',
        display: 'standalone',
        background_color: '#1a1a2e',
        start_url: '/',
        scope: '/',
        id: '/',
        orientation: 'portrait-primary',
        categories: ['utilities', 'lifestyle'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false, // Set to false to prevent SW from breaking HMR in dev
        type: 'module'
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('recharts') || id.includes('i18next')) {
              return 'vendor-utils';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    hmr: {
      overlay: false, // Disable red error overlay so ErrorBoundary handles errors cleanly
      host: 'localhost',
      clientPort: 5173,
    },
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
