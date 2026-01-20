import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import MarketOutletCard from "../market/MarketOutletCard";

const LIMIT = 10;

export default function OutletList({
  clerkId,
  onSelectOutlet,
  selectedOutletId,
}) {
  console.log("OutletList rendered with clerkId:", clerkId);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const scrollRef = useRef(null);
  const totalPage = Math.ceil(total / LIMIT);

  async function loadOutlets(currentPage) {
    setLoading(true);

    const from = (currentPage - 1) * LIMIT;
    const to = from + LIMIT - 1;

    // total count
    const { count } = await supabase
      .from("warungs")
      .select("*", { count: "exact", head: true })
      .eq("created_by_clerk_id", clerkId);

    setTotal(count || 0);

    // data
    const { data, error } = await supabase
      .from("warungs")
      .select("*")
      .eq("created_by_clerk_id", clerkId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setOutlets(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (clerkId) loadOutlets(page);
  }, [clerkId, page]);

  // pindah slide via dot
  const goToSlide = (index) => {
    if (!scrollRef.current) return;

    const cardWidth = scrollRef.current.firstChild?.offsetWidth || 0;
    scrollRef.current.scrollTo({
      left: cardWidth * index,
      behavior: "smooth",
    });

    setPage(index + 1);
  };

  if (!outlets.length) return null;

  if (loading) {
    return <p className="text-sm opacity-60">Memuat outlet...</p>;
  }

  if (!outlets.length) {
    return (
      <div className="p-4 border rounded-xl text-center opacity-60">
        Kamu belum punya outlet
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ===== HEADER ===== */}
      {/* <div className="flex justify-between items-center mb-3 mt-3 px-4">
        <h2 className="font-bold text-lg">Outlet saya</h2>
        <button className="text-sm text-success">Semua</button>
      </div> */}

      {/* ===== HORIZONTAL SCROLL ===== */}
      <div
        ref={scrollRef}
        className="
          flex gap-3 px-4 py-2
          overflow-x-auto
          snap-x snap-mandatory
          scrollbar-hide
        "
      >
        {outlets.map((outlet) => {
          const isActive = outlet.id === selectedOutletId;

          return (
            <div
              key={outlet.id}
              onClick={() => onSelectOutlet(outlet)}
              className={`
                snap-start w-[85%] sm:w-[45%] flex-shrink-0
                cursor-pointer transition
                ${isActive ? "ring-2 ring-primary rounded-xl" : ""}
              `}
            >
              <MarketOutletCard outlet={outlet} />
            </div>
          );
        })}
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
                  transition-all duration-300 rounded-full
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
