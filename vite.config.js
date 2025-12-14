import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Otomatis update SW saat ada versi baru
      devOptions: {
        enabled: true // Aktifin SW di mode dev untuk testing
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', '*.svg'], // Assets yang dicache
      manifest: {
        name: 'Nama App Kamu (Sosmed Titip Barang)', // Nama lengkap
        short_name: 'TitipBareng', // Nama pendek
        description: 'Aplikasi sosial media untuk titip barang via ekspedisi',
        theme_color: '#ffffff', // Warna theme
        background_color: '#ffffff',
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