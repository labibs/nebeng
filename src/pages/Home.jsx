import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useClerk } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient'
import PostCard from '../components/PostCard'
import PostCardSkeleton from '../components/PostCardSkeleton'

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
  const [isTopHeaderVisible, setIsTopHeaderVisible] = useState(true)

  // Scroll handler untuk top header
  useEffect(() => {
    let lastScrollY = window.scrollY
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsTopHeaderVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setIsTopHeaderVisible(true)
      }
      
      lastScrollY = currentScrollY
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  // Filter posts berdasarkan tab dan search
  const filteredPosts = posts.filter(post => {
    // Filter by tab
    if (activeTab !== 'semua') {
      const targetType = activeTab === 'titip' ? 'titip' : 'bawa'
      if (post.type !== targetType) return false
    }
    
    // Filter by search query
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const searchFields = [
      post.from_city,
      post.to_city,
      post.item_description,
      post.description
    ]
    
    return searchFields.some(field => 
      field?.toLowerCase().includes(query)
    )
  })

  // Search handlers
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setSearchOpen(false)
    }
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
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
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          isTopHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        
        <div className="bg-base-100/80 backdrop-blur-md border-b border-base-300 shadow-lg">
          <div className="navbar px-5 py-4">
            {/* Logo */}
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Nebeng
              </h1>
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
                    <ul 
                      tabIndex={0} 
                      className="menu menu-sm dropdown-content mt-4 z-[1] p-3 shadow-xl bg-base-100/95 backdrop-blur-md rounded-2xl w-56 border border-base-300"
                    >
                      <li className="menu-title px-3 py-2">
                        <span className="font-semibold">
                          {user.fullName || user.username || 'User'}
                        </span>
                      </li>
                      <div className="divider my-1" />
                      
                      {userMenuItems.map((item) => (
                        <li key={item.label}>
                          <a 
                            href={item.href} 
                            className="py-3 hover:bg-base-200 rounded-lg"
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                      
                      <li>
                        <button 
                          onClick={() => signOut()} 
                          className="py-3 text-error hover:bg-error/10 rounded-lg"
                        >
                          Keluar
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : null
              ) : (
                <div className="skeleton w-11 h-11 rounded-full" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer untuk fixed header */}
      <div className="h-15" />

      {/* Sticky Tab Section - Scrolls with content */}
      <section className="sticky top-n4 z-30 bg-base-100/80 backdrop-transparent border-none shadow-sm">
        <div className="px-6 pb-1 pt-4">
          <div className="flex justify-center">
            <div className="bg-base-200/60 backdrop-blur-sm rounded-full p-1 shadow-inner inline-flex">
              {tabOptions.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-2 rounded-full text-xs font-medium transition-all duration-200 capitalize
                    ${activeTab === tab.id
                      ? 'bg-white text-primary shadow-md'
                      : 'text-base-content/60 hover:text-base-content'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-xl">
            <div className="bg-base-100/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-base-300">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <svg 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-base-content/50" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    className="input input-lg w-full pl-12 bg-base-200/50 focus:bg-base-200 focus:outline-none"
                    placeholder="Cari kota, barang, atau deskripsi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    autoFocus
                  />
                </div>
                <button
                  onClick={closeSearch}
                  className="btn btn-ghost btn-circle btn-lg"
                  aria-label="Close search"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pt-4 pb-32 px-4 max-w-2xl mx-auto">
  {loading ? (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  ) : filteredPosts.length > 0 ? (
    <div className="space-y-6">
      {filteredPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  ) : (
    <div className="text-center py-16">
      <p className="text-xl text-base-content/60">
        {searchQuery ? 'Tidak ada post yang cocok' : 'Belum ada posts'}
      </p>
    </div>
  )}
</main>
    </div>
  )
}