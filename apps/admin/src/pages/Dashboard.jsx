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
  Store,
  Package,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import LoadingLogo from "../components/LoadingLogo";

// Helper for formatting
const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const formatNumber = (val) => new Intl.NumberFormat("id-ID").format(val || 0);

const getDealStatusBadgeClass = (status) => {
  const classes = {
    pending: "bg-amber-50 text-amber-600 border border-amber-100",
    accepted: "bg-sky-50 text-sky-600 border border-sky-100",
    on_going: "bg-cyan-50 text-cyan-600 border border-cyan-100",
    completed: "bg-blue-50 text-blue-600 border border-blue-100",
    cancelled: "bg-rose-50 text-rose-600 border border-rose-100",
    canceled: "bg-rose-50 text-rose-600 border border-rose-100",
    draft: "bg-slate-50 text-slate-600 border border-slate-100",
  };

  return classes[status?.toLowerCase()] || "bg-zinc-50 text-zinc-600 border border-zinc-100";
};

export default function Dashboard() {
  const [data, setData] = useState({
    users: 0,
    posts: 0,
    transactionsCount: 0,
    revenue: 0,
    dealsCount: 0,
    outletsCount: 0,
    productsCount: 0,
    ownersCount: 0,
    recentTransfers: [],
    recentOwners: [],
    recentDeals: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { count: users },
          { count: posts },
          { data: transData },
          { count: dealsCount },
          { data: outletsData },
          { count: products },
          { data: recentTrans },
          { data: recentDealsData },
        ] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("posts").select("*", { count: "exact", head: true }),
          supabase.from("transactions").select("gross_amount"),
          supabase.from("deals").select("*", { count: "exact", head: true }),
          supabase.from("warungs").select("*, owner:users(name, avatar_url)"),
          supabase
            .from("warung_products")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("transactions")
            .select(
              `
              *,
              deals (
                id,
                depositor:users!fk_deals_depositor (
                  name,
                  avatar_url
                )
              )
            `,
            )
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("deals")
            .select(
              "*, post:posts(item_photo), depositor:users!fk_deals_depositor(name)",
            )
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const totalRevenue =
          transData?.reduce((acc, curr) => acc + (curr.gross_amount || 0), 0) ||
          0;

        const uniqueOwnersMap = new Map();
        outletsData?.forEach((w) => {
          if (w.owner) {
            uniqueOwnersMap.set(w.owner.name, w.owner.avatar_url);
          }
        });

        const ownersCount = uniqueOwnersMap.size;
        const recentOwnersAvatars = Array.from(uniqueOwnersMap.values()).slice(
          0,
          5,
        );

        setData({
          users: users || 0,
          posts: posts || 0,
          transactionsCount: transData?.length || 0,
          revenue: totalRevenue,
          dealsCount: dealsCount || 0,
          outletsCount: outletsData?.length || 0,
          productsCount: products || 0,
          ownersCount: ownersCount,
          recentTransfers: recentTrans || [],
          recentOwners: recentOwnersAvatars,
          recentDeals: recentDealsData || [],
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
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingLogo />
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
          label="Total Deal"
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
        <InventoryChartCard
          outlets={data.outletsCount}
          products={data.productsCount}
          ownersCount={data.ownersCount}
          owners={data.recentOwners}
        />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <TransfersCard transfers={data.recentTransfers} />
      </div>
      <div className="col-span-12 lg:col-span-3">
        <RecentDealsCard deals={data.recentDeals} />
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
          {percentage}% dari Deal telah berhasil dikonversi menjadi transaksi
          berbayar.
        </p>
      </div>
    </div>
  );
}

function InventoryChartCard({ outlets, products, ownersCount, owners }) {
  // Simple logic to calculate relative percentages for visualization
  const pOutlet = Math.min(100, Math.round((outlets / 50) * 100)) || 64;
  const pProduct = Math.min(100, Math.round((products / 150) * 100)) || 73;
  const pOwner = Math.min(100, Math.round((ownersCount / 30) * 100)) || 48;

  const RadialRing = ({ percentage, color, radius, stroke = 12 }) => {
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
      <circle
        r={radius}
        cx="100"
        cy="100"
        fill="transparent"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    );
  };

  return (
    <div className="h-full rounded-[28px] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-black text-[#0f172a]">
          Persentase Inventaris
        </h2>
        <div className="flex bg-[#f8fafc] p-1 rounded-xl border border-[#e2e8f0]">
          <button className="px-3 py-1 text-[10px] font-bold text-[#64748b]">
            Harian
          </button>
          <button className="px-3 py-1 text-[10px] font-bold text-[#64748b]">
            Mingguan
          </button>
          <button className="px-3 py-1 text-[10px] font-bold bg-white text-[#4e73df] rounded-lg shadow-sm">
            Bulanan
          </button>
        </div>
      </div>

      <div className="bg-[#f8fafc] rounded-2xl p-5 flex items-center justify-between mb-10 border border-[#f1f5f9]">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-[#0d6e5c] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#0d6e5c]/20">
            <Store size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
              Total Toko
            </p>
            <p className="text-2xl font-black text-[#0f172a]">
              {formatNumber(outlets)}
            </p>
          </div>
        </div>
        <div className="flex -space-x-3">
          {owners.map((url, i) => (
            <img
              key={i}
              src={url}
              className="h-9 w-9 rounded-full border-4 border-white object-cover shadow-sm"
              alt=""
            />
          ))}
          <div className="h-9 w-9 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
            +{Math.max(0, ownersCount - owners.length)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 items-center">
        <div className="col-span-7 relative h-48 w-48">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            {/* Background Rings */}
            <circle
              r="80"
              cx="100"
              cy="100"
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="12"
            />
            <circle
              r="60"
              cx="100"
              cy="100"
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="12"
            />
            <circle
              r="40"
              cx="100"
              cy="100"
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="12"
            />

            {/* Data Rings */}
            <RadialRing percentage={pOutlet} color="#b49352" radius="80" />
            <RadialRing percentage={pProduct} color="#0d6e5c" radius="60" />
            <RadialRing percentage={pOwner} color="#1e293b" radius="40" />
          </svg>
        </div>
        <div className="col-span-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#b49352] rounded-full" />
            <div className="flex-1">
              <p className="text-xl font-black text-[#0f172a]">
                {formatNumber(outlets)}
              </p>
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-tighter">
                Total Toko
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#0d6e5c] rounded-full" />
            <div className="flex-1">
              <p className="text-xl font-black text-[#0f172a]">
                {formatNumber(products)}
              </p>
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-tighter">
                Total Produk
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#1e293b] rounded-full" />
            <div className="flex-1">
              <p className="text-xl font-black text-[#0f172a]">
                {formatNumber(ownersCount)}
              </p>
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-tighter">
                Pemilik Toko
              </p>
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
      <h2 className="text-xl font-black text-[#0f172a]">Transaksi Terbaru</h2>
      <div className="mt-8 space-y-6">
        {transfers.length > 0 ? (
          transfers.map((t, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#f0f7ff] overflow-hidden border border-[#e2e8f0] flex items-center justify-center">
                  {t.deals?.depositor?.avatar_url ? (
                    <img
                      src={t.deals.depositor.avatar_url}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="text-[#4e73df] font-black uppercase text-lg">
                      {(t.deals?.depositor?.name || "U").charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[15px] font-black text-[#0f172a]">
                    {t.deals?.depositor?.name || "Pengguna Tidak Dikenal"}
                  </p>
                  <p className="text-[10px] font-bold text-[#94a3b8]">
                    {new Date(t.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    •{" "}
                    {new Date(t.created_at).toLocaleTimeString("id-ID", {
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

function RecentDealsCard({ deals }) {
  return (
    <div className="h-full rounded-[28px] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0]">
      <h2 className="text-xl font-black text-[#0f172a]">Deal Terbaru</h2>
      <div className="mt-8 space-y-5">
        {deals.length > 0 ? (
          deals.map((d, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <div className="h-12 w-12 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 flex items-center justify-center shadow-sm">
                {d.post?.item_photo ? (
                  <img
                    src={d.post.item_photo}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                    alt=""
                  />
                ) : (
                  <div className="h-full w-full bg-[#f0f7ff] flex items-center justify-center text-[#4e73df]">
                    <Handshake size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[#0f172a] truncate group-hover:text-[#4e73df] transition-colors">
                  {d.item_description || "Jasa Titip / Barang"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase truncate max-w-[80px]">
                    {d.depositor?.name || "User"}
                  </span>
                  <span className="text-[10px] font-bold text-[#bcbebc] whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    •{" "}
                    {new Date(d.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${getDealStatusBadgeClass(d.status)}`}
                  >
                    {d.status || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm font-bold text-[#94a3b8] py-4 text-center">
            Belum ada Deal
          </p>
        )}
      </div>
    </div>
  );
}
