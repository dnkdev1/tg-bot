import type { Client, Message } from '../../api/types.ts'
import { clientDisplayName, formatChatListTime, isBotAuthor } from '../../lib/format.ts'
import { Avatar } from '../Avatar/Avatar.tsx'
import styles from './ChatListItem.module.css'

interface ChatListItemProps {
  client: Client
  lastMessage: Message | undefined
  lastActivity: Date | null
  isActive: boolean
  onSelect: (clientId: number) => void
}

// One row of the chat list: avatar | name + time / last message preview
export function ChatListItem({ client, lastMessage, lastActivity, isActive, onSelect }: ChatListItemProps) {
  const className = isActive ? `${styles.item} ${styles.active}` : styles.item

  return (
    <button
      type="button"
      className={className}
      onClick={() => onSelect(client.id)}
      aria-current={isActive ? 'true' : undefined}
    >
      <Avatar client={client} />

      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.name}>{clientDisplayName(client)}</span>
          {lastActivity && <span className={styles.time}>{formatChatListTime(lastActivity)}</span>}
        </div>

        <div className={styles.preview}>
          {lastMessage ? (
            <>
              {/* like Telegram's "You:" prefix for your own messages */}
              {isBotAuthor(lastMessage.author) && <span className={styles.sender}>Bot: </span>}
              {lastMessage.body}
            </>
          ) : (
            'No messages'
          )}
        </div>
      </div>
    </button>
  )
}
