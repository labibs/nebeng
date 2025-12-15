import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { useRegisterSW } from 'virtual:pwa-register/react' // Virtual module dari plugin
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

function SWUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    }
  })

  // Contoh: Tampilkan toast sederhana
  if (offlineReady) {
    alert('App siap digunakan offline!')
    setOfflineReady(false)
  }

  if (needRefresh) {
    if (confirm('Ada versi baru app. Reload untuk update?')) {
      updateServiceWorker()
    }
  }

  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <App />
      <SWUpdatePrompt />
    </ClerkProvider>
  </React.StrictMode>
)