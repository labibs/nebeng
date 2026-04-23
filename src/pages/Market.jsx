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
import SearchModal from "../components/common/SearchModal";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { Star, MapPin, ArrowUpDown } from "lucide-react";

export default function MarketPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [starRating, setStarRating] = useState([0, 5]);
  const [sortBy, setSortBy] = useState("terdekat");

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

  // Client-side filtering for price
  const filteredProducts = (products || []).filter((p) => {
    const price = Number(p.estimated_price || 0);
    return price >= priceRange[0] && price <= priceRange[1];
  });

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
          onOpenFilter={() => setIsFilterOpen(true)}
        />

        <SearchModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          value={search}
          onChange={setSearch}
          placeholder="Filter produk..."
        >
          <div className="flex-1 overflow-y-auto px-1 py-4 space-y-6 max-h-[65vh]">
            {/* Sort By */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <ArrowUpDown size={14} className="text-[#4e73df]" />
                <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                  Urutkan
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["terdekat", "terjauh", "terbaru", "populer"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all ${
                      sortBy === opt
                        ? "bg-[#4e73df] text-white shadow-md"
                        : "bg-slate-50 text-slate-400 border border-slate-100 hover:text-[#4e73df]"
                    }`}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4 rounded-[24px] border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex justify-between items-center text-[12px] font-bold text-slate-700">
                <span className="uppercase tracking-wider">Rentang Harga</span>
                <span className="text-[#4e73df]">
                  Rp {priceRange[0].toLocaleString()} -{" "}
                  {priceRange[1].toLocaleString()}
                </span>
              </div>
              <div className="px-1">
                <Slider
                  range
                  min={0}
                  max={1000000}
                  step={10000}
                  value={priceRange}
                  onChange={setPriceRange}
                  allowCross={false}
                  trackStyle={[{ backgroundColor: "#4e73df" }]}
                  handleStyle={[
                    { borderColor: "#4e73df" },
                    { borderColor: "#4e73df" },
                  ]}
                />
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-4 rounded-[24px] border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex justify-between items-center text-[12px] font-bold text-slate-700">
                <div className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span>Rating Bintang</span>
                </div>
                <span className="text-[#4e73df]">
                  {starRating[0]} - {starRating[1]}
                </span>
              </div>
              <div className="px-1">
                <Slider
                  range
                  min={0}
                  max={5}
                  step={0.5}
                  value={starRating}
                  onChange={setStarRating}
                  allowCross={false}
                  trackStyle={[{ backgroundColor: "#4e73df" }]}
                />
              </div>
            </div>

            <button
              onClick={() => setIsFilterOpen(false)}
              className="w-full h-12 rounded-2xl bg-[#4e73df] text-white text-[14px] font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
            >
              Terapkan Filter
            </button>
          </div>
        </SearchModal>

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
            products={filteredProducts.filter((p) => p.owner_id !== user?.id)}
            loading={false}
          />
        </div>
      </div>
    </motion.div>
  );
}
