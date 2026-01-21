import { useEffect, useState } from "react";
import MarketOutletCard from "./MarketOutletCard";
import { supabase } from "../../lib/supabaseClient";

export default function MarketOutletList({ title }) {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const LIMIT = 6;

  useEffect(() => {
    loadOutlets(page);
  }, [page]);

  const loadOutlets = async (currentPage) => {
    setLoading(true);

    const from = (currentPage - 1) * LIMIT;
    const to = from + LIMIT - 1;

    const { count } = await supabase
      .from("warungs")
      .select("*", { count: "exact", head: true });

    setTotal(count || 0);

    const { data, error } = await supabase
      .from("warungs")
      .select(`
        *,
        owner:users!warungs_created_by_clerk_id_fkey (
          avatar_url,
          name
        )
      `)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error(error);
      return;
    }

    setOutlets(data || []);
    setLoading(false);
  };

  const totalPage = Math.ceil(total / LIMIT);

  const goToSlide = (index) => {
    setPage(index + 1);
  };

  // ===== RENDER =====

  if (loading) {
    return (
      <div className="p-4 text-center text-sm opacity-60">
        Memuat outlet...
      </div>
    );
  }

  return (
    <div className="relative">
        <div className="flex justify-between items-center mb-3 mt-3">
        <h2 className="font-bold text-lg">{title}</h2>
        <button className="text-sm text-success">Semua</button>
      </div>

      {/* ===== HORIZONTAL SCROLL ===== */}
      <div
        className="
          flex gap-3 px-3 py-2
          overflow-x-auto
          snap-x snap-mandatory
          scrollbar-hide
        "
      >
        {outlets.map((outlet) => (
          <div
            key={outlet.id}
            className="snap-start w-[85%] sm:w-[45%] flex-shrink-0"
          >
            <MarketOutletCard outlet={outlet} />
          </div>
        ))}
      </div>

      {/* ===== DOT PAGINATION ===== */}
      {totalPage > 1 && (
        <div className="mt-3 flex justify-center">
          <div className="flex gap-2">
            {Array.from({ length: totalPage }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`
                  transition-all duration-500 rounded-full
                  ${
                    index === page - 1
                      ? "bg-black dark:bg-white w-8 h-2"
                      : "bg-black/30 dark:bg-white/30 w-2 h-2 hover:bg-black/60"
                  }
                `}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}