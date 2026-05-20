import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/terminal/',
  server: {
    host: true,
    port: 5172,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Vision Attendance',
        short_name: 'Attendance',
        description: 'Church attendance management system',
        theme_color: '#059669',
        background_color: '#f9fafb',
        display: 'standalone',
        scope: '/terminal/',
        start_url: '/terminal/',
        icons: [
          { src: '/terminal/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/terminal/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/terminal/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
