import { createClient } from '@supabase/supabase-js'

// These will be replaced with your actual Supabase credentials
// Don't worry - these are meant to be public (they're client-side keys)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
