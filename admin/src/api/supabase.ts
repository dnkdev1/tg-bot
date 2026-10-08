import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not set. Add them to admin/.env and restart `npm run dev`.',
  )
}

// Used only for Realtime (the WebSocket live feed); data is still loaded through
// the edge functions. No user login, so nothing to persist or refresh.
export const supabase = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
