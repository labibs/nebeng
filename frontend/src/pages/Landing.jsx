import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowUpRight, X } from "lucide-react";

const versionHistory = [
  {
    version: "2.0.4",
    period: "Pembaruan terbaru",
    changes: [
      "Hadir komentar pada postingan.",
      "Panel admin, chat bantuan, dan notifikasi admin disempurnakan.",
      "Integrasi aplikasi diperbarui agar menggunakan backend Laravel API.",
      "Penyempurnaan landing page dan tampilan di perangkat mobile.",
    ],
  },
  {
    version: "2.0.3",
    period: "April 2026",
    changes: ["Penyegaran kartu postingan di halaman utama."],
  },
  {
    version: "2.0.2",
    period: "April 2026",
    changes: ["Penyempurnaan pengalaman chat dan tampilan aplikasi."],
  },
  {
    version: "2.0.1",
    period: "April 2026",
    changes: ["Pembaruan identitas visual dan penyempurnaan desain aplikasi."],
  },
  {
    version: "2.0.0",
    period: "April 2026",
    changes: ["Penyegaran besar pada tampilan halaman utama, market, dan pengalaman aplikasi."],
  },
  {
    version: "1.4.0",
    period: "Februari–Maret 2026",
    changes: ["Penyempurnaan alur pesanan, deal, transaksi, dan pengelompokan pesanan."],
  },
  {
    version: "1.3.0",
    period: "Januari 2026",
    changes: ["Hadir fitur market, outlet dan produk, keranjang, filter, serta jualan keliling."],
  },
  {
    version: "1.2.0",
    period: "Januari 2026",
    changes: ["Hadir alur deal, negosiasi ongkos, pembayaran, transaksi, dan pelacakan."],
  },
  {
    version: "1.1.0",
    period: "Desember 2025",
    changes: ["Hadir chat real-time, tanda pesan dibaca, notifikasi, dan pencarian percakapan."],
  },
  {
    version: "1.0.1",
    period: "Desember 2025",
    changes: ["Rilis awal: daftar dan masuk, profil, halaman utama, serta pembuatan postingan."],
  },
];

