import { useEffect, useRef } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { functionUrl } from '../../api/http.ts'
import { useClients, useMessageCount } from '../../api/queries.ts'
import { useTheme } from '../../lib/useTheme.ts'
import styles from './SideMenu.module.css'

interface SideMenuProps {
  onClose: () => void
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// Drawer opened by the ☰ button. Rendered only while open.
export function SideMenu({ onClose }: SideMenuProps) {
  const queryClient = useQueryClient()
  const isFetching = useIsFetching() > 0
  const clients = useClients()
  const messageCount = useMessageCount()
  const { theme, followsSystem, toggleTheme } = useTheme()
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // focus the drawer so keyboard users land inside it
    drawerRef.current?.focus()

    // Esc closes the menu. Registered in the capture phase so it runs before App's
    // Esc handler, and preventDefault() tells App not to also close the open chat.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [onClose])

  const stats =
    clients.data && messageCount.data !== undefined
      ? `${plural(clients.data.length, 'chat')} · ${plural(messageCount.data, 'message')}`
      : 'Loading…'

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div className={styles.drawer} ref={drawerRef} role="dialog" aria-modal="true" aria-label="Main menu" tabIndex={-1}>
        <div className={styles.header}>
          <div className={styles.logo} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.9 4.3 18.6 19.9c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.2-8.3c.4-.4-.1-.6-.6-.2L6 13.4 1.1 11.9C0 11.6 0 10.8 1.3 10.3L20.5 2.9c.9-.3 1.7.2 1.4 1.4z" />
            </svg>
          </div>
          <div className={styles.title}>TG Bot Admin</div>
          <div className={styles.stats}>{stats}</div>
        </div>

        <nav className={styles.items}>
          {/* invalidate = mark cached data as old and refetch it now */}
          <button
            type="button"
            className={styles.item}
            disabled={isFetching}
            onClick={() => queryClient.invalidateQueries()}
          >
            <svg className={`${styles.icon} ${isFetching ? styles.spinning : ''}`} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-2.6-6.4" />
              <path d="M21 3v6h-6" />
            </svg>
            {isFetching ? 'Refreshing…' : 'Refresh data'}
          </button>

          {/* stays open after toggling, so the switch animation is visible */}
          <button
            type="button"
            className={styles.item}
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={toggleTheme}
          >
            <svg className={styles.icon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
            Night mode
            {followsSystem && <span className={styles.hint}>auto</span>}
            <span className={`${styles.switch} ${theme === 'dark' ? styles.switchOn : ''}`} aria-hidden="true" />
          </button>

          <a className={styles.item} href={functionUrl('clients')} target="_blank" rel="noreferrer" onClick={onClose}>
            <JsonIcon />
            Clients JSON
            <span className={styles.hint}>/clients ↗</span>
          </a>

          <a className={styles.item} href={functionUrl('messages')} target="_blank" rel="noreferrer" onClick={onClose}>
            <JsonIcon />
            Messages JSON
            <span className={styles.hint}>/messages ↗</span>
          </a>
        </nav>
      </div>
    </>
  )
}

function JsonIcon() {
  return (
    <svg className={styles.icon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
      <path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
    </svg>
  )
}
