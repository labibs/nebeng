import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut
} from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary to-secondary flex items-center justify-center px-6">
      
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>

      <SignedOut>
        <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-10 text-center">

          {/* Brand */}
          <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">
            Nebeng
          </h1>

          {/* Tagline utama */}
          <p className="text-white/90 text-lg leading-relaxed mb-6">
            Cara baru mengirim barang,<br />
            dibawa traveller langsung tanpa transit.
          </p>

          {/* Trust message */}
          <div className="bg-white/10 rounded-xl px-4 py-3 mb-10">
            <p className="text-white/80 text-sm">
              Uang ditahan sampai barang sampai di tangan kamu
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-4">

            <SignInButton mode="modal">
              <button className="w-full py-3 rounded-xl bg-black text-white text-lg font-semibold shadow-lg hover:scale-[1.02] active:scale-95 transition">
                Masuk
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="w-full py-3 rounded-xl border border-white/60 text-white text-lg hover:bg-white hover:text-primary transition">
                Daftar Baru
              </button>
            </SignUpButton>

          </div>

          {/* Footer kecil */}
          <p className="text-white/50 text-xs mt-10">
            Pengiriman personal, tanpa transit
          </p>

        </div>
      </SignedOut>
    </div>
  )
}
