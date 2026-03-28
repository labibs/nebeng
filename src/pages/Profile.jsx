import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient'
import { LogOut } from 'lucide-react'

export default function Profile() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) return

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user.id)
        .single()

      if (!error) setProfile(data)
      setLoading(false)
    }

    fetchProfile()
  }, [isLoaded, user])

  if (loading) {
    return <div className="p-6 text-center">Loading profile...</div>
  }

  if (!profile) {
    return <div className="p-6 text-center">Profile tidak ditemukan</div>
  }

  return (
    // === WRAPPER UTAMA PROFILE (sekarang membatasi konten) ===
   <>
      {/* Arrow / Tail (segitiga kecil di atas kanan) */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-base-100/95 backdrop-blur-md border-t border-l border-base-300 rotate-45" />

      {/* Konten Profile yang asli */}
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={profile.avatar_url}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="text-sm font-semibold">{profile.name}</h2>
            <p className="text-xs text-base-content/60">{profile.email}</p>
          </div>
        </div>

        {/* Card info */}
        <div className="card bg-base-100 shadow-sm mb-4">
          <div className="card-body p-4">
            <p className="text-sm">
              <span className="font-medium">User ID</span><br />
              <span className="text-base-content/60">
  {profile.clerk_id.length > 15 
    ? `${profile.clerk_id.substring(0, 15)}...` 
    : profile.clerk_id
  }
</span>
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ redirectUrl: '/' })}
          className="btn btn-error btn-outline w-full flex items-center gap-2"
        >
          <LogOut size={8} />
          Logout
        </button>
      </div>
    </>
  )
}