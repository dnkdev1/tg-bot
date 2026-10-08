import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
// ?url: Vite bundles the font file and gives back its final URL (served by us, no CDN)
import flagsFontUrl from 'country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url'
import './index.css'
import App from './App.tsx'

// Windows has no flag emoji: 🇪🇺 would render as the letters "EU". On such browsers
// this registers the "Twemoji Country Flags" font (flags only), used first in
// index.css; elsewhere it does nothing.
polyfillCountryFlagEmojis('Twemoji Country Flags', flagsFontUrl)

// One shared cache for every query in the app (clients list, messages).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000, // data counts as fresh for 5s, so no refetch on every re-mount
      // New rows arrive instantly over the WebSocket (src/api/realtime.ts). This slow
      // full refetch is only a safety net for anything the socket missed (and for
      // deletes, which are not broadcast). Paused while the tab is in the background.
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
