import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Home from './pages/Home'
import CreatePost from './pages/CreatePost'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Transaksi from './pages/Transaksi'
import BottomNav from './components/BottomNav'

function App() {
  // Ubah ini nanti pakai state auth dari Supabase
  // Sementara: false = tampil Landing/Login, true = tampil Home + BottomNav
  const isLoggedIn = true  // ubah ke false kalau mau test Landing/Login lagi

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base-200">
        {isLoggedIn ? (
          <>
            {/* Halaman utama setelah login */}
            <main className="pb-20 md:pb-0">  {/* pb-20 biar nggak ketutup BottomNav di mobile */}
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/transaksi" element={<Transaksi />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Bottom Navigation (hanya muncul kalau sudah login) */}
            <BottomNav />
          </>
        ) : (
          /* Halaman sebelum login */
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  )
}

export default App