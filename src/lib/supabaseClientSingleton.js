import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseClient = null

export const getSupabaseClient = (accessToken = null) => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  // Update auth token jika ada
  if (accessToken) {
    supabaseClient.auth.setSession({ access_token: accessToken })
  }

  return supabaseClient
}