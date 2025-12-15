import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut
} from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary to-secondary flex items-center justify-center p-6">
      <div className="text-center max-w-md">

        {/* Jika sudah login, langsung redirect */}
        <SignedIn>
          <Navigate to="/dashboard" replace />
        </SignedIn>

        {/* Jika belum login */}
        <SignedOut>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Nebeng.in
          </h1>

          <p className="text-xl text-white mb-10 opacity-90">
            Aplikasi titip barang aman via traveler atau ekspedisi
          </p>

          <p className="text-white/80 mb-12 text-lg">
            Uang ditahan sampai barang sampai di tangan kamu
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            {/* LOGIN */}
            <SignInButton mode="modal">
              <button className="btn btn-neutral btn-lg text-white">
                Masuk
              </button>
            </SignInButton>

            {/* REGISTER */}
            <SignUpButton mode="modal">
              <button className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
                Daftar Baru
              </button>
            </SignUpButton>

          </div>

          <p className="text-white/60 text-sm mt-12">
            Ribuan orang sudah saling percaya di Nebeng.in
          </p>
        </SignedOut>
      </div>
    </div>
  )
}
