import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

import SyncUser from './components/SyncUser' // ✅ WAJIB
import MainLayout from './layouts/MainLayout'
import ChatLayout from './layouts/ChatLayout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Home from './pages/Home'
import CreatePost from './pages/CreatePost'
import Chat from './pages/Chat'
import ChatRoom from './components/ChatRoom'

import Profile from './pages/Profile'
import Transaksi from './pages/Transaksi'
import BottomNav from './components/BottomNav'

function App() {
  return (
    <BrowserRouter>
      {/* 🔥 Sync user SETELAH login */}
      <SyncUser />

      <div className="min-h-screen bg-base-200">

        {/* ===================== */}
        {/* USER SUDAH LOGIN */}
        {/* ===================== */}
        <SignedIn>
          
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/transaksi" element={<Transaksi />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
              <Route element={<ChatLayout />}>
                <Route path="/chat/:conversationId" element={<ChatRoom />} />
              </Route>

              {/* Redirect semua route tidak dikenal ke home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          
        </SignedIn>

        {/* ===================== */}
        {/* USER BELUM LOGIN */}
        {/* ===================== */}
        <SignedOut>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SignedOut>

      </div>
    </BrowserRouter>
  )
}

export default App