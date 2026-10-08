import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import type { Message } from '../../api/types.ts'
import { dayKey, isBotAuthor, parseUtc } from '../../lib/format.ts'
import { DateSeparator } from '../DateSeparator/DateSeparator.tsx'
import { MessageBubble } from '../MessageBubble/MessageBubble.tsx'
import styles from './MessageList.module.css'

interface MessageListProps {
  messages: Message[] // oldest first
}

// "Near the bottom" tolerance: new messages keep the view pinned if the user is this close.
const STICK_THRESHOLD_PX = 80
// Show the ↓ button once the user has scrolled up this far.
const JUMP_BUTTON_THRESHOLD_PX = 200

// Bubbles with a date pill at each new day. Consecutive messages from the same side
// form a group: extra spacing before it, tail only on its last bubble.
export function MessageList({ messages }: MessageListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  // true while the user is at the bottom; starts true so a chat opens at the newest message
  const stickToBottom = useRef(true)
  const [showJump, setShowJump] = useState(false)

  // Scroll to the newest message on open, and when new messages arrive (auto-refresh,
  // step 9) but only if the user was already at the bottom; never yank them away while
  // they read older messages. useLayoutEffect runs before paint: no visible jump.
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottom.current = distanceFromBottom < STICK_THRESHOLD_PX
    setShowJump(distanceFromBottom > JUMP_BUTTON_THRESHOLD_PX)
  }

  const jumpToBottom = () => {
    const el = scrollerRef.current
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.scroller} ref={scrollerRef} onScroll={handleScroll}>
        <div className={styles.column}>
          {messages.map((message, i) => {
            const prev = messages[i - 1]
            const next = messages[i + 1]
            const date = parseUtc(message.created_at)
            const day = dayKey(date)
            const isOut = isBotAuthor(message.author)

            const newDay = !prev || dayKey(parseUtc(prev.created_at)) !== day
            const nextNewDay = !next || dayKey(parseUtc(next.created_at)) !== day
            const isGroupStart = newDay || isBotAuthor(prev.author) !== isOut
            const isGroupEnd = nextNewDay || isBotAuthor(next.author) !== isOut

            return (
              <Fragment key={message.id}>
                {newDay && <DateSeparator date={date} />}
                <MessageBubble message={message} isGroupStart={isGroupStart} isGroupEnd={isGroupEnd} />
              </Fragment>
            )
          })}
        </div>
      </div>

      {showJump && (
        <button type="button" className={styles.jump} onClick={jumpToBottom} aria-label="Scroll to newest message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}
