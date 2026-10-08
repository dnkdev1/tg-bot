import { useMemo } from 'react'
import { useClients, useLastMessageByClient } from '../../api/queries.ts'
import { clientDisplayName, parseUtc } from '../../lib/format.ts'
import { ChatListItem } from '../ChatListItem/ChatListItem.tsx'
import styles from './ChatList.module.css'

interface ChatListProps {
  search: string
  selectedClientId: number | null
  onSelect: (clientId: number) => void
}

// Chats from the `clients` edge function, newest activity first, filtered by the search field.
export function ChatList({ search, selectedClientId, onSelect }: ChatListProps) {
  const clients = useClients()
  // Preview text is optional: if /messages fails, the list still shows names and times.
  const lastMessages = useLastMessageByClient()

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (clients.data ?? [])
      .filter((client) => clientDisplayName(client).toLowerCase().includes(query))
      .map((client) => {
        const lastMessage = lastMessages.data?.get(client.id)
        // The newest message's created_at is exact; last_message_at is the fallback.
        const raw = lastMessage?.created_at ?? client.last_message_at
        return { client, lastMessage, lastActivity: raw ? parseUtc(raw) : null }
      })
      .sort((a, b) => (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0))
  }, [clients.data, lastMessages.data, search])

  if (clients.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading chats">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={styles.skeleton}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonLines}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (clients.isError) {
    return (
      <div className={styles.status} role="alert">
        Could not load chats.
        <br />
        <small>{clients.error.message}</small>
        <br />
        <button type="button" className={styles.retry} onClick={() => clients.refetch()}>
          Retry
        </button>
      </div>
    )
  }

  if (clients.data.length === 0) return <p className={styles.status}>No chats yet</p>
  if (rows.length === 0) return <p className={styles.status}>No chats found for “{search.trim()}”</p>

  return (
    <ul className={styles.list}>
      {rows.map(({ client, lastMessage, lastActivity }) => (
        <li key={client.id}>
          <ChatListItem
            client={client}
            lastMessage={lastMessage}
            lastActivity={lastActivity}
            isActive={client.id === selectedClientId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  )
}
