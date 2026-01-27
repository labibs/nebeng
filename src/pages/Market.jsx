import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";
import MarketHeader from "../components/market/MarketHeader";
import MarketCategories from "../components/market/MarketCategories";
import MarketQuickIcons from "../components/market/MarketQuickIcons";
import MarketPromoBanner from "../components/market/MarketPromoBanner";
import MarketSection from "../components/market/MarketSection";
import MarketOutletList from "../components/market/MarketOutletList";

export default function MarketPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null); // kategori besar
  const [activeQuick, setActiveQuick] = useState(null);

  async function searchWarungIds(keyword) {
    if (!keyword) return [];

    const { data } = await supabase
      .from("warungs")
      .select("id")
      .ilike("name", `%${keyword}%`);

    return data?.map(w => w.id) || [];
  }

  async function loadProducts(keyword = "") {
    setLoading(true);

    const warungIds = await searchWarungIds(keyword);

    let query = supabase
      .from("warung_products")
      .select(`
          id,
          name,
          estimated_price,
          image_url,
          rating,
          is_estimated,
          created_at,
          categories:category_id ( name ),
          warung:warungs!inner ( name, category, status )
        `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (keyword) {
      if (warungIds.length) {
        query = query.or(
          `name.ilike.%${keyword}%,warung_id.in.(${warungIds.join(",")})`
        );
      } else {
        query = query.ilike("name", `%${keyword}%`);
      }
    }

    if (activeCategory) {
      query = query.eq("warung.category", activeCategory);
    }

    if (activeQuick) {
      query = query.eq("category_id", activeQuick);
    }

    const { data, error } = await query;

    if (!error) {
      setProducts(
        (data || []).map(p => ({
          ...p,
          category_name: p.categories?.name,
        }))
      );
    }

    setLoading(false);
  }

  // initial load
  useEffect(() => {
    loadProducts();
  }, [activeCategory, activeQuick]);

  // search effect (debounced ringan)
  useEffect(() => {
    const t = setTimeout(() => {
      loadProducts(search);
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  return (
    <motion.div
      className="min-h-screen bg-base-100"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
    >
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200 dark:from-slate-900 dark:to-slate-800 pb-24">
        <MarketHeader
          search={search}
          onSearchChange={setSearch}
        />

        <MarketCategories
          active={activeCategory}
          onChange={setActiveCategory}
        />

        <MarketQuickIcons
          active={activeQuick}
          onChange={setActiveQuick}
          warungCategory={activeCategory}
        />

        <MarketPromoBanner />

        <div className="px-4 space-y-3 pb-10">
          <MarketOutletList title="Daftar Outlet" search={search} category={activeCategory} />
          <MarketSection
            title="Daftar Produk"
            products={products}
            loading={loading}
            category={activeCategory}
            quick={activeQuick}
          />
        </div>
      </div>
    </motion.div>
  );
}