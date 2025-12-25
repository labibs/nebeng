import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useClerk } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient'
import PostCard from '../components/PostCard'
import PostCardSkeleton from '../components/PostCardSkeleton'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Mousewheel, Keyboard } from 'swiper/modules';
import { Bike, Car, Bus, Train, Plane } from 'lucide-react'
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

// Import CSS Swiper
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import Profile from './Profile'

export default function Home() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  // State management
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('semua')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSyncingUser, setIsSyncingUser] = useState(false)
  const [feeRange, setFeeRange] = useState([0, 500000]) // default: 0 - 500rb
  const [isTopHeaderVisible, setIsTopHeaderVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const prevScrollY = useRef(0);
  const touchStartY = useRef(0);
  const [dateFilterMode, setDateFilterMode] = useState('all') // 'all', 'today', 'tomorrow', 'thisWeek', 'thisMonth', 'custom'
  const [customDate, setCustomDate] = useState('') // format YYYY-MM-DD
  const [armadaFilter, setArmadaFilter] = useState('all')

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Selalu tampilkan kalau sudah di paling atas
      if (currentScrollY <= 10) { // 10px tolerance
        setIsTopHeaderVisible(true);
        prevScrollY.current = currentScrollY;
        return;
      }

      // Hide kalau scroll down, show kalau scroll up
      if (currentScrollY > prevScrollY.current + 10) { // threshold 10px biar tidak terlalu sensitif
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (
            name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Sync user data dengan Supabase
  useEffect(() => {
    if (!user || isSyncingUser) return

    const syncUserToSupabase = async () => {
      setIsSyncingUser(true)

      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single()

        const userData = {
          clerk_id: user.id,
          name: user.fullName || 
                user.username || 
                user.primaryEmailAddress?.emailAddress.split('@')[0] || 
                'User',
          avatar_url: user.imageUrl,
        }

        if (!existingUser) {
          await supabase.from('users').insert(userData)
        } else {
          await supabase.from('users').update(userData).eq('clerk_id', user.id)
        }
      } catch (error) {
      console.error(error)
    } finally {
      setIsSyncingUser(false)
    }
  }

  syncUserToSupabase()
}, [user])  // ← Tetap hanya [user], karena isSyncingUser cuma guard

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchPosts()
    
    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' }, 
        fetchPosts
      )
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [fetchPosts])

  const filteredPosts = posts.filter(post => {

    // Tab filter
    if (activeTab !== 'semua') {
      const target = activeTab === 'titip' ? 'titip' : 'bawa'
      if (post.type !== target) return false
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const fields = [
        post.from_city,
        post.to_city,
        post.item_description,
        post.description
      ]

      if (!fields.some(f => f?.toLowerCase().includes(q))) return false
    }

    // Fee filter
    if (post.fee < feeRange[0] || post.fee > feeRange[1]) return false

    // Armada filter
    if (armadaFilter !== 'all' && post.armada !== armadaFilter) return false

    // Date filter
    if (!post.travel_date) return false

    const postDate = new Date(post.travel_date)
    if (isNaN(postDate)) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    switch (dateFilterMode) {
      case 'today':
        return postDate.toDateString() === today.toDateString()
      case 'tomorrow':
        return postDate.toDateString() === tomorrow.toDateString()
      case 'thisWeek':
        return postDate >= startOfWeek && postDate <= endOfWeek
      case 'custom':
        return customDate
          ? postDate.toDateString() === new Date(customDate).toDateString()
          : true
      default:
        return true
    }
  })

  const MIN = 0
  const MAX = 1000000
  const STEP = 10000

  const clamp = (v) => Math.min(MAX, Math.max(MIN, v))

  // Search handlers
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Biar tidak submit form atau trigger lain
      setSearchOpen(false); // Enter = terapkan filter & tutup modal
    }
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setActiveTab('semua')
    setFeeRange([0, 500000]) // atau [0, 1000000] sesuai default awal kamu
    setDateFilterMode('all')
    setCustomDate('')
    setArmadaFilter('all')
  }

  // Tab options
  const tabOptions = [
    { id: 'semua', label: 'Semua' },
    { id: 'titip', label: 'Mau Titip' },
    { id: 'bawa', label: 'Bisa Bawa' }
  ]

  // User menu items
  const userMenuItems = [
    { label: 'Profil Saya', href: '/profile' },
    { label: 'Buat Post Baru', href: '/create-post' }
  ]

  return (
    <div className="min-h-screen bg-base-200">
      {/* Fixed Top Header - Logo + Search + Profile */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-out ${
    isTopHeaderVisible ? 'translate-y-0' : '-translate-y-full'
  }`}
      >
        
          <div className="navbar px-5 py-4">
            {/* Logo */}
            <div className="flex-1">
              <h3 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-lg">
        Nebeng
      </h3>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="btn btn-ghost btn-circle"
                aria-label="Search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* User profile dropdown */}
              {isLoaded ? (
                user ? (
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                      <div className="w-11 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <img
                          src={user.imageUrl}
                          alt={user.fullName || 'User'}
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
      
{/* Search Modal */}
{/* Search Modal */}
{searchOpen && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col">
    {/* Header + Input + Tabs + Filter */}
    <div className="px-4 pt-6 pb-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-base-100/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-base-300 overflow-hidden">
          {/* Input Search */}
          <div className="p-6">
            <div className="flex items-center gap-1">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-base-content/70 pointer-events-none z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0  "
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                <input
                  type="text"
                  placeholder="Cari kota, barang & postingan..."
                  className="
                    input input-md w-full pl-14 pr-2 
                    bg-base-200/60 focus:bg-base-200/80 
                    focus:outline-none border-0 
                    transition-all duration-200
                    placeholder:text-base-content/50
                  "
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                />
              </div>

              <button
                onClick={closeSearch}
                className="btn btn-ghost btn-circle btn-lg"
                aria-label="Tutup pencarian"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0  16">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs + Filter Fee - Sticky di dalam card */}
          <div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-xl border-t border-base-300 px-3 py-4">
            {/* Tabs */}
            <div className="flex justify-center mb-5">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-2 py-2 shadow-xl">
                {tabOptions.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-6 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 capitalize
                      ${activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-md'
                        : 'text-gray-300 hover:text-black hover:bg-white/10'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

       {/* Filter Armada */}
<div className="space-y-2 px-2 pb-0 pt-0">
  {/* <p className="text-sm font-medium text-base-content/80 text-center">
    Armada
  </p> */}

  {/* Pill dengan Icon - Horizontal Scrollable */}
  <div className="flex justify-center mb-5">
    <div className="
      inline-flex items-center gap-2 
      px-2 py-2 
      bg-white/10 backdrop-blur-md 
      border border-white/20 
      rounded-full 
      shadow-xl
      overflow-x-auto scrollbar-hide
      min-w-full
    ">
      {[
        { id: 'all', label: 'Semua Armada', icon: null },
        { id: 'motor', label: 'Motor', icon: Bike },
        { id: 'mobil', label: 'Mobil', icon: Car },
        { id: 'bus', label: 'Bus', icon: Bus },
        { id: 'kereta', label: 'Kereta', icon: Train },
      ].map((option) => {
        const Icon = option.icon
        return (
          <button
            key={option.id}
            onClick={() => setArmadaFilter(option.id)}
            className={`
              px-6 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 
              whitespace-nowrap flex-shrink-0 flex items-center gap-2
              ${armadaFilter === option.id
                ? 'bg-white text-gray-900 shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
              }
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {option.label}
          </button>
        )
      })}
    </div>
  </div>
