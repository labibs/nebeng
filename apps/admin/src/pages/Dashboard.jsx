import { useEffect, useState } from "react";
import {
  TrendingUp,
  MoreHorizontal,
  CreditCard,
  Fingerprint,
  Users,
  Route,
  Handshake,
  ReceiptText,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// Helper for formatting
const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const formatNumber = (val) => new Intl.NumberFormat("id-ID").format(val || 0);

export default function Dashboard() {
  const [data, setData] = useState({
    users: 0,
    posts: 0,
    transactionsCount: 0,
    revenue: 0,
    dealsCount: 0,
    recentTransfers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { count: users, error: errUsers },
          { count: posts, error: errPosts },
          { data: transData, error: errTrans },
          { count: deals, error: errDeals },
          { data: recentTrans, error: errRecent },
        ] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("posts").select("*", { count: "exact", head: true }),
          supabase.from("transactions").select("gross_amount"),
          supabase.from("deals").select("*", { count: "exact", head: true }),
          supabase
            .from("transactions")
            .select("*, deals(depositor:users(name))")
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

        if (errUsers) console.error("Error users:", errUsers);
        if (errPosts) console.error("Error posts:", errPosts);
        if (errTrans) console.error("Error trans:", errTrans);
        if (errDeals) console.error("Error deals:", errDeals);
        if (errRecent) console.error("Error recent:", errRecent);

        const totalRevenue =
          transData?.reduce((acc, curr) => acc + (curr.gross_amount || 0), 0) ||
          0;

        setData({
          users: users || 0,
          posts: posts || 0,
          transactionsCount: transData?.length || 0,
          revenue: totalRevenue,
          dealsCount: deals || 0,
          recentTransfers: recentTrans || [],
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#4e73df]"></span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 pb-12">
      {/* TOP ROW */}
      <div className="col-span-12 lg:col-span-3">
        <MetricCardSmall
          label="Total Pengguna"
          value={formatNumber(data.users)}
          visual="bars"
          points={[40, 70, 45, 90, 60]}
          icon={Users}
        />
      </div>
      <div className="col-span-12 lg:col-span-3">
        <MetricCardSmall
          label="Postingan Aktif"
          value={formatNumber(data.posts)}
          visual="line"
          points={[30, 40, 35, 50, 45, 60]}
          icon={Route}
        />
      </div>
      <div className="col-span-12 lg:col-span-3">
        <MetricCardSmall
          label="Total Pendapatan"
          value={formatIDR(data.revenue)}
          visual="icon"
          icon={ReceiptText}
        />
      </div>
      <div className="col-span-12 lg:col-span-3">
        <MetricCardSmall
          label="Total Kesepakatan"
          value={formatNumber(data.dealsCount)}
          visual="line-white"
          dark={true}
          points={[20, 50, 30, 70, 40, 80]}
          icon={Handshake}
        />
      </div>

      {/* MIDDLE ROW */}
      <div className="col-span-12 lg:col-span-8">
        <BalanceCard
          revenue={data.revenue}
          transactions={data.transactionsCount}
        />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <EarningsProgressCard
          revenue={data.revenue}
          deals={data.dealsCount}
          transactions={data.transactionsCount}
        />
      </div>

      {/* BOTTOM ROW */}
      <div className="col-span-12 lg:col-span-5">
        <WalletCard />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <TransfersCard transfers={data.recentTransfers} />
      </div>
      <div className="col-span-12 lg:col-span-3">
        <SecurityCard />
      </div>
    </div>
  );
}

function MetricCardSmall({ label, value, visual, points, dark, icon: Icon }) {
  return (
    <div
      className={`rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0] transition-all hover:shadow-[0_8px_30px_rgba(78,115,223,0.1)] ${
        dark
          ? "bg-[#4e73df] text-white border-[#4e73df]"
          : "bg-white text-[#0f172a]"
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            dark ? "text-white/70" : "text-[#64748b]"
          }`}
        >
          {label}
        </p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            dark ? "bg-white/20" : "bg-[#f0f7ff] text-[#4e73df]"
          }`}
        >
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-[26px] font-black tracking-tight">{value}</p>
        <div className="flex flex-col items-end">
          {visual === "bars" && <MiniBars points={points} />}
          {visual === "line" && <MiniLine points={points} color="#4e73df" />}
          {visual === "line-white" && (
            <MiniLine points={points} color="#ffffff" />
          )}
        </div>
      </div>
    </div>
  );
}

function MiniBars({ points }) {
  return (
    <div className="flex h-8 items-end gap-1.5">
      {points.map((p, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-[#4e73df]/40"
          style={{ height: `${p}%` }}
        />
      ))}
    </div>
  );
}

function MiniLine({ points, color }) {
  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${(i / (points.length - 1)) * 60} ${
          30 - (p / 100) * 25
        }`,
    )
    .join(" ");

  return (
    <svg width="60" height="30" className="opacity-60">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BalanceCard({ revenue, transactions }) {
  return (
    <div className="h-full rounded-[28px] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0]">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-[#0f172a]">
            Analisis Pendapatan
          </h2>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-600 border border-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Data Langsung
          </span>
        </div>
        <select className="bg-[#f8fafc] px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-black text-[#64748b] outline-none cursor-pointer hover:border-[#4e73df] transition-colors">
          <option>Tampilan Bulanan</option>
          <option>Tampilan Mingguan</option>
        </select>
      </div>

      <div className="flex gap-16">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#94a3b8]">
            Transaksi
          </p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-black text-[#0f172a]">
              {formatNumber(transactions)}
            </p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-600">
              +4.5%
            </span>
          </div>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#94a3b8]">
            Total Pendapatan
          </p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-black text-[#0f172a]">
              {formatIDR(revenue)}
            </p>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-black text-rose-600">
              -1.2%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 h-44 w-full">
        <svg
          viewBox="0 0 800 200"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4e73df" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#4e73df" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 150 C 100 180, 200 100, 300 160 C 400 220, 500 120, 600 150 C 700 180, 800 130, 850 150 L 850 200 L 0 200 Z"
            fill="url(#grad)"
          />
          <path
            d="M0 120 C 50 110, 100 160, 150 140 C 200 120, 250 80, 300 110 C 350 140, 400 160, 450 120 C 500 80, 550 100, 600 110 C 650 120, 700 140, 800 100"
            fill="none"
            stroke="#4e73df"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function EarningsProgressCard({ revenue, deals, transactions }) {
  const rate = deals > 0 ? Math.round((transactions / deals) * 100) : 0;
  const percentage = Math.min(100, rate);
  const dash = `${(percentage / 100) * 251} 251`;

  return (
    <div className="h-full rounded-[28px] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#0f172a]">Konversi</h2>
        <div className="flex items-center gap-1.5 rounded-lg bg-[#f0f7ff] px-2.5 py-1 text-[10px] font-black text-[#4e73df] uppercase tracking-wider">
          Deal vs Trans
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#f8fafc] p-4 border border-[#e2e8f0]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
            Total Deal
          </p>
          <p className="mt-1 text-2xl font-black text-[#0f172a]">
            {formatNumber(deals)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#f8fafc] p-4 border border-[#e2e8f0]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
            Berhasil
          </p>
          <p className="mt-1 text-2xl font-black text-[#4e73df]">
            {formatNumber(transactions)}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center">
        <div className="relative h-32 w-52">
          <svg viewBox="0 0 100 60" className="h-full w-full">
            <path
              d="M10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#4e73df"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={dash}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-2 text-center">
            <p className="text-3xl font-black text-[#0f172a]">{percentage}%</p>
            <p className="text-[9px] font-bold uppercase tracking-tighter text-[#64748b]">
              Tingkat Keberhasilan
            </p>
          </div>
        </div>
        <p className="mt-4 text-[11px] font-semibold text-[#64748b] text-center px-4">
          {percentage}% dari kesepakatan telah berhasil dikonversi menjadi
          transaksi berbayar.
        </p>
      </div>
    </div>
  );
}

function WalletCard() {
  return (
    <div className="h-full rounded-[28px] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0]">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <h2 className="text-xl font-black text-[#0f172a] leading-tight">
            Dompet Bisnis Nebeng
          </h2>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-[#64748b]">
            Kelola likuiditas platform dan penyelesaian merchant dengan sistem
            escrow kami yang aman.
          </p>
          <button className="mt-8 flex items-center gap-3 rounded-2xl bg-[#0f172a] px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95">
            <CreditCard size={18} />
            Kelola Pencairan
          </button>
        </div>
        <div className="relative h-44 w-full lg:w-64">
          <div className="absolute right-0 top-6 h-36 w-56 rotate-[-12deg] rounded-3xl bg-[#4e73df] p-6 shadow-2xl">
            <div className="flex justify-between">
              <div className="h-8 w-12 rounded-lg bg-white/20" />
              <div className="h-6 w-10 rounded bg-amber-400/40" />
            </div>
            <p className="mt-14 text-xs font-black tracking-[0.2em] text-white/90 uppercase">
              Escrow Admin
            </p>
          </div>
          <div className="absolute right-6 top-0 h-36 w-56 rotate-[-4deg] rounded-3xl bg-[#0f172a] p-6 shadow-2xl border border-white/10">
            <div className="flex justify-between">
              <img src="/logo.svg" className="h-8 w-8 brightness-200" alt="" />
              <div className="h-6 w-10 rounded bg-amber-400/80" />
            </div>
            <p className="mt-14 text-sm font-black tracking-[0.15em] text-white">
              **** 8829
            </p>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                Nebeng Corp
              </p>
              <div className="flex -space-x-3">
                <div className="h-5 w-5 rounded-full bg-rose-500/90" />
                <div className="h-5 w-5 rounded-full bg-amber-500/90" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransfersCard({ transfers }) {
  return (
    <div className="h-full rounded-[28px] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0]">
      <h2 className="text-xl font-black text-[#0f172a]">Aktivitas Terbaru</h2>
      <div className="mt-8 space-y-6">
        {transfers.length > 0 ? (
          transfers.map((t, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#f0f7ff] flex items-center justify-center text-[#4e73df] font-black uppercase text-lg">
                  {(t.deals?.depositor?.name || "U").charAt(0)}
                </div>
                <div>
                  <p className="text-[15px] font-black text-[#0f172a]">
                    {t.deals?.depositor?.name || "Pengguna Tidak Dikenal"}
                  </p>
                  <p className="text-xs font-bold text-[#94a3b8]">
                    {new Date(t.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-600">
                {formatIDR(t.gross_amount)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm font-bold text-[#94a3b8] py-4 text-center">
            Tidak ada transaksi terbaru
          </p>
        )}
      </div>
    </div>
  );
}

function SecurityCard() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[28px] bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0]">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#f0f7ff] text-[#4e73df] shadow-lg shadow-[#4e73df]/10">
        <Fingerprint size={36} strokeWidth={2.5} />
      </div>
      <h2 className="text-xl font-black text-[#0f172a]">Keamanan Sistem</h2>
      <p className="mt-3 text-sm font-semibold text-[#64748b]">
        Jaga integritas operasional dengan memperbarui kredensial admin secara
        berkala.
      </p>
      <button className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#4e73df] py-4 text-sm font-black text-white shadow-xl shadow-[#4e73df]/20 transition-all hover:bg-[#3b59bd] hover:scale-[1.02] active:scale-95">
        Pengaturan Keamanan
      </button>
    </div>
  );
}
