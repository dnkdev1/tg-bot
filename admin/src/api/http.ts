const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL

if (!FUNCTIONS_URL) {
  throw new Error('VITE_FUNCTIONS_URL is not set. Add it to admin/.env and restart `npm run dev`.')
}

// Full URL of an edge function, e.g. functionUrl('clients')
export const functionUrl = (functionName: string) => `${FUNCTIONS_URL}/${functionName}`

// GET an edge function and parse its JSON body. Non-2xx responses become errors,
// so TanStack Query puts them into `error` instead of `data`.
export async function getJson<T>(functionName: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(functionUrl(functionName), { signal })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`${functionName}: HTTP ${response.status} ${text}`.trim())
  }
  return response.json() as Promise<T>
}
