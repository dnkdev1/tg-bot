import { useSyncExternalStore } from 'react'
import { LOGIN_HASH, subscribeToUrl } from './hashRoute.ts'

// true while the URL is #/login: App shows the login page instead of the chats.
export function useIsLoginRoute() {
  return useSyncExternalStore(subscribeToUrl, () => window.location.hash === LOGIN_HASH)
}
