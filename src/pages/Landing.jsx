import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Pengiriman Langsung Tanpa Transit",
      desc: "Barang dibawa langsung oleh traveller terverifikasi.\nLebih cepat, tanpa ribet gudang atau sorting.",
      emoji: "✈️",
      gradient: "from-black/70 via-black/60 to-transparent",
      img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80",
    },
    {
      title: "Liburan Tetap Cuan",
      desc: "Bawa paket saat travelling,\ndapat fee menarik tanpa ganggu rencana liburanmu.",
      emoji: "💰",
      gradient: "from-green-900/70 via-emerald-800/60 to-transparent",
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80",
    },
    {
      title: "100% Aman dengan Escrow",
      desc: "Uang ditahan platform sampai barang sampai di tangan penerima.\nTraveller & pengirim sama-sama tenang.",
      emoji: "🔒",
      gradient: "from-blue-900/70 via-indigo-800/60 to-transparent",
      img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80",
    },
    {
      title: "Hemat Hingga 70% Biaya Kirim",
      desc: "Lebih murah dari ekspedisi biasa,\nkarena nebeng bagasi traveller yang memang sudah berangkat.",
      emoji: "💸",
      gradient: "from-teal-900/70 via-cyan-800/60 to-transparent",
      img: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1600&q=80",
    },
    {
      title: "Bangun Komunitas Traveller Solid",
      desc: "Titip barang ke sesama traveller,\nsaling bantu dan ciptakan koneksi baru di jalan.",
      emoji: "🤝",
      gradient: "from-purple-900/70 via-pink-800/60 to-transparent",
      img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80",
    },
  ];

  // Auto slide setiap 6 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index) => setCurrentSlide(index);

  return (
  <>
    <SignedIn>
      <Navigate to="/dashboard" replace />
    </SignedIn>

    <SignedOut>
      <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-[#f0f8f1] to-[#d9f0e0] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155] flex flex-col items-center justify-center px-6 py-2 overflow-hidden">

        {/* Brand Name – lebih kecil di mobile */}
        <img
          src="./nebeng.png"
          alt="Nebeng"
          className="w-35 h-35 object-cover mb-2"
        />

        {/* Carousel – tinggi dikurangi untuk mobile */}
        <div className="relative w-full h-64 sm:h-96 md:h-96 overflow-hidden rounded-2xl shadow-2xl mb-6">
          <div className="relative w-full h-full">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={slide.img}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} flex flex-col items-center justify-center px-6`}>
                  <div className="text-4xl sm:text-5xl mb-4">{slide.emoji}</div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 text-center leading-tight drop-shadow-lg">
                    {slide.title}
                  </h2>
                  <p className="text-base sm:text-lg text-white/90 text-center max-w-xl leading-relaxed whitespace-pre-line drop-shadow">
                    {slide.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots – lebih kecil & rapat */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-500 rounded-full ${
                  index === currentSlide
                    ? 'bg-white w-8 h-2'
                    : 'bg-white/50 w-2 h-2 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Trust Message – lebih kecil & ringkas */}
        <p className="text-lg sm:text-xl font-medium text-base-content/90 dark:text-white/90 text-center mb-8 px-4">
          💎 Uang ditahan aman hingga barang sampai
        </p>

        {/* CTA Buttons — selalu 1 baris */}
        <div className="flex flex-row gap-4 justify-center items-center w-full max-w-md">

          <SignInButton mode="modal">
            <button className="group flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#81c784] to-[#66bb6a] text-white text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Masuk
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button className="group flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-3 border-base-content/70 bg-white/10 dark:bg-white/5 backdrop-blur-md text-base-content dark:text-white text-lg font-bold shadow-xl hover:bg-white/30 dark:hover:bg-white/15 hover:border-base-content hover:scale-105 active:scale-95 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Daftar
            </button>
          </SignUpButton>

        </div>
        {/* Footer tagline kecil */}
        <p className="mt-8 text-sm sm:text-base text-base-content/60 dark:text-white/50 text-center">
          Powered by <sakte className="id"><a href="https://sakte.id">sakte.id</a></sakte>
        </p>
      </div>
    </SignedOut>
  </>
);
}