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
  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("warung_products")
      .select(`
        id,
        name,
        estimated_price,
        image_url,
        rating,
        is_estimated,
        created_by_clerk_id,
        created_at,
        warung:warungs (
          name,
          category,
          status
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error) setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <motion.div
        className="min-h-screen bg-base-100 "
        initial={{ x: "100%", opacity: 0 }} // masuk dari kanan
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "-100%", opacity: 0 }}   // keluar ke kiri
        transition={{
            type: "tween",
            ease: "easeOut",
            duration: 0.35,
        }}
        >
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200 dark:from-slate-900 dark:to-slate-800 pb-24">
      {/* Navbar – transparan dengan blur */}
      <MarketHeader />
      <MarketCategories />
      <MarketQuickIcons />
      <MarketPromoBanner />
      <div className="px-4 space-y-6 pb-10">
        <MarketOutletList title="Daftar Outlet" />
        <MarketSection
          title="Produk Terbaru"
          products={products}
      />
      </div>
    </div>
    </motion.div>
  )
}