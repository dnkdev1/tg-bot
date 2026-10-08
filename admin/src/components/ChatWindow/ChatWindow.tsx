import { useClientMessages, useClients } from '../../api/queries.ts'
import { parseUtc } from '../../lib/format.ts'
import { ChatHeader } from '../ChatHeader/ChatHeader.tsx'
import { MessageList } from '../MessageList/MessageList.tsx'
import styles from './ChatWindow.module.css'

interface ChatWindowProps {
  clientId: number | null
  onClose: () => void
}

// Right column: header + messages of the selected client from the `messages` edge function.
export function ChatWindow({ clientId, onClose }: ChatWindowProps) {
  const clients = useClients() // already cached by the chat list, no extra request
  const messages = useClientMessages(clientId)

  if (clientId === null) {
    return (
      <section className={styles.chat}>
        <Notice text="Select a chat to view messages" />
      </section>
    )
  }

  // A chat can be opened from the URL (#/chat/2) before the clients list has arrived.
  if (clients.isPending) {
    return (
      <section className={styles.chat}>
        <MessagesSkeleton />
      </section>
    )
  }

  if (clients.isError) {
    return (
      <section className={styles.chat}>
        <Notice
          text={`Could not load chats: ${clients.error.message}`}
          action={{ label: 'Retry', onClick: () => clients.refetch() }}
        />
      </section>
    )
  }

  const client = clients.data.find((c) => c.id === clientId)
  if (!client) {
    // e.g. an old link to a client that no longer exists
    return (
      <section className={styles.chat}>
        <Notice text={`Chat #${clientId} not found`} action={{ label: 'Close', onClick: onClose }} />
      </section>
    )
  }

  const list = messages.data ?? []
  const newest = list.at(-1)
  const raw = newest?.created_at ?? client.last_message_at
  const lastActivity = raw ? parseUtc(raw) : null

  return (
    <section className={styles.chat}>
      <ChatHeader client={client} messageCount={list.length} lastActivity={lastActivity} onBack={onClose} />

      {messages.isPending && <MessagesSkeleton />}
      {messages.isError && (
        <Notice
          text={`Could not load messages: ${messages.error.message}`}
          action={{ label: 'Retry', onClick: () => messages.refetch() }}
        />
      )}
      {messages.isSuccess && list.length === 0 && <Notice text="No messages yet" />}
      {/* key: a new list per chat, so scroll position and the ↓ button start fresh */}
      {messages.isSuccess && list.length > 0 && <MessageList key={client.id} messages={list} />}
    </section>
  )
}

interface NoticeProps {
  text: string
  action?: { label: string; onClick: () => void }
}

// Centered pill with an optional button under it
function Notice({ text, action }: NoticeProps) {
  return (
    <div className={styles.empty}>
      <div className={styles.noticeBox} role={action ? 'alert' : undefined}>
        <span className={styles.pill}>{text}</span>
        {action && (
          <button type="button" className={styles.action} onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

// Grey placeholder bubbles while messages load; widths vary so it looks like a chat
const SKELETON_BUBBLES = [
  { out: false, width: 180 },
  { out: true, width: 260 },
  { out: false, width: 120 },
  { out: true, width: 300 },
  { out: false, width: 220 },
  { out: true, width: 160 },
]

function MessagesSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading messages">
      {SKELETON_BUBBLES.map((bubble, i) => (
        <div key={i} className={bubble.out ? styles.skeletonRowOut : styles.skeletonRow}>
          <div className={styles.skeletonBubble} style={{ width: bubble.width }} />
        </div>
      ))}
    </div>
  )
}
