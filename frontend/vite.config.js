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
        theme_color: '#ffffff',
        display: 'standalone',
        appleMobileWebAppCapable: 'no', // Disable deprecated tag injection
        background_color: '#ffffff',
        start_url: '/',
        id: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true, // Allow testing push in dev
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
            if (id.includes('react') || id.includes('react-router-dom') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('recharts') || id.includes('axios') || id.includes('i18next')) {
              return 'vendor-utils';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    hmr: {
      overlay: false, // Disable red error overlay so ErrorBoundary handles errors cleanly
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
