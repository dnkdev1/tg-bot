import type { Client } from '../api/types.ts'

// Parse a timestamp that may lack a timezone. Values without an offset
// (clients.last_message_at) are UTC, so a "Z" is appended before parsing;
// otherwise the browser would read them as local time.
export function parseUtc(value: string): Date {
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/i.test(value)
  return new Date(hasOffset ? value : `${value}Z`)
}

export function clientDisplayName(client: Client): string {
  const name = [client.first_name, client.last_name].filter(Boolean).join(' ')
  return name || `Client #${client.id}`
}

// The messages table has no direction column. Bot replies are stored with the bot's
// name as author ("@ClearExchangeBot", "ExRateFX Bot"); client messages with the
// Telegram username ("dnkMain").
export function isBotAuthor(author: string | null): boolean {
  if (!author) return false // unknown author: show it as the client's message
  return author.startsWith('@') || /bot$/i.test(author)
}

// "D" for "Dnk", "JS" for "John Smith". Falls back to "#" when the client has no name.
export function clientInitials(client: Client): string {
  const letters = [client.first_name, client.last_name]
    .map((part) => part?.trim().charAt(0) ?? '')
    .join('')
  return letters.toUpperCase() || '#'
}

// Telegram's seven avatar colors; the same client always gets the same color.
const AVATAR_COLORS = ['#ff516a', '#ffa85c', '#b694f9', '#9ad164', '#5bcbe3', '#5caffa', '#ff8aac']

export function avatarColor(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length]
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const DAY_MS = 24 * 60 * 60 * 1000

// Time label in the chat list, like Telegram:
// today -> "14:05", last 7 days -> "Mon", this year -> "21 Sep", older -> "21.09.25"
export function formatChatListTime(date: Date, now: Date = new Date()): string {
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS)
  if (daysAgo <= 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (daysAgo < 7) return date.toLocaleDateString([], { weekday: 'short' })
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// "14:05": time inside a message bubble
export function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Key for grouping messages by local calendar day, e.g. "2026-8-21"
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// Date separator pill between days: "Today", "Yesterday", "September 21", "September 21, 2025"
export function formatDayLabel(date: Date, now: Date = new Date()): string {
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS)
  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
}

// Chat header subtitle: "last message today at 14:05" / "last message Sep 21 at 11:35"
export function formatLastSeen(date: Date, now: Date = new Date()): string {
  const day = formatDayLabel(date, now)
  const dayText =
    day === 'Today' || day === 'Yesterday'
      ? day.toLowerCase()
      : date.toLocaleDateString([], {
          day: 'numeric',
          month: 'short',
          year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
        })
  return `last message ${dayText} at ${formatMessageTime(date)}`
}
