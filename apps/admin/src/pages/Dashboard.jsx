import { useEffect, useState } from "react";
import { Activity, MessageSquareText, ReceiptText, Store, Users } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const metrics = [
  { key: "users", label: "Users", table: "users", icon: Users },
  { key: "posts", label: "Posts", table: "posts", icon: Activity },
  { key: "warungs", label: "Outlets", table: "warungs", icon: Store },
  { key: "deals", label: "Deals", table: "deals", icon: MessageSquareText },
  { key: "transactions", label: "Transactions", table: "transactions", icon: ReceiptText },
];

async function getCount(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
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
      <div>
        <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan awal dari database Supabase Nebeng.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-500">{metric.label}</div>
              <metric.icon size={18} className="text-slate-400" />
            </div>
            <div className="mt-5 text-3xl font-black">
              {loading ? "..." : counts[metric.key]?.toLocaleString("id-ID") || "0"}
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-black">Catatan akses</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Dashboard ini sudah terpisah dari PWA user, tetapi operasi admin yang
          sensitif tetap sebaiknya lewat endpoint backend khusus admin.
        </p>
      </section>
    </div>
  );
}
