import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useClerk } from "@clerk/clerk-react";
import { supabase } from "../lib/supabaseClient";
import LoadingLogo from "../components/LoadingLogo";
import PostCard from "../components/PostCard";
import PostCardSkeleton from "../components/PostCardSkeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Mousewheel, Keyboard } from "swiper/modules";
import { Bike, Car, Bus, Train, Plane, Search, X } from "lucide-react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import SearchModal from "../components/common/SearchModal";

// Import CSS Swiper
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Profile from "./Profile";

export default function Home() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  // State management
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("semua");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isSyncingUser, setIsSyncingUser] = useState(false);
  const [feeRange, setFeeRange] = useState([0, 500000]); // default: 0 - 500rb
  const [isTopHeaderVisible, setIsTopHeaderVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const prevScrollY = useRef(0);
  const touchStartY = useRef(0);
  const [dateFilterMode, setDateFilterMode] = useState("all"); // 'all', 'today', 'tomorrow', 'thisWeek', 'thisMonth', 'custom'
  const [customDate, setCustomDate] = useState(""); // format YYYY-MM-DD
  const [armadaFilter, setArmadaFilter] = useState("all");

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Selalu tampilkan kalau sudah di paling atas
      if (currentScrollY <= 10) {
        // 10px tolerance
        setIsTopHeaderVisible(true);
        prevScrollY.current = currentScrollY;
        return;
      }

      // Hide kalau scroll down, show kalau scroll up
      if (currentScrollY > prevScrollY.current + 10) {
        // threshold 10px biar tidak terlalu sensitif
        setIsTopHeaderVisible(false);
      } else if (currentScrollY < prevScrollY.current - 10) {
        setIsTopHeaderVisible(true);
      }

      prevScrollY.current = currentScrollY;
    };

    // Touch events untuk mobile swipe (lebih responsif)
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!touchStartY.current) return;

      const currentTouchY = e.touches[0].clientY;
      const deltaY = touchStartY.current - currentTouchY; // positif = swipe down

      // Kalau swipe down cukup jauh, langsung hide
      if (deltaY > 30) {
        setIsTopHeaderVisible(false);
      }
      // Kalau swipe up cukup jauh, show
      else if (deltaY < -30) {
        setIsTopHeaderVisible(true);
      }
    };

    // Pasang listener
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          users (
            name,
            avatar_url
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync user data dengan Supabase
  useEffect(() => {
    if (!user || isSyncingUser) return;

    const syncUserToSupabase = async () => {
      setIsSyncingUser(true);

      try {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", user.id)
          .single();

        const userData = {
          clerk_id: user.id,
          name:
            user.fullName ||
            user.username ||
            user.primaryEmailAddress?.emailAddress.split("@")[0] ||
            "User",
          avatar_url: user.imageUrl,
        };

        if (!existingUser) {
          await supabase.from("users").insert(userData);
        } else {
          await supabase.from("users").update(userData).eq("clerk_id", user.id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSyncingUser(false);
      }
    };

    syncUserToSupabase();
  }, [user]); // ← Tetap hanya [user], karena isSyncingUser cuma guard

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        fetchPosts,
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchPosts]);

  const filteredPosts = posts.filter((post) => {
    // Tab filter
    if (activeTab !== "semua") {
      const target = activeTab === "titip" ? "titip" : "bawa";
      if (post.type !== target) return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fields = [
        post.from_city,
        post.to_city,
        post.item_description,
        post.description,
      ];

      if (!fields.some((f) => f?.toLowerCase().includes(q))) return false;
    }

    // Fee filter
    if (post.fee < feeRange[0] || post.fee > feeRange[1]) return false;

    // Armada filter
    if (armadaFilter !== "all" && post.armada !== armadaFilter) return false;

    // Date filter
    if (!post.travel_date) return false;

    const postDate = new Date(post.travel_date);
    if (isNaN(postDate)) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(
      today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1),
    );

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    switch (dateFilterMode) {
      case "today":
        return postDate.toDateString() === today.toDateString();
      case "tomorrow":
        return postDate.toDateString() === tomorrow.toDateString();
      case "thisWeek":
        return postDate >= startOfWeek && postDate <= endOfWeek;
      case "custom":
        return customDate
          ? postDate.toDateString() === new Date(customDate).toDateString()
          : true;
      default:
        return true;
    }
  });

  const MIN = 0;
  const MAX = 1000000;
  const STEP = 10000;

  const clamp = (v) => Math.min(MAX, Math.max(MIN, v));

  // Tab options

  const tabOptions = [
    { id: "semua", label: "Semua" },
    { id: "titip", label: "Mau Titip" },
    { id: "bawa", label: "Bisa Bawa" },
  ];

  // User menu items
  const userMenuItems = [
    { label: "Profil Saya", href: "/profile" },
    { label: "Buat Post Baru", href: "/create-post" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-[#f0f8f1] to-[#d9f0e0] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#1e293b] text-base-content flex flex-col flex items-center">
      {/* Fixed Top Header - Logo + Search + Profile */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-out ${
          isTopHeaderVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="navbar px-5 py-4">
          {/* Logo */}
          <div className="flex-1">
            <img
              src="./pwa-64x64.png"
              alt="Nebeng"
              className="w-11 h-11 object-cover mb-2"
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Search button */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-50 bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95 relative"
              aria-label="Search"
            >
              <Search size={20} className="text-[#4e73df]" />
              {searchQuery && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white" />
              )}
            </button>

            {/* User profile dropdown */}
            {isLoaded ? (
              user ? (
                <div className="dropdown dropdown-end">
                  <label
                    tabIndex={0}
                    className="btn btn-ghost btn-circle avatar"
                  >
                    <div className="w-11 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img
                        src={user.imageUrl}
                        alt={user.fullName || "User"}
                        className="object-cover"
                      />
                    </div>
                  </label>

                  <div
                    tabIndex={0}
                    className="dropdown-content mt-4 z-[1] w-72 rounded-2xl shadow-xl border border-base-300 bg-base-100/95 backdrop-blur-md overflow-hidden"
                  >
                    <div className="absolute -top-2 right-4 w-4 h-4 bg-base-100/95 backdrop-blur-md border-t border-l border-base-300 rotate-45" />
                    <Profile />
                  </div>
                </div>
              ) : null
            ) : (
              <div className="skeleton w-11 h-11 rounded-full" />
            )}
          </div>
        </div>
      </header>

      {/* Spacer untuk fixed header */}

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Cari kota, barang & postingan..."
      >
        <div className="flex-1 overflow-y-auto px-1 py-3 space-y-3 max-h-[60vh]">
          {/* Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-white p-1.5 shadow-sm">
              {tabOptions.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    rounded-full px-4 py-2 text-[11px] font-semibold transition-all duration-300 capitalize
                    ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-[#4e73df] to-[#6c8ef8] text-white shadow-md"
                        : "text-slate-400 hover:text-[#4e73df] hover:bg-slate-50"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Armada */}
          <div className="space-y-2 rounded-[24px] border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {[
                { id: "all", label: "Semua", icon: null },
                { id: "motor", label: "Motor", icon: Bike },
                { id: "mobil", label: "Mobil", icon: Car },
                { id: "bus", label: "Bus", icon: Bus },
                { id: "kereta", label: "Kereta", icon: Train },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setArmadaFilter(option.id)}
                    className={`
                      rounded-full px-4 py-2 text-[11px] font-semibold transition-all duration-300
                      whitespace-nowrap flex-shrink-0 flex items-center gap-2
                      ${
                        armadaFilter === option.id
                          ? "bg-[#4e73df] text-white shadow-sm"
                          : "bg-white text-slate-400 border border-slate-100 hover:text-[#4e73df]"
                      }
                    `}
                  >
                    {Icon && <Icon size={14} />}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Tanggal */}
          <div className="space-y-2 rounded-[24px] border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {[
                { id: "all", label: "Semua Tanggal" },
                { id: "today", label: "Hari Ini" },
                { id: "tomorrow", label: "Besok" },
                { id: "thisWeek", label: "Minggu Ini" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setDateFilterMode(option.id);
                    setCustomDate("");
                  }}
                  className={`
                    rounded-full px-4 py-2 text-[11px] font-semibold transition-all duration-300
                    whitespace-nowrap flex-shrink-0
                    ${
                      dateFilterMode === option.id
                        ? "bg-[#4e73df] text-white shadow-sm"
                        : "bg-white text-slate-400 border border-slate-100 hover:text-[#4e73df]"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilterMode("custom");
                }}
                className="input input-sm flex-1 h-9 rounded-full border-slate-100 bg-white text-[11px] font-semibold text-slate-600 focus:outline-none focus:border-[#4e73df]"
              />
            </div>
          </div>

          {/* Fee Slider */}
          <div className="space-y-2.5 rounded-[24px] border border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>Ongkos Fee</span>
              <span className="text-[#4e73df]">
                Rp {feeRange[1].toLocaleString()}
              </span>
            </div>
            <div className="px-1 py-1">
              <Slider
                range
                min={MIN}
                max={MAX}
                step={STEP}
                value={feeRange}
                onChange={setFeeRange}
                allowCross={false}
              />
            </div>
          </div>

          <button
            onClick={() => setIsSearchModalOpen(false)}
            className="w-full h-12 rounded-2xl bg-[#4e73df] text-white text-[14px] font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform mt-2"
          >
            Terapkan Filter
          </button>
        </div>
      </SearchModal>

      <main className="h-screen w-full overflow-hidden bg-black">
        {/* Content */}
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingLogo size="w-16 h-16" className="text-white" />
          </div>
        ) : filteredPosts.length > 0 ? (
          <Swiper
            direction="vertical"
            slidesPerView={1}
            spaceBetween={0}
            mousewheel={{ forceToAxis: true }}
            keyboard={true}
            pagination={{ clickable: true }}
            modules={[Pagination, Mousewheel, Keyboard]}
            className="h-full w-full"
            speed={600}
            allowTouchMove={true}
          >
            {filteredPosts.map((post) => (
              <SwiperSlide key={post.id}>
                <PostCard post={post} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-xl text-white/60">
              {searchQuery ? "Tidak ada post yang cocok" : "Belum ada posts"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
