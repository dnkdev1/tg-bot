// Shapes of the JSON returned by the Supabase Edge Functions.

// GET /functions/v1/clients
export interface Client {
  id: number
  created_at: string // ISO with offset, e.g. "2026-09-21T03:21:47.656343+00:00"
  first_name: string | null
  last_name: string | null
  // `timestamp without time zone` in Postgres: UTC wall-clock time with NO offset,
  // e.g. "2026-09-21T04:35:35.744". Parse it with parseUtc(), never new Date() directly.
  last_message_at: string | null
}

// GET /functions/v1/messages
export interface Message {
  id: number
  created_at: string // ISO with offset
  // the three text columns are nullable in the database
  author: string | null // Telegram username of the client, or the bot's name
  body: string | null
  messenger_type: string | null // currently always "telegram"
  client_id: number // -> Client.id
}
