import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut
} from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react';

export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Pengiriman Langsung Tanpa Transit",
      desc: "Barang dibawa langsung oleh traveller terverifikasi.\nLebih cepat, tanpa ribet gudang atau sorting.",
      emoji: "✈️",
      gradient: "from-black/70 to-black/50",
      img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80" // pesawat / airport
    },
    {
      title: "Liburan Tetap Cuan",
      desc: "Bawa paket saat travelling,\ndapat fee menarik tanpa ganggu rencana liburanmu.",
      emoji: "💰",
      gradient: "from-green-700/70 to-emerald-600/70",
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80" // pantai / liburan
    },
    {
      title: "100% Aman dengan Escrow",
      desc: "Uang ditahan platform sampai barang sampai di tangan penerima.\nTraveller & pengirim sama-sama tenang.",
      emoji: "🔒",
      gradient: "from-blue-700/70 to-indigo-700/70",
      img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80" // keamanan / trust
    },
    {
      title: "Hemat Hingga 70% Biaya Kirim",
      desc: "Lebih murah dari ekspedisi biasa,\nkarena nebeng bagasi traveller yang memang sudah berangkat.",
      emoji: "💸",
      gradient: "from-teal-700/70 to-cyan-700/70",
      img: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80" // paket / delivery
    },
    {
      title: "Bangun Komunitas Traveller Solid",
      desc: "Titip barang ke sesama traveller,\nsaling bantu dan ciptakan koneksi baru di jalan.",
      emoji: "🤝",
      gradient: "from-purple-700/70 to-pink-700/70",
      img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80" // komunitas / teman jalan
    },
  ];

  // Auto slide setiap 6 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  // Klik dot manual
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-[#f0f8f1] to-[#d9f0e0] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#1e293b] text-base-content flex flex-col flex items-center bg-base-200 flex items-center justify-center px-6">
      
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>

      <SignedOut>
        <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-10 text-center">

          {/* Brand */}
          <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">
            Nebeng
          </h1>

          {/* Carousel Container */}
      <div className="relative w-full h-96 md:h-[560px] overflow-hidden rounded-2xl shadow-2xl mb-12">
        <div className="relative w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Background Image */}
              <img
                src={slide.img}
                alt={slide.title}
                className="w-full h-full object-cover"
              />

              {/* Overlay Gradient + Content */}
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} flex items-center justify-center px-8`}>
                <div className="text-center max-w-3xl">
                  <div className="text-6xl md:text-7xl mb-8">{slide.emoji}</div>
                  <h3 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    {slide.title}
                  </h3>
                  <p className="text-white/90 text-lg md:text-xl leading-relaxed whitespace-pre-line">
                    {slide.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicator Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Trust Message di Bawah Carousel */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl px-8 py-2 text-center max-w-2xl mx-auto mb-8 shadow-lg -top-8 relative">
        <p className="text-white text-lg font-semibold">
          💎 Uang ditahan aman sampai barang sampai di tangan penerima
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
            Pengiriman personal & Bebas transit
          </p>

        </div>
      </SignedOut>
    </div>
  )
}
