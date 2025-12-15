import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/clerk-react'

export const createSupabaseClient = (getToken) => {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken({ template: 'supabase' })

          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: clerkToken
                ? `Bearer ${clerkToken}`
                : undefined,
            },
          })
        },
      },
    }
  )
}
