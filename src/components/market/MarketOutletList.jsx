import { useEffect, useState } from "react";
import MarketOutletCard from "./MarketOutletCard";
import { supabase } from "../../lib/supabaseClient";

export default function MarketOutletList({
  title,
  search = "",
  category = null,
}) {
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

  const loadOutlets = async (
    currentPage,
    keyword = "",
    selectedCategory = null,
  ) => {
    setLoading(true);

    const from = (currentPage - 1) * LIMIT;
    const to = from + LIMIT - 1;

    let relatedIds = [];
    if (keyword) {
      relatedIds = await searchWarungsWithMatchingProducts(keyword);
    }

    let countQuery = supabase
      .from("warungs")
      .select("*", { count: "exact", head: true });

    if (keyword) {
      if (relatedIds.length > 0) {
        countQuery = countQuery.or(
          `name.ilike.%${keyword}%,id.in.(${relatedIds.join(",")})`,
        );
      } else {
        countQuery = countQuery.ilike("name", `%${keyword}%`);
      }
    }

    if (selectedCategory) {
      countQuery = countQuery.eq("category", selectedCategory);
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
      `,
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (keyword) {
      if (relatedIds.length > 0) {
        dataQuery = dataQuery.or(
          `name.ilike.%${keyword}%,id.in.(${relatedIds.join(",")})`,
        );
      } else {
        dataQuery = dataQuery.ilike("name", `%${keyword}%`);
      }
    }

    if (selectedCategory) {
      dataQuery = dataQuery.eq("category", selectedCategory);
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-4 flex items-center justify-between gap-3 px-1">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-slate-50" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-72 w-[88%] shrink-0 animate-pulse rounded-[38px] bg-slate-100/50 sm:w-[44%]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!outlets.length) return null;

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          {title}
        </h2>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-1.5 shadow-sm border border-slate-50">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4e73df] animate-pulse"></span>
          <span className="text-[12px] font-bold text-slate-500">
            {total} Outlets
          </span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {outlets.map((outlet) => (
          <div key={outlet.id} className="w-[88%] shrink-0 sm:w-[44%]">
            <MarketOutletCard outlet={outlet} />
          </div>
        ))}
      </div>

      {totalPage > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPage }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPage(index + 1)}
              className={
                index === page - 1
                  ? "h-2.5 w-8 rounded-full bg-[#4e73df] transition-all"
                  : "h-2.5 w-2.5 rounded-full bg-slate-300 transition-all hover:bg-slate-400"
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
