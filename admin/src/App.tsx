import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from './api/auth.ts'
import { useRealtimeFeed } from './api/realtime.ts'
import { AppLayout } from './components/AppLayout/AppLayout.tsx'
import { ChatWindow } from './components/ChatWindow/ChatWindow.tsx'
import { LoginPage } from './components/LoginPage/LoginPage.tsx'
import { Sidebar } from './components/Sidebar/Sidebar.tsx'
import { leaveLogin, redirectToLogin } from './lib/hashRoute.ts'
import { useIsLoginRoute } from './lib/useIsLoginRoute.ts'
import { useSelectedChat } from './lib/useSelectedChat.ts'
import { useTheme } from './lib/useTheme.ts'

// Login gate: the chats exist only for a logged-in user. Logged out, the URL
// becomes #/login and only the form is rendered.
function App() {
  // Here (not in the panel) so the login form follows light/dark too.
  useTheme()
  const session = useSession()
  const isLoginRoute = useIsLoginRoute()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (session === null) {
      // Logged out (or signed out in another tab): forget every chat and message
      // loaded so far, so nothing stays in memory for the next person at this browser.
      queryClient.clear()
      redirectToLogin()
    } else if (session && isLoginRoute) {
      leaveLogin()
    }
  }, [session, isLoginRoute, queryClient])

  // Still reading the saved session (a few ms): render nothing rather than flash
  // the login form at a user who is already logged in.
  if (session === undefined) return null
  // Rendered right away, even before the effect above has changed the URL.
  if (session === null) return <LoginPage />
  // Logged in on #/login: the effect is about to leave it.
  if (isLoginRoute) return null

  return <AdminPanel />
}

// Everything behind the login. Mounted only with a session, so the chat queries
// and the WebSocket start after login and stop (unmount) on sign-out.
function AdminPanel() {
  // Which chat is open, stored in the URL hash (#/chat/2). Both columns need it.
  const [selectedClientId, setSelectedClientId] = useSelectedChat()
  // One WebSocket subscription for the whole panel; pushes new clients/messages into the cache.
  const feedStatus = useRealtimeFeed()

  // Esc closes the open chat, like Telegram. Inside the search field Esc is left
  // to the browser (it clears the field); when the side menu is open, the menu
  // handles Esc first and marks it with preventDefault().
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      if (event.target instanceof HTMLInputElement) return
      setSelectedClientId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setSelectedClientId])

  return (
    <AppLayout
      mainActive={selectedClientId !== null}
      sidebar={
        <Sidebar
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
          feedStatus={feedStatus}
        />
      }
      main={<ChatWindow clientId={selectedClientId} onClose={() => setSelectedClientId(null)} />}
    />
  )
}

export default App
