import { SignInButton } from "@clerk/clerk-react";
import {
  Facebook,
  Github,
  Linkedin,
  Monitor,
  Calendar as CalendarIcon,
  PieChart,
  Users,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-[#4e73df]/10 overflow-hidden">
      {/* Header */}
      <header className="p-8 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0]">
            <img src="/logo.svg" alt="" className="h-7 w-7" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#0f172a]">
            Nebeng<span className="text-[#4e73df]"> Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button className="hidden sm:block text-sm font-bold text-[#64748b] hover:text-[#4e73df] transition-colors">
            Bantuan
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background Decorative Circles */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#4e73df]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#4e73df]/5 rounded-full blur-[100px]" />

        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-20 items-center relative z-10">
          {/* Left Side: Login Flow */}
          <div className="max-w-md w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0f7ff] border border-[#4e73df]/10 text-[#4e73df] text-[10px] font-black uppercase tracking-widest mb-6">
              <ShieldCheck size={12} strokeWidth={3} />
              Administrasi Aman
            </div>

            <h2 className="text-[44px] font-black leading-[1.1] text-[#0f172a] tracking-tight mb-4">
              Selamat Datang di <br />
              <span className="text-[#4e73df]">Dashboard Nebeng</span>
            </h2>

            <p className="text-lg font-medium text-[#64748b] mb-12">
              Siap untuk mengelola komunitas Anda? Akses semua alat administrasi
              dengan satu klik.
            </p>

            <div className="space-y-8">
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="group relative w-full h-[72px] bg-[#4e73df] rounded-[24px] flex items-center justify-center gap-3 text-white shadow-[0_20px_40px_rgba(78,115,223,0.25)] hover:shadow-[0_25px_50px_rgba(78,115,223,0.35)] hover:-translate-y-1 transition-all active:scale-95">
                  <span className="text-lg font-black tracking-tight">
                    Masuk ke Dashboard Admin
                  </span>
                  <ArrowRight
                    size={22}
                    strokeWidth={3}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </SignInButton>

              <div className="flex items-center gap-6">
                <div className="h-[1px] flex-1 bg-[#e2e8f0]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
                  Akses Cepat
                </span>
                <div className="h-[1px] flex-1 bg-[#e2e8f0]" />
              </div>

              <div className="flex justify-center gap-4">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Github, label: "GitHub" },
                  { icon: Linkedin, label: "LinkedIn" },
                ].map((social, i) => (
                  <button
                    key={i}
                    className="h-14 w-14 rounded-2xl bg-white border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:text-[#4e73df] hover:border-[#4e73df]/30 hover:shadow-lg hover:shadow-[#4e73df]/5 transition-all"
                  >
                    <social.icon size={20} strokeWidth={2.5} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-16 p-6 rounded-[28px] bg-white border border-[#e2e8f0] shadow-sm">
              <p className="text-xs font-semibold text-[#64748b] leading-relaxed">
                <span className="text-[#0f172a] font-bold">
                  Catatan Autentikasi:
                </span>{" "}
                Kami menggunakan Clerk untuk pengelolaan identitas yang aman.
                Pastikan akun Anda telah terdaftar dengan hak akses admin
                sebelum masuk.
              </p>
            </div>
          </div>

          {/* Right Side: Enhanced Isometric Illustration */}
          <div className="hidden lg:flex items-center justify-center perspective-[2000px]">
            <div className="relative w-full max-w-[500px] aspect-square transform-gpu rotate-x-[15deg] rotate-y-[-20deg] rotate-z-[5deg]">
              {/* Shadow Base */}
              <div className="absolute inset-x-10 bottom-0 h-10 bg-black/5 rounded-full blur-[40px]" />

              {/* Main Laptop / Base Platform */}
              <div className="absolute inset-10 bg-white rounded-[40px] shadow-[0_30px_60px_rgba(15,23,42,0.1)] border-b-[12px] border-slate-200 p-8 flex flex-col gap-4 overflow-hidden group">
                {/* Screen Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="h-2 w-24 bg-slate-100 rounded-full" />
                </div>

                {/* Dashboard Elements */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="rounded-2xl bg-[#f0f7ff] p-4 flex flex-col gap-3">
                    <div className="h-2 w-12 bg-[#4e73df]/20 rounded-full" />
                    <div className="flex-1 flex items-end gap-1.5">
                      {[40, 70, 45, 90, 60].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-[#4e73df] rounded-t-sm"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 flex flex-col gap-2">
                    <div className="h-2 w-10 bg-slate-100 rounded-full" />
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#f0f7ff] flex items-center justify-center text-[#4e73df]">
                        <Users size={14} />
                      </div>
                      <div className="h-3 w-16 bg-slate-100 rounded-full" />
                    </div>
                    <div className="mt-auto h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-emerald-400" />
                    </div>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-900 p-5 flex items-center justify-between text-white">
                    <div className="flex flex-col gap-2">
                      <div className="h-2 w-20 bg-white/20 rounded-full" />
                      <div className="h-4 w-32 bg-white rounded-full" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                      <PieChart size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Element: Calendar */}
              <div className="absolute -top-12 -right-4 w-32 h-36 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 flex flex-col gap-3 translate-z-[100px] animate-bounce duration-[4s]">
                <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <CalendarIcon size={18} />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                  <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
                </div>
                <div className="mt-auto flex justify-end">
                  <div className="h-6 w-6 rounded-full bg-[#4e73df] text-white flex items-center justify-center text-[10px] font-black border-4 border-white">
                    5
                  </div>
                </div>
              </div>

              {/* Floating Element: User Card */}
              <div className="absolute top-1/2 -left-20 w-48 h-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 flex items-center gap-3 translate-z-[50px] animate-pulse duration-[5s]">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <Users size={20} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded-full" />
                </div>
              </div>

              {/* Floating Element: Status Tag */}
              <div className="absolute -bottom-4 left-1/4 h-10 px-4 bg-emerald-500 rounded-full shadow-lg flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest translate-z-[150px]">
                <div className="h-2 w-2 rounded-full bg-white animate-ping" />
                Operasional
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-10 bg-white border-t border-[#e2e8f0] relative z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-sm font-black text-[#0f172a]">
              Panel Admin Nebeng
            </p>
            <p className="text-xs font-bold text-[#94a3b8]">
              © 2026 Nebeng. Hak cipta dilindungi.
            </p>
          </div>
          <div className="flex gap-8">
            {["Ketentuan", "Privasi", "Keamanan", "Status"].map((link) => (
              <button
                key={link}
                className="text-xs font-black text-[#94a3b8] hover:text-[#4e73df] transition-colors"
              >
                {link}
              </button>
            ))}
          </div>
          <div className="flex gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#4e73df]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#e2e8f0]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#e2e8f0]" />
          </div>
        </div>
      </footer>
    </div>
  );
}
