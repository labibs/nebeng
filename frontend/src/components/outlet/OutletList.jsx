import { useEffect, useState, useRef } from "react";
import { apiFetch } from "../../lib/apiClient";
import MarketOutletCard from "../market/MarketOutletCard";

const LIMIT = 10;

export default function OutletList({
  clerkId,
  onSelectOutlet,
  selectedOutletId,
}) {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const scrollRef = useRef(null);
  const totalPage = Math.ceil(total / LIMIT);

  async function loadOutlets(currentPage) {
    setLoading(true);

    const from = (currentPage - 1) * LIMIT;

    try {
      // total count
      const countData = await apiFetch(`/warungs/count?created_by=${clerkId}`);
      const totalCount = countData?.count || 0;
      setTotal(totalCount);

      // data
      const data = await apiFetch(`/warungs?created_by=${clerkId}&limit=${LIMIT}&offset=${from}`);
      const outlets = Array.isArray(data) ? data : [];
      setOutlets(outlets);

      // auto select outlet pertama di halaman
      if (!selectedOutletId && outlets.length) {
        onSelectOutlet(outlets[0]);
      }
    } catch (error) {
      console.error(error);
    }

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

  if (loading && outlets.length === 0) {
    return <p className="text-sm opacity-60">Memuat outlet...</p>;
  }

  if (!loading && outlets.length === 0) {
    return (
      <div className="p-4 border rounded-xl text-center opacity-60">
        Kamu belum punya outlet, klik tombol + dan pilih Tambah Outlet
      </div>
    );
  }

  return (
    <div className="relative">
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
                ${isActive ? "ring-2 ring-primary rounded-[26px]" : ""}
              `}
            >
              <MarketOutletCard outlet={outlet} clickable={false} />
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
