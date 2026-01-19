import MarketHeader from "../components/market/MarketHeader";
import MarketCategories from "../components/market/MarketCategories";
import MarketQuickIcons from "../components/market/MarketQuickIcons";
import MarketPromoBanner from "../components/market/MarketPromoBanner";
import MarketSection from "../components/market/MarketSection";
import MarketOutletList from "../components/market/MarketOutletList";

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200 dark:from-slate-900 dark:to-slate-800 ">
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
  )
}