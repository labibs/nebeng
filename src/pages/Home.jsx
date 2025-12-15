import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { createSupabaseClient } from '../lib/supabaseClient'
import PostCard from '../components/PostCard'

export default function Home() {
  const { getToken } = useAuth()

  // Supabase client dengan Clerk JWT
  const supabase = useMemo(
    () => createSupabaseClient(getToken),
    [getToken]
  )

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('semua')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

    // Realtime subscription
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
  }, [supabase])

  // Filter posts
  const filteredPosts = posts
    .filter((post) => {
      if (activeTab === 'titip') return post.type === 'titip'
      if (activeTab === 'bawa') return post.type === 'bawa'
      return true
    })
    .filter((post) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        post.from_city?.toLowerCase().includes(q) ||
        post.to_city?.toLowerCase().includes(q) ||
        post.item_description?.toLowerCase().includes(q) ||
        post.description?.toLowerCase().includes(q)
      )
    })

  return (
    <div className="min-h-screen bg-base-200">
      {/* AppBar */}
      <div className="sticky top-0 z-40 bg-base-100 shadow-lg">
        <div className="navbar px-4 py-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">Nebeng.id</h1>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="btn btn-ghost btn-circle"
          >
            🔍
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed justify-center gap-2 px-4 pb-3">
          {['semua', 'titip', 'bawa'].map((tab) => (
            <a
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab tab-lg ${activeTab === tab ? 'tab-active' : ''}`}
            >
              {tab === 'semua'
                ? 'Semua'
                : tab === 'titip'
                ? 'Mau Titip'
                : 'Bisa Bawa'}
            </a>
          ))}
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl p-5">
            <div className="flex items-center gap-3">
              <input
                className="input input-bordered w-full"
                placeholder="Cari kota, barang, atau deskripsi..."
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

      {/* Feed */}
      <div className="pt-4 pb-32 px-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-6">Loading...</div>
        ) : filteredPosts.length ? (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-base-content/60">
              Tidak ada post yang cocok
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
