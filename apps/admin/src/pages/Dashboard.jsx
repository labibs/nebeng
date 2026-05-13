import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  MessageSquareText,
  ReceiptText,
  Store,
  Users,
  WalletCards,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const metrics = [
  { key: "users", label: "Users", table: "users", icon: Users, tone: "blue" },
  { key: "posts", label: "Posts", table: "posts", icon: Activity, tone: "cyan" },
  { key: "warungs", label: "Outlets", table: "warungs", icon: Store, tone: "green" },
  { key: "deals", label: "Deals", table: "deals", icon: MessageSquareText, tone: "violet" },
  {
    key: "transactions",
    label: "Transaksi",
    table: "transactions",
    icon: ReceiptText,
    tone: "amber",
  },
];

const trendPoints = [26, 18, 22, 16, 40, 28, 30, 20, 36, 31, 44, 33, 36, 38, 47, 45];
const barPoints = [42, 58, 45, 71, 64, 83, 74];

async function getCount(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

function formatNumber(value) {
  if (value === undefined || value === null) return "0";
  return value.toLocaleString("id-ID");
}

function makePath(points, width = 560, height = 170) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 30) - 15;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function MetricCard({ metric, value, loading }) {
  const toneClass = {
    blue: "bg-[#edf3ff] text-[#4e73df]",
    cyan: "bg-cyan-50 text-cyan-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  }[metric.tone];

  return (
    <div className="rounded-[22px] bg-white p-5 shadow-[0_20px_60px_rgba(42,79,150,0.10)]">
      <div className="flex items-center justify-between gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-full ${toneClass}`}>
          <metric.icon size={21} />
        </div>
        <MiniSparkline />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{metric.label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-3xl font-black tracking-tight">
          {loading ? "..." : formatNumber(value)}
        </p>
        <span className="rounded-full bg-[#edf3ff] px-2.5 py-1 text-xs font-black text-[#4e73df]">
          +12%
        </span>
      </div>
    </div>
  );
}

function MiniSparkline() {
  return (
    <svg className="h-9 w-20 text-[#4e73df]/45" viewBox="0 0 90 40" fill="none">
      <path
        d="M4 28 C16 5 25 35 38 18 C49 4 56 26 66 13 C75 2 81 15 86 9"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LineChartPanel({ counts }) {
  const total =
    (counts.users || 0) +
    (counts.posts || 0) +
    (counts.warungs || 0) +
    (counts.deals || 0) +
    (counts.transactions || 0);

  return (
    <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_rgba(42,79,150,0.10)] xl:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">Aktivitas Platform</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
              <CheckCircle2 size={13} />
              Stabil
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Total sinyal operasional dari data utama.
          </p>
        </div>
        <div className="rounded-2xl bg-[#edf3ff] px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#4e73df]">
            Total
          </p>
          <p className="text-2xl font-black">{formatNumber(total)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
          <p className="text-xs font-bold text-slate-400">User share</p>
          <p className="mt-1 text-xl font-black">{formatNumber(counts.users || 0)}</p>
        </div>
        <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
          <p className="text-xs font-bold text-slate-400">Post aktif</p>
          <p className="mt-1 text-xl font-black">{formatNumber(counts.posts || 0)}</p>
        </div>
        <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
          <p className="text-xs font-bold text-slate-400">Deal flow</p>
          <p className="mt-1 text-xl font-black">{formatNumber(counts.deals || 0)}</p>
        </div>
      </div>

      <div className="mt-6 h-[220px] overflow-hidden rounded-[20px] bg-gradient-to-b from-[#f8fbff] to-white">
        <svg viewBox="0 0 560 200" className="h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4e73df" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#4e73df" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[45, 85, 125, 165].map((y) => (
            <line
              key={y}
              x1="0"
              x2="560"
              y1={y}
              y2={y}
              stroke="#dbeafe"
              strokeDasharray="8 10"
            />
          ))}
          <path
            d={`${makePath(trendPoints, 560, 180)} L 560 200 L 0 200 Z`}
            fill="url(#lineFill)"
          />
          <path
            d={makePath(trendPoints, 560, 180)}
            fill="none"
            stroke="#4e73df"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}

function GaugePanel({ counts }) {
  const transactions = counts.transactions || 0;
  const deals = counts.deals || 0;
  const rate = deals ? Math.min(92, Math.round((transactions / deals) * 100)) : 0;
  const dash = `${rate * 1.57} 157`;

  return (
    <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_rgba(42,79,150,0.10)]">
      <h2 className="text-xl font-black">Konversi</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">
        Transaksi dibanding deal.
      </p>
      <div className="mt-8 flex justify-center">
        <div className="relative h-36 w-64">
          <svg viewBox="0 0 220 130" className="h-full w-full">
            <path
              d="M30 110 A80 80 0 0 1 190 110"
              fill="none"
              stroke="#e6eefb"
              strokeWidth="26"
              strokeLinecap="round"
            />
            <path
              d="M30 110 A80 80 0 0 1 190 110"
              fill="none"
              stroke="#4e73df"
              strokeDasharray={dash}
              strokeWidth="26"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-x-0 bottom-1 text-center">
            <p className="text-4xl font-black">{rate}%</p>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              success rate
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BarsPanel() {
  return (
    <section className="rounded-[24px] bg-[#4e73df] p-6 text-white shadow-[0_20px_60px_rgba(78,115,223,0.22)]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black">Traffic</h2>
          <p className="mt-1 text-sm font-medium text-white/70">7 hari terakhir</p>
        </div>
        <ArrowUpRight />
      </div>
      <div className="mt-8 flex h-36 items-end gap-3">
        {barPoints.map((point, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-xl bg-white/85"
              style={{ height: `${point}%` }}
            />
            <span className="text-[10px] font-bold text-white/70">{index + 1}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivityPanel({ counts }) {
  const items = [
    { label: "User terdaftar", value: counts.users || 0, tone: "bg-[#4e73df]" },
    { label: "Posting perjalanan", value: counts.posts || 0, tone: "bg-cyan-500" },
    { label: "Outlet aktif", value: counts.warungs || 0, tone: "bg-emerald-500" },
  ];

  return (
    <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_rgba(42,79,150,0.10)]">
      <h2 className="text-xl font-black">Aktivitas</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className={`h-11 w-1.5 rounded-full ${item.tone}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{item.label}</p>
              <p className="text-xs font-medium text-slate-400">Update realtime</p>
            </div>
            <span className="rounded-full bg-[#edf3ff] px-3 py-1 text-sm font-black text-[#4e73df]">
              {formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const entries = await Promise.all(
          metrics.map(async (metric) => [metric.key, await getCount(metric.table)]),
        );

        if (active) setCounts(Object.fromEntries(entries));
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            value={counts[metric.key]}
            loading={loading}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <LineChartPanel counts={counts} />
        <GaugePanel counts={counts} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_rgba(42,79,150,0.10)] lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#edf3ff] text-[#4e73df]">
              <WalletCards size={25} />
            </div>
            <div>
              <h2 className="text-xl font-black">Kesehatan Data</h2>
              <p className="text-sm font-medium text-slate-500">
                Ringkasan akses admin.
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            Admin panel sudah terpisah dari PWA user. Untuk update data penting,
            lanjutkan lewat endpoint backend khusus admin.
          </p>
          <button className="mt-6 rounded-2xl bg-[#4e73df] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#4e73df]/20">
            Lihat Detail
          </button>
        </section>
        <BarsPanel />
        <ActivityPanel counts={counts} />
      </div>
    </div>
  );
}
