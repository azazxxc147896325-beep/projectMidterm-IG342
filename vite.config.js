import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
// https://vite.dev/config/
export default defineConfig({
  base: '/projectMidterm-IG342/',
  server: {
    host: true, // Allow mobile phone on same WiFi to access via IP
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      includeAssets: ['quotemate-logo.png', 'quotemate-apple-touch.png', 'quotemate-pwa-192.png', 'quotemate-pwa-512.png'],
      manifest: {
        name: "QuoteMate",
        short_name: 'QuoteMate',
        description: 'พื้นที่แบ่งปันคำพูดดี ๆ กับเพื่อน',
        theme_color: '#4ea58d',
        background_color: '#f7faf8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/projectMidterm-IG342/',
        scope: '/projectMidterm-IG342/',
        icons: [
          {
            src: 'quotemate-pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'quotemate-pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'quotemate-pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
        ]
      }
    })
  ]
})
