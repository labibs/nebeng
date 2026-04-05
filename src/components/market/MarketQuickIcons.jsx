import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function MarketQuickIcons({ active, onChange, warungCategory }) {
  const [icons, setIcons] = useState([]);

  useEffect(() => {
    let query = supabase
      .from("categories")
      .select("id, name, icon, warung:warungs!inner(category)")
      .limit(10);

    if (warungCategory) {
      query = query.eq("warung.category", warungCategory);
    }

    query.then(({ data }) => {
      const fetched = data || [];
      setIcons(fetched);
      if (warungCategory && fetched.length > 0) {
        onChange(fetched[0].id);
      } else {
        onChange(null);
      }
    });
  }, [warungCategory, onChange]);

  if (!icons.length) return null;

  return (
    <div className="rounded-[30px] border border-white/60 bg-white/75 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#dff7f6] text-[#1697a0] dark:bg-emerald-500/15 dark:text-emerald-300">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Shortcut cepat
            </p>
            <p className="text-xs">Pilih kategori produk spesifik</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-medium text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
        >
          Reset
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {icons.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={
                isActive
                  ? "min-w-[78px] rounded-[26px] bg-[#1fb7c2] px-3 py-3 text-center text-white shadow-[0_16px_30px_rgba(31,183,194,0.28)] transition"
                  : "min-w-[78px] rounded-[26px] bg-[#f7f4ef] px-3 py-3 text-center text-slate-700 transition hover:bg-white dark:bg-slate-800 dark:text-slate-100"
              }
            >
              <div
                className={
                  isActive
                    ? "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl"
                    : "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                }
              >
                {item.icon || "🛍️"}
              </div>
              <p
                className={
                  isActive
                    ? "mt-2 text-xs font-medium text-white"
                    : "mt-2 text-xs font-medium text-slate-500 dark:text-slate-300"
                }
              >
                {item.name}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
