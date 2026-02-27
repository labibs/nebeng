import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from "../lib/apiClient";
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
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeQuick, setActiveQuick] = useState(null);

  const { user, isLoaded } = useUser();
  const owner_avatar = user?.imageUrl || null;

  async function loadProducts(keyword = "") {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (keyword) params.set('search', keyword);
      if (activeCategory) params.set('category', activeCategory);
      if (activeQuick) params.set('category_id', activeQuick);

      const data = await apiFetch(`/api/market/products?${params.toString()}`);
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    loadProducts();
  }, [activeCategory, activeQuick]);

  // search effect (debounced)
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
          owner_avatar={owner_avatar}
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