import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { initApiClient } from '../lib/apiClient'

export default function ApiClientInit() {
  const { user } = useUser()

  useEffect(() => {
    initApiClient({
      getUserId: () => user?.id || null,
    })
  }, [user])

  return null
}
