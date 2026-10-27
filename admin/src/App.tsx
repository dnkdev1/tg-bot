import { useEffect } from 'react'
import { useRealtimeFeed } from './api/realtime.ts'
import { AppLayout } from './components/AppLayout/AppLayout.tsx'
import { ChatWindow } from './components/ChatWindow/ChatWindow.tsx'
import { LoginPage } from './components/LoginPage/LoginPage.tsx'
import { Sidebar } from './components/Sidebar/Sidebar.tsx'
import { useIsLoginRoute } from './lib/useIsLoginRoute.ts'
import { useSelectedChat } from './lib/useSelectedChat.ts'
import { useTheme } from './lib/useTheme.ts'

function App() {
  // Which chat is open, stored in the URL hash (#/chat/2). Both columns need it.
  const [selectedClientId, setSelectedClientId] = useSelectedChat()
  // Mounted here (not only in the side menu) so the panel follows OS light/dark
  // changes even while the menu is closed.
  useTheme()
  // One WebSocket subscription for the whole app; pushes new clients/messages into the cache.
  const feedStatus = useRealtimeFeed()
  const isLoginRoute = useIsLoginRoute()

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

  // #/login replaces the whole panel. The hooks above still run, so the live feed
  // keeps the cache fresh and the chats are up to date right after login.
  if (isLoginRoute) return <LoginPage />

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
