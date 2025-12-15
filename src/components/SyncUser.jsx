import { useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { createSupabaseClient } from '../lib/supabaseClient'

export default function SyncUser() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()

  const supabase = createSupabaseClient(getToken)

  useEffect(() => {
    if (!isLoaded || !user) return

    const sync = async () => {
      const { error } = await supabase
        .from('users')
        .upsert(
          {
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName,
            avatar_url: user.imageUrl,
          },
          { onConflict: 'clerk_id' }
        )

      if (error) {
        console.error('❌ Sync user gagal:', error)
      } else {
        console.log('✅ User tersimpan di Supabase')
      }
    }

    sync()
  }, [isLoaded, user])

  return null
}
