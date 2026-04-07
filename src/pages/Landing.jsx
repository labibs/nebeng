import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Pengiriman Langsung Tanpa Transit",
      desc: "Barang dibawa langsung oleh traveller terverifikasi.\nLebih cepat, tanpa ribet gudang atau sorting.",
      emoji: "✈️",
      gradient: "from-slate-900/80 via-slate-900/40 to-transparent",
      img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80",
    },
    {
      title: "Liburan Tetap Cuan",
      desc: "Bawa paket saat travelling,\ndapat fee menarik tanpa ganggu rencana liburanmu.",
      emoji: "💰",
      gradient: "from-blue-900/80 via-blue-900/40 to-transparent",
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80",
    },
    {
      title: "100% Aman dengan Escrow",
      desc: "Uang ditahan platform sampai barang sampai.\nTraveller & pengirim sama-sama tenang.",
      emoji: "🔒",
      gradient: "from-[#1e3a8a]/80 via-[#1e3a8a]/40 to-transparent",
      img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80",
    },
    {
      title: "Hemat Hingga 70% Biaya Kirim",
      desc: "Lebih murah dari ekspedisi biasa,\nkarena nebeng bagasi traveller.",
      emoji: "💸",
      gradient: "from-[#0f172a]/80 via-[#0f172a]/40 to-transparent",
      img: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1600&q=80",
    },
    {
      title: "Komunitas Traveller Solid",
      desc: "Saling bantu dan ciptakan koneksi baru di jalan.",
      emoji: "🤝",
      gradient: "from-[#4e73df]/80 via-[#4e73df]/40 to-transparent",
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
        <Navigate to="/" replace />
      </SignedIn>

      <SignedOut>
        <div className="relative min-h-screen bg-[#f0f7ff] flex flex-col items-center justify-center px-6 py-2 overflow-hidden text-slate-900">
          {/* Animated Background blobs like in Market page */}
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl opacity-60" />
          <div className="absolute -right-20 top-60 h-[400px] w-[400px] rounded-full bg-blue-100/50 blur-3xl opacity-60" />

          {/* Brand Name */}
          <div className="relative mb-2 flex flex-col items-center z-10">
            <img
              src="./nebengv2.png"
              alt="Nebeng"
              className="w-32 h-32 object-contain drop-shadow-sm"
            />
          </div>

          {/* Carousel */}
          <div className="relative z-10 w-full h-72 sm:h-96 overflow-hidden rounded-[32px] shadow-[0_20px_50px_rgba(78,115,223,0.12)] mb-8 border border-white/80">
            <div className="relative w-full h-full">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={slide.img}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${slide.gradient} flex flex-col items-center justify-end pb-12 px-6`}
                  >
                    <div className="text-4xl mb-4">{slide.emoji}</div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-sm sm:text-base text-white/90 text-center max-w-xl leading-relaxed whitespace-pre-line">
                      {slide.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-500 rounded-full ${
                    index === currentSlide
                      ? "bg-white w-8 h-2"
                      : "bg-white/50 w-2 h-2 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Trust Message */}
          <p className="relative z-10 text-base sm:text-lg font-bold text-slate-600 text-center mb-8 px-4">
            <span className="text-[#4e73df]">💎</span> Uang ditahan aman hingga
            barang sampai
          </p>

          {/* CTA Buttons */}
          <div className="relative z-10 flex flex-row gap-4 justify-center items-center w-full max-w-md">
            <SignInButton mode="modal">
              <button className="group flex-1 flex items-center justify-center h-14 rounded-2xl bg-[#4e73df] text-white text-lg font-bold shadow-[0_10px_25px_rgba(78,115,223,0.25)] hover:shadow-[0_15px_35px_rgba(78,115,223,0.35)] hover:-translate-y-0.5 active:scale-95 transition-all">
                Masuk
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="group flex-1 flex items-center justify-center h-14 rounded-2xl border-2 border-slate-200 bg-white/70 backdrop-blur-md text-slate-700 text-lg font-bold shadow-sm hover:bg-white hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all">
                Daftar
              </button>
            </SignUpButton>
          </div>

          {/* Footer with Version Combined */}
          <div className="relative z-10 mt-8 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-400">
            <span className="font-bold text-[#4e73df]/60">V 2.0.2</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <p>
              Powered by{" "}
              <a
                href="https://sakte.id"
                className="font-medium transition hover:text-[#4e73df]"
              >
                sakte.id
              </a>
            </p>
          </div>
        </div>
      </SignedOut>
    </>
  );
}
