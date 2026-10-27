import { useCallback, useSyncExternalStore } from 'react'
import { navigate, subscribeToUrl } from './hashRoute.ts'

// The open chat lives in the URL hash ("#/chat/2"), so a page reload keeps it,
// the link can be shared, and the browser Back button closes / switches chats.

const HASH_PATTERN = /^#\/chat\/(\d+)$/

function readClientId(): number | null {
  const match = HASH_PATTERN.exec(window.location.hash)
  return match ? Number(match[1]) : null
}

export function useSelectedChat() {
  const clientId = useSyncExternalStore(subscribeToUrl, readClientId)

  const setClientId = useCallback((id: number | null) => {
    if (id === readClientId()) return
    navigate(id === null ? null : `#/chat/${id}`)
  }, [])

  return [clientId, setClientId] as const
}
