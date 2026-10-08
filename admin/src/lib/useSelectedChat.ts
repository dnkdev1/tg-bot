import { useCallback, useSyncExternalStore } from 'react'

// The open chat lives in the URL hash ("#/chat/2"), so a page reload keeps it,
// the link can be shared, and the browser Back button closes / switches chats.
// A hash (not a path) is used because the panel is hosted as static files in a
// Storage bucket, which cannot rewrite /chat/2 to index.html.

const HASH_PATTERN = /^#\/chat\/(\d+)$/

function readClientId(): number | null {
  const match = HASH_PATTERN.exec(window.location.hash)
  return match ? Number(match[1]) : null
}

function subscribe(onChange: () => void) {
  // hashchange: Back/Forward and typing in the address bar; popstate: our own pushState below
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
  }
}

export function useSelectedChat() {
  const clientId = useSyncExternalStore(subscribe, readClientId)

  const setClientId = useCallback((id: number | null) => {
    if (id === readClientId()) return
    // pushState keeps a history entry (Back works) and, unlike `location.hash = ''`,
    // leaves no dangling "#" in the URL when the chat is closed.
    const url = id === null ? window.location.pathname + window.location.search : `#/chat/${id}`
    window.history.pushState(null, '', url)
    // pushState fires no event by itself; tell the subscribers
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])

  return [clientId, setClientId] as const
}