</div>
     
            {/* Filter Tanggal Keberangkatan */}
<div className="space-y-2 px-2 pb-4 pt-0">
  {/* <p className="text-sm font-medium text-base-content/80 text-center">
    Tanggal Keberangkatan
  </p> */}

  {/* Container pill - lebar mengikuti konten utama, bukan full screen */}
  <div className="flex justify-center mb-5">
    <div className="
      inline-flex items-center gap-2
      px-2 py-2 
      bg-white/10 backdrop-blur-md 
      border border-white/20 
      rounded-full 
      shadow-xl
      overflow-x-auto scrollbar-hide
      min-w-full /* penting: agar tidak menyusut lebih kecil dari parent */
    ">
      {/* Pill Items - bisa scroll horizontal kalau tidak muat */}
      {[
        { id: 'all', label: 'Semua Tanggal' },
        { id: 'today', label: 'Hari Ini' },
        { id: 'tomorrow', label: 'Besok' },
        { id: 'thisWeek', label: 'Minggu Ini' },
        { 
          id: 'custom', 
          label: customDate 
            ? new Date(customDate).toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              }) 
            : 'Pilih Tanggal'
        },
      ].map((option) => (
        <button
          key={option.id}
          onClick={() => {
            if (option.id === 'custom') {
              setDateFilterMode('custom')
            } else {
              setDateFilterMode(option.id)
              if (option.id !== 'custom') setCustomDate('')
            }
          }}
          className={`
            px-6 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 
            whitespace-nowrap flex-shrink-0
            ${(dateFilterMode === option.id || (option.id === 'custom' && dateFilterMode === 'custom'))
              ? 'bg-white text-gray-900 shadow-lg'  /* aktif: putih penuh + shadow lebih tebal */
              : 'text-gray-300 hover:text-white hover:bg-white/10'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
  
  {/* Custom Date Picker */}
  <div className="flex items-center gap-3">
    <button
      onClick={() => setDateFilterMode('custom')}
      className={`
        flex-1 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all
        ${dateFilterMode === 'custom'
          ? 'bg-primary text-white shadow-md'
          : 'bg-base-200/60 text-base-content/70 hover:bg-base-200'
        }
      `}
    >{customDate ? 'Hari ' + new Date(customDate).toLocaleDateString('id-ID', { weekday: 'long' }) : 'Pilih Tanggal'}
      
    </button>

    {dateFilterMode === 'custom' && (
      <input
        type="date"
        value={customDate}
        onChange={(e) => setCustomDate(e.target.value)}
        className="input input-bordered input-md w-37 bg-base-200/60"
      />
    )}
  </div>
</div>

<div className="space-y-3 px-4">
  <div className="flex justify-between text-sm font-medium text-base-content/80">
    <span>Ongkos Fee</span>
    <span>
      Rp {feeRange[0].toLocaleString()} — Rp {feeRange[1].toLocaleString()}
    </span>
  </div>

  <div className="py-4 px-2">
    <Slider
      range
      min={MIN}
      max={MAX}
      step={STEP}
      value={feeRange}
      onChange={setFeeRange}
      allowCross={false}
      className="fee-slider bold"
    />

  </div>

  <div className="flex justify-between text-xs text-base-content/60">
    <span>Rp 0</span>
    <span>Rp 1.000.000+</span>
  </div>
</div>


          </div>
        </div>
      </div>
    </div>

    {/* Tombol Terapkan Pencarian - Fixed di Bawah */}
    <div className="px-4 pb-6">
      <div className="max-w-2xl mx-auto w-full">
        <button
          onClick={() => setSearchOpen(false)} // Langsung terapkan & tutup
          className="btn btn-primary btn-lg w-full rounded-2xl shadow-lg"
        >
          Terapkan Pencarian
        </button>
      </div>
    </div>

    {/* Area kosong di atas tombol untuk tap-to-close (opsional) */}
    {/* <div className="flex-1" onClick={closeSearch} /> */}
  </div>
)}
      <main className="h-screen w-full overflow-hidden bg-black">
  

  {/* Content */}
  {loading ? (
    <div className="flex h-full items-center justify-center">
      <span className="loading loading-spinner loading-lg text-white"></span>
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
        {searchQuery ? 'Tidak ada post yang cocok' : 'Belum ada posts'}
      </p>
    </div>
  )}
</main>
    </div>
  )
}