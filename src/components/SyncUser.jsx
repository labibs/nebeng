import { useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { apiFetch } from '../lib/apiClient'

export default function SyncUser() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded || !user) return

    const syncUser = async () => {
      try {
        await apiFetch('/api/users/sync', {
          method: 'POST',
          body: JSON.stringify({
            name: user.fullName ||
              user.username ||
              user.primaryEmailAddress?.emailAddress.split('@')[0] ||
              'User',
            avatar_url: user.imageUrl,
          }),
        })
      } catch (err) {
        console.warn('SyncUser error:', err.message)
      }
    }

    syncUser()
  }, [isLoaded, user])

  return null
}
