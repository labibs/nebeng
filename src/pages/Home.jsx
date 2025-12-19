import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useClerk } from '@clerk/clerk-react' // untuk signOut
import { supabase } from '../lib/supabaseClient'
import PostCard from '../components/PostCard'

export default function Home() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('semua')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSyncingUser, setIsSyncingUser] = useState(false)

  // =========================
  // FETCH POSTS DENGAN JOIN USERS
  // =========================
  const fetchPosts = useCallback(async () => {
    setLoading(true)
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

    if (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }, [])

  // =========================
  // SYNC USER CLERK KE TABEL USERS
  // =========================
  useEffect(() => {
    if (!user || isSyncingUser) return

    const syncUserToSupabase = async () => {
      setIsSyncingUser(true)
      try {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single()

        const userData = {
          clerk_id: user.id,
          name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress.split('@')[0] || 'User',
          avatar_url: user.imageUrl,
        }

        if (checkError || !existingUser) {
          // Insert baru
          await supabase.from('users').insert(userData)
        } else {
          // Update kalau ada perubahan
          await supabase.from('users').update(userData).eq('clerk_id', user.id)
        }
      } catch (err) {
        console.error('Error syncing user to Supabase:', err)
      } finally {
        setIsSyncingUser(false)
      }
    }

    syncUserToSupabase()
  }, [user, isSyncingUser])

  // =========================
  // REALTIME SUBSCRIPTION
  // =========================
  useEffect(() => {
    fetchPosts() // initial load

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchPosts()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscribed')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('Realtime issue:', status)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPosts])

  // =========================
  // FILTER POSTS
  // =========================
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

  // =========================
  // RENDER
  // =========================
  return (
    <div className="min-h-screen bg-base-200">
      {/* AppBar */}
      <div className="sticky top-0 z-40 bg-base-100 shadow-lg">
        <div className="navbar px-4 py-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">Nebeng.id</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="btn btn-ghost btn-circle"
            >
              🔍
            </button>

            {/* Profil Dropdown */}
            {isLoaded && user ? (
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                  <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src={user.imageUrl} alt={user.fullName || 'User'} className="object-cover" />
                  </div>
                </label>
                <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                  <li className="menu-title">
                    <span>{user.fullName || user.username || 'User'}</span>
                  </li>
                  <li><a href="/profile">Profil Saya</a></li>
                  <li><a href="/create-post">Buat Post Baru</a></li>
                  <li>
                    <button onClick={() => signOut()}>Keluar</button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="skeleton w-10 h-10 rounded-full" />
            )}
          </div>
        </div>

        {/* Tabs Filter */}
        <div className="tabs tabs-boxed justify-center gap-2 px-4 pb-3">
          {['semua', 'titip', 'bawa'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab tab-lg ${activeTab === tab ? 'tab-active' : ''}`}
            >
              {tab === 'semua' ? 'Semua' : tab === 'titip' ? 'Mau Titip' : 'Bisa Bawa'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl p-5">
            <div className="flex items-center gap-3">
              <input
                type="text"
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

      {/* Feed Posts */}
      <div className="pt-4 pb-32 px-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-10">Loading posts...</div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-base-content/60">Tidak ada post yang cocok</p>
          </div>
        )}
      </div>
    </div>
  )
}