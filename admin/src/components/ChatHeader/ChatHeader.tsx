import type { Client } from '../../api/types.ts'
import { clientDisplayName, formatLastSeen } from '../../lib/format.ts'
import { Avatar } from '../Avatar/Avatar.tsx'
import styles from './ChatHeader.module.css'

interface ChatHeaderProps {
  client: Client
  messageCount: number
  lastActivity: Date | null
  onBack: () => void
}

// Top bar of the open chat: (← on phones) avatar, name, "N messages · last message … at …"
export function ChatHeader({ client, messageCount, lastActivity, onBack }: ChatHeaderProps) {
  const parts = [`${messageCount} ${messageCount === 1 ? 'message' : 'messages'}`]
  if (lastActivity) parts.push(formatLastSeen(lastActivity))

  return (
    <header className={styles.header}>
      {/* only visible on narrow screens (CSS); on desktop the list is always beside the chat */}
      <button type="button" className={styles.back} onClick={onBack} aria-label="Back to chats">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <Avatar client={client} size={42} />
      <div className={styles.info}>
        <div className={styles.title}>{clientDisplayName(client)}</div>
        <div className={styles.subtitle}>{parts.join(' · ')}</div>
      </div>
    </header>
  )
}
