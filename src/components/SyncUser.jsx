import { useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { supabase, setSupabaseAuth } from '../lib/supabaseClient'  // Import singleton

export default function SyncUser() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()  // getToken tanpa parameter

  useEffect(() => {
    if (!isLoaded || !user) return

    const sync = async () => {
      try {
        const clerkToken = await getToken()  // Token standar Clerk
        setSupabaseAuth(clerkToken)  // Set token ke Supabase client

        const { error } = await supabase
          .from('users')
          .upsert({
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName,
            avatar_url: user.imageUrl,
          }, { onConflict: 'clerk_id' })

        if (error) console.error('❌ Sync user gagal:', error)
        else console.log('✅ User tersimpan di Supabase')
      } catch (err) {
        console.error('Error getting token:', err)
      }
    }

    sync()
  }, [isLoaded, user, getToken])

  return null
}