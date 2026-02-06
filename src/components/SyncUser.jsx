import { useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SyncUser() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded || !user) return

    const checkUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single()

      if (error) {
        console.warn('User belum ada di Supabase (akan dibuat via webhook)')
      }
    }

    checkUser()

  }, [isLoaded, user])


  return null
}
