import { useCallback, useState } from 'react'
import type { FeedStatus } from '../../api/realtime.ts'
import { ChatList } from '../ChatList/ChatList.tsx'
import { SideMenu } from '../SideMenu/SideMenu.tsx'
import { UserBar } from '../UserBar/UserBar.tsx'
import styles from './Sidebar.module.css'

interface SidebarProps {
  selectedClientId: number | null
  onSelectClient: (clientId: number) => void
  feedStatus: FeedStatus
}

// Shown under the header while the live feed is not connected, like Telegram's
// "Connecting…" / "Waiting for network…". Nothing is shown while live.
const FEED_STATUS_TEXT: Record<FeedStatus, string | null> = {
  connecting: 'Connecting…',
  offline: 'Waiting for network…',
  live: null,
}

// Left column: signed-in user, menu button, search field and the chat list.
export function Sidebar({ selectedClientId, onSelectClient, feedStatus }: SidebarProps) {
  const statusText = FEED_STATUS_TEXT[feedStatus]
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  // stable function: SideMenu's keyboard effect depends on it
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <div className={styles.sidebar}>
      <UserBar />

      <div className={styles.header}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
          </svg>
        </button>

        <label className={styles.search}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </label>
      </div>

      {statusText && (
        <div className={styles.feedStatus} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          {statusText}
        </div>
      )}

      <nav className={styles.list} aria-label="Chats">
        <ChatList search={search} selectedClientId={selectedClientId} onSelect={onSelectClient} />
      </nav>

      {menuOpen && <SideMenu onClose={closeMenu} />}
    </div>
  )
}
