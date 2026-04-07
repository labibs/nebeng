import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { apiFetch } from "../lib/apiClient";
import LoadingLogo from "../components/LoadingLogo";
import MarketHeader from "../components/market/MarketHeader";
import MarketCategories from "../components/market/MarketCategories";
import MarketSection from "../components/market/MarketSection";
import MarketOutletList from "../components/market/MarketOutletList";
import MarketHeroCard from "../components/market/MarketHeroCard";

export default function MarketPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  const { user } = useUser();
  const ownerAvatar = user?.imageUrl || null;
  const ownerName = user?.firstName || user?.fullName || "Outlet Saya";

  async function loadProducts(keyword = "") {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (keyword) params.set("search", keyword);
      if (activeCategory) params.set("category", activeCategory);

      const data = await apiFetch(`/api/market/products?${params.toString()}`);
      setProducts(data || []);
    } catch (err) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [activeCategory]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts(search);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [search]);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7ff]">
        <LoadingLogo size="w-20 h-20" />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-[#f0f7ff]"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
    >
      <div className="relative min-h-screen overflow-hidden bg-[#f0f7ff] pb-24 text-slate-900">
        {/* Animated Background blobs for extra visual polish */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute -right-20 top-60 h-[400px] w-[400px] rounded-full bg-blue-100/50 blur-3xl" />

        <MarketHeader
          search={search}
          owner_avatar={ownerAvatar}
          owner_name={ownerName}
          onSearchChange={setSearch}
        />

        <div className="relative z-10 space-y-6 px-4 pb-8">
          <MarketCategories
            active={activeCategory}
            onChange={setActiveCategory}
          />

          <MarketOutletList
            title="Outlet Pilihan"
            search={search}
            category={activeCategory}
          />

          <MarketSection
            title="Daftar Item"
            products={(products || []).filter((p) => p.owner_id !== user?.id)}
            loading={false}
          />
        </div>
      </div>
    </motion.div>
  );
}
