import type { Message } from '../../api/types.ts'
import { formatMessageTime, isBotAuthor, parseUtc } from '../../lib/format.ts'
import styles from './MessageBubble.module.css'

interface MessageBubbleProps {
  message: Message
  // first/last message in a run of messages from the same side
  isGroupStart: boolean
  isGroupEnd: boolean
}

// One message. Client messages are incoming (white, left); bot replies are outgoing
// (green, right), as if the admin is looking at the chat from the bot's side.
export function MessageBubble({ message, isGroupStart, isGroupEnd }: MessageBubbleProps) {
  const isOut = isBotAuthor(message.author)
  const date = parseUtc(message.created_at)
  const time = formatMessageTime(date)

  const rowClass = [
    styles.row,
    isOut ? styles.out : styles.in,
    isGroupStart && styles.groupStart,
    isGroupEnd && styles.groupEnd,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rowClass}>
      <div className={styles.bubble} title={`${message.author ?? 'unknown author'} · ${date.toLocaleString()}`}>
        {/* the bot writes under two names, so show which one sent the reply */}
        {isOut && isGroupStart && <div className={styles.author}>{message.author}</div>}

        <span className={styles.text}>{message.body}</span>
        {/* invisible copy of the time: reserves exactly its width on the last line */}
        <span className={styles.spacer} aria-hidden="true">
          {time}
        </span>
        <time className={styles.time} dateTime={date.toISOString()}>
          {time}
        </time>

        {isGroupEnd && (
          <svg className={styles.tail} viewBox="0 0 9 17" aria-hidden="true">
            <path d="M9 0v17H1.5C.5 17 0 16 .8 15.2 4.5 11.5 9 7 9 0z" fill="currentColor" />
          </svg>
        )}
      </div>
    </div>
  )
}
