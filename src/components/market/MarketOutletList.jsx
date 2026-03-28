import { useEffect, useState } from "react";
import MarketOutletCard from "./MarketOutletCard";
import { supabase } from "../../lib/supabaseClient";

export default function MarketOutletList({ title, search = "", category = null }) {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const LIMIT = 6;

  useEffect(() => {
    loadOutlets(page, search, category);
  }, [page]);

  useEffect(() => {
    setPage(1);
    loadOutlets(1, search, category);
  }, [search, category]);

  async function searchWarungsWithMatchingProducts(keyword) {
    const { data } = await supabase
      .from("warung_products")
      .select("warung_id")
      .ilike("name", `%${keyword}%`);
    return [...new Set(data?.map((item) => item.warung_id) || [])];
  }

  const loadOutlets = async (currentPage, keyword = "", category = null) => {
    setLoading(true);

    const from = (currentPage - 1) * LIMIT;
    const to = from + LIMIT - 1;

    // 1. Cari warung ID yang produknya cocok dengan keyword
    let relatedIds = [];
    if (keyword) {
      relatedIds = await searchWarungsWithMatchingProducts(keyword);
    }

    // 2. Query dasar
    let countQuery = supabase
      .from("warungs")
      .select("*", { count: "exact", head: true });

    // Filter Keyword (Nama Warung OR Punya Produk Cocok)
    if (keyword) {
      if (relatedIds.length > 0) {
        countQuery = countQuery.or(`name.ilike.%${keyword}%,id.in.(${relatedIds.join(",")})`);
      } else {
        countQuery = countQuery.ilike("name", `%${keyword}%`);
      }
    }

    if (category) {
      countQuery = countQuery.eq("category", category);
    }

    const { count } = await countQuery;
    setTotal(count || 0);

    let dataQuery = supabase
      .from("warungs")
      .select(
        `
        *,
        owner:users!warungs_created_by_clerk_id_fkey (
          avatar_url,
          name
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    // Apply logic yang sama untuk dataQuery
    if (keyword) {
      if (relatedIds.length > 0) {
        dataQuery = dataQuery.or(`name.ilike.%${keyword}%,id.in.(${relatedIds.join(",")})`);
      } else {
        dataQuery = dataQuery.ilike("name", `%${keyword}%`);
      }
    }

    if (category) {
      dataQuery = dataQuery.eq("category", category);
    }

    if (category) {
      dataQuery = dataQuery.eq("category", category);
    }

    const { data, error } = await dataQuery;

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setOutlets(data || []);
    setLoading(false);
  };

  const totalPage = Math.ceil(total / LIMIT);

  const goToSlide = (index) => {
    setPage(index + 1);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm opacity-60">
        Memuat outlet...
      </div>
    );
  }

  if (!outlets.length) return null;

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2 mt-3">
        <h2 className="font-bold text-lg">{title}</h2>
        <button className="text-sm text-success">Semua</button>
      </div>

      {/* ===== HORIZONTAL SCROLL ===== */}
      <div className="flex gap-3 px-3 py-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
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
                className={`transition-all duration-500 rounded-full ${index === page - 1
                  ? "bg-black dark:bg-white w-8 h-2"
                  : "bg-black/30 dark:bg-white/30 w-2 h-2 hover:bg-black/60"
                  }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}