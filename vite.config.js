import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Otomatis update SW saat ada versi baru
      devOptions: {
        enabled: true // Aktifin SW di mode dev untuk testing
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', '*.svg'], // Assets yang dicache
      manifest: {
        name: 'Nebeng.id',
        short_name: 'Nebeng',
        description: 'Titip barang aman via traveler & ekspedisi',
        theme_color: '#4e73df',
        background_color: '#f0f7ff',
        display: 'standalone', // Tampilan full screen seperti native app
        icons: [
          {
            src: 'pwa-192x192.png', // Nama file dari generate tadi
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'pwa-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // Icon maskable untuk Android
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple-touch-icon'
          }
        ]
      }
    })
  ]
})
