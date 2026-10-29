import { useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import MarketOutletCard from "./MarketOutletCard";
import { apiFetch } from "../../lib/apiClient";
import { useCachedFetch } from "../../lib/useCachedFetch";

const LIMIT = 6;

export default function MarketOutletList({
  title,
  search = "",
  category = null,
}) {
  const { user } = useUser();

  // Build dynamic cache key
  const cacheKey = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(LIMIT));
    params.set("exclude_user_id", user?.id || "");
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const qs = params.toString();
    return `outlets:${qs}`;
  }, [search, category, user?.id]);

  // Custom fetcher that handles the multi-step logic
  const fetchOutlets = useCallback(async () => {
    let relatedIds = [];
    if (search) {
      try {
        const data = await apiFetch(`/products?search=${encodeURIComponent(search)}`);
        relatedIds = [...new Set((Array.isArray(data) ? data : []).map((item) => item.warung_id).filter(Boolean))];
      } catch {
        // ignore
      }
    }

    const params = new URLSearchParams();
    params.set("limit", String(LIMIT));
    params.set("offset", "0");
    params.set("exclude_user_id", user?.id || "");

    if (search) {
      params.set("search", search);
      if (relatedIds.length > 0) {
        params.set("related_ids", relatedIds.join(","));
      }
    }
    if (category) {
      params.set("category", category);
    }

    const [outletsData, countData] = await Promise.all([
      apiFetch(`/warungs?${params.toString()}`),
      apiFetch(`/warungs/count?${new URLSearchParams({
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
        exclude_user_id: user?.id || "",
      }).toString()}`).catch(() => null),
    ]);

    const outlets = Array.isArray(outletsData) ? outletsData : [];
    const total = countData?.count || outlets.length || 0;

    return { outlets, total };
  }, [search, category, user?.id]);

  const { data, loading } = useCachedFetch(cacheKey, {
    ttl: 60_000,
    fetcher: fetchOutlets,
  });

  const outlets = data?.outlets || [];
  const total = data?.total || 0;

  if (loading && outlets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-4 flex items-center justify-between gap-3 px-1">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-[#e4edff]" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-[#edf3ff]" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-72 w-[78%] shrink-0 animate-pulse rounded-[26px] bg-gradient-to-br from-[#e4edff] to-[#edf3ff] sm:w-[40%]"
            />
          ))}
        </div>
      </div>
    );
  }

  const filteredOutlets = outlets.filter((o) => o.created_by_clerk_id !== user?.id);
  if (!filteredOutlets.length) return null;

  return (
    <div className="space-y-3">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="text-[18px] font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-1.5 shadow-sm border border-slate-50">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4e73df] animate-pulse"></span>
          <span className="text-[11px] font-semibold text-slate-500">
            {total} outlet
          </span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
        {filteredOutlets.map((outlet) => (
          <div key={outlet.id} className="w-[78%] shrink-0 sm:w-[40%]">
            <MarketOutletCard outlet={outlet} />
          </div>
        ))}
      </div>
    </div>
  );
}
