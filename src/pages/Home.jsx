import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import PostCard from '../components/PostCard'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('semua') // 'semua', 'titip', 'bawa'
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch posts dari Supabase
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        setPosts([])
      } else {
        setPosts(data || [])
      }
      setLoading(false)
    }

    fetchPosts()

    // Real-time subscription
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => fetchPosts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filter posts berdasarkan tab & search
  const filteredPosts = posts
    .filter((post) => {
      if (activeTab === 'titip') return post.type === 'titip'
      if (activeTab === 'bawa') return post.type === 'bawa'
      return true
    })
    .filter((post) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        post.from_city?.toLowerCase().includes(query) ||
        post.to_city?.toLowerCase().includes(query) ||
        post.item_description?.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query)
      )
    })

  return (
    <div className="min-h-screen bg-base-200">
      {/* AppBar */}
      <div className="sticky top-0 z-40 bg-base-100 shadow-lg">
        <div className="navbar px-4 py-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">Nebeng.in</h1>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="btn btn-ghost btn-circle"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        {/* Tab Filter */}
        <div className="tabs tabs-boxed justify-center gap-2 px-4 pb-3">
          <a
            onClick={() => setActiveTab('semua')}
            className={`tab tab-lg ${activeTab === 'semua' ? 'tab-active' : ''}`}
          >
            Semua
          </a>
          <a
            onClick={() => setActiveTab('titip')}
            className={`tab tab-lg ${activeTab === 'titip' ? 'tab-active' : ''}`}
          >
            Mau Titip
          </a>
          <a
            onClick={() => setActiveTab('bawa')}
            className={`tab tab-lg ${activeTab === 'bawa' ? 'tab-active' : ''}`}
          >
            Bisa Bawa
          </a>
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl p-5">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Cari kota, barang, atau deskripsi..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery('')
                }}
                className="btn btn-ghost"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Content */}
      <div className="pt-4 pb-32 px-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-4">
                    <div className="skeleton w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <div className="skeleton h-4 w-32 mb-2" />
                      <div className="skeleton h-3 w-20" />
                    </div>
                  </div>
                  <div className="skeleton h-32 w-full mt-6 rounded-xl" />
                  <div className="skeleton h-20 w-full mt-4" />
                </div>
              </div>
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
            <div className="text-6xl mb-4">😔</div>
            <p className="text-xl text-base-content/60 mb-6">
              Tidak ada post yang cocok dengan filter
            </p>
            <button
              onClick={() => {
                setActiveTab('semua')
                setSearchQuery('')
              }}
              className="btn btn-primary"
            >
              Reset Filter & Cari Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  )
}