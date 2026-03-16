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
      injectRegister: false,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'icons/*.png'],
      manifest: {
        name: 'Find Your Painter',
        short_name: 'PainterApp',
        description: 'Find professional painters for your home',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
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
        enabled: false, // CRITICAL: SW must be OFF in dev — causes duplicate React from stale cache
      }
    })
  ],
  server: {
    hmr: {
      overlay: false, // Disable red error overlay so ErrorBoundary handles errors cleanly
    },
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
})
