import { motion } from "framer-motion";
import MarketHeader from "../components/market/MarketHeader";
import MarketCategories from "../components/market/MarketCategories";
import MarketQuickIcons from "../components/market/MarketQuickIcons";
import MarketPromoBanner from "../components/market/MarketPromoBanner";
import MarketSection from "../components/market/MarketSection";
import MarketOutletList from "../components/market/MarketOutletList";

export default function MarketPage() {
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
        <MarketSection title="Trending Item" />
      </div>
    </div>
    </motion.div>
  )
}