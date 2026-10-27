import { supabase } from './supabase.ts'

const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL

if (!FUNCTIONS_URL) {
  throw new Error('VITE_FUNCTIONS_URL is not set. Add it to admin/.env and restart `npm run dev`.')
}

// Full URL of an edge function, e.g. functionUrl('clients')
const functionUrl = (functionName: string) => `${FUNCTIONS_URL}/${functionName}`

// GET an edge function and parse its JSON body. Non-2xx responses become errors,
// so TanStack Query puts them into `error` instead of `data`.
export async function getJson<T>(functionName: string, signal?: AbortSignal): Promise<T> {
  // getSession() returns the saved session and, if its access token has already
  // expired, refreshes it first, so the token sent here is always current.
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const response = await fetch(functionUrl(functionName), {
    signal,
    // The edge functions check this token to see who is asking (admins only).
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`${functionName}: HTTP ${response.status} ${text}`.trim())
  }
  return response.json() as Promise<T>
}
