import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not set. Add them to admin/.env and restart `npm run dev`.',
  )
}

// Used for Realtime (the WebSocket live feed) and for login (email + password).
// Chat data is still loaded through the edge functions.
export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true, // keep the session in localStorage, so a reload stays logged in
    autoRefreshToken: true, // get a new access token shortly before the old one expires
    // Password login never puts tokens in the URL. Off, so the client does not try
    // to parse our own hash routes (#/chat/2, #/login) as an OAuth redirect.
    detectSessionInUrl: false,
  },
})