export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showVersionLog, setShowVersionLog] = useState(false);

  const slides = [
    {
      title: "Tanpa Install, Langsung Transaksi",
      desc: "Bisa langsung dipakai di browser atau simpan di layar utama.\nHemat memori HP, tanpa perlu ribet download di Store.",
      emoji: "📱",
      gradient: "from-[#4e73df]/80 via-[#4e73df]/40 to-transparent",
      img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1600&q=80",
    },
    {
      title: "Pengiriman Langsung Tanpa Transit",
      desc: "Barang dibawa langsung oleh orang yang searah dengan tujuanmu.\nLebih cepat, tanpa ribet gudang atau sorting.",
      emoji: "✈️",
      gradient: "from-slate-900/80 via-slate-900/40 to-transparent",
      img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80",
    },
    {
      title: "Liburan Tetap Cuan",
      desc: "Bawa paket saat bepergian,\ndapat fee menarik tanpa ganggu rencana perjalananmu.",
      emoji: "💰",
      gradient: "from-blue-900/80 via-blue-900/40 to-transparent",
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80",
    },
    {
      title: "100% Aman dengan Escrow",
      desc: "Uang ditahan platform sampai barang sampai.\nPembawa titipan & penitip sama-sama tenang.",
      emoji: "🔒",
      gradient: "from-[#1e3a8a]/80 via-[#1e3a8a]/40 to-transparent",
      img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80",
    },
    {
      title: "Hemat Hingga 70% Biaya Kirim",
      desc: "Lebih murah dari ekspedisi biasa,\nkarena numpak bagasi orang yang searah ke tujuanmu.",
      emoji: "💸",
      gradient: "from-[#0f172a]/80 via-[#0f172a]/40 to-transparent",
      img: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1600&q=80",
    },
    {
      title: "Rute Harian Jadi Cuan",
      desc: "Berangkat atau pulang kerja tinggal bawa titipan searah.\nTanpa muter jalan, paket sampai, cuan di tangan.",
      emoji: "🛵",
      gradient: "from-[#4e73df]/80 via-[#4e73df]/40 to-transparent",
      img: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1600&q=80",
    },
    {
      title: "Minta Dibeliin Jadi Mudah",
      desc: "Gak sempat ke toko? Minta tolong dibelikan barang favoritmu\noleh orang yang sedang berada di sana.",
      emoji: "🛍️",
      gradient: "from-purple-900/80 via-purple-900/40 to-transparent",
      img: "https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?w=1600&q=80",
    },
    {
      title: "Numpak Searah Lebih Asyik",
      desc: "Cari boncengan atau beri tumpangan kemanapun tujuanmu.\nHemat bensin, kurangi polusi, dan tambah teman di jalan.",
      emoji: "🛵",
      gradient: "from-green-900/80 via-green-900/40 to-transparent",
      img: "https://images.unsplash.com/photo-1558191053-c03db2757e3d?w=1600&q=80",
    },
    {
      title: "Panggil & Jemput Tukang Searah",
      desc: "Butuh teknisi? Panggil tukang favoritmu dan minta tolong orang yang searah ke tujuanmu untuk menjemputnya. Lebih hemat dan praktis dalam sekali jalan.",
      emoji: "👷",
      gradient: "from-orange-900/80 via-orange-900/40 to-transparent",
      img: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1600&q=80",
    },
    {
      title: "Pantau Jualan Keliling",
      desc: "Jangan lewatkan pedagang favoritmu.\nPantau rute mereka secara real-time dan pesan duluan.",
      emoji: "🛺",
      gradient: "from-yellow-900/80 via-yellow-900/40 to-transparent",
      img: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=1600&q=80",
    },
    {
      title: "Kelola Outlet & Jasa Titip",
      desc: "Bisa buat jualan sendiri, tawarkan jasa titip beli,\natau minta tolong orang searah ke tujuanmu belikan barang di outlet favoritmu.",
      emoji: "🏪",
      gradient: "from-indigo-900/80 via-indigo-900/40 to-transparent",
      img: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=1600&q=80",
    },
    {
      title: "Bagikan Cerita di Jalan",
      desc: "Buat video pendek aktivitas harianmu.\nJadilah inspirasi dan afiliate sukses di komunitas.",
      emoji: "🎥",
      gradient: "from-red-900/80 via-red-900/40 to-transparent",
      img: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1600&q=80",
    },
    {
      title: "Buat Postingan Lebih Mudah dengan AI",
      desc: "Ceritakan kebutuhanmu lewat chat.\nAI membantu menyusun detail postingan sebelum kamu membagikannya.",
      emoji: "✨",
      gradient: "from-blue-950/85 via-blue-800/45 to-transparent",
      img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80",
    },
  ];

  // Auto slide setiap 6 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showVersionLog) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowVersionLog(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showVersionLog]);

  const goToSlide = (index) => setCurrentSlide(index);

  return (
    <>
      <SignedIn>
        <Navigate to="/" replace />
      </SignedIn>

      <SignedOut>
        <div className="relative min-h-screen bg-[#f0f7ff] flex flex-col items-center justify-start sm:justify-center px-6 py-2 overflow-hidden text-slate-900">
          {/* Animated Background blobs like in Market page */}
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl opacity-60" />
          <div className="absolute -right-20 top-60 h-[400px] w-[400px] rounded-full bg-blue-100/50 blur-3xl opacity-60" />

          {/* Brand Name */}
          <div className="relative mb-2 flex flex-col items-center z-10">
            <img
              src="./numpakv2.png"
              alt="Numpak"
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
          <a
            href="https://numpak-landing.sakte.id/"
            target="_blank"
            rel="noreferrer"
            className="relative z-10 mt-1 mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#4e73df]/15 bg-white/75 px-4 py-2 text-sm font-semibold text-[#4e73df] shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
          >
            Yuk, kenalan lebih dekat
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>

          {/* CTA Buttons */}
          <div className="relative z-10 mt-4 flex w-full max-w-md flex-row items-center justify-center gap-4">
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
          <div className="relative z-10 mt-auto flex items-center justify-center gap-2 pb-2 pt-8 text-xs text-slate-400 sm:text-sm">
            <button
              type="button"
              onClick={() => setShowVersionLog(true)}
              aria-label="Lihat catatan versi 2.0.4"
              className="font-bold text-[#4e73df]/70 transition hover:text-[#4e73df] hover:underline"
            >
              V 2.0.4
            </button>
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

          {showVersionLog && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setShowVersionLog(false);
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="version-log-title"
                className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-800 shadow-2xl"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#4e73df]">Catatan versi</p>
                    <h2 id="version-log-title" className="text-xl font-bold">Riwayat Numpak</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVersionLog(false)}
                    aria-label="Tutup catatan versi"
                    className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                  {versionHistory.map((release) => (
                    <article key={release.version} className="border-l-2 border-blue-100 pl-4">
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
                        <h3 className="font-bold text-slate-800">v{release.version}</h3>
                        <span className="text-xs text-slate-400">{release.period}</span>
                      </div>
                      <ul className="space-y-1.5 text-sm text-slate-600">
                        {release.changes.map((change) => (
                          <li key={change} className="flex gap-2"><span className="text-[#4e73df]">•</span><span>{change}</span></li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </SignedOut>
    </>
  );
}
