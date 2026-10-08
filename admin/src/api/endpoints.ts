import { getJson } from './http.ts'
import type { Client, Message } from './types.ts'

// Sorted by last_message_at desc (newest chat first) by the edge function.
export const fetchClients = (signal?: AbortSignal) => getJson<Client[]>('clients', signal)

// ALL messages of ALL clients, sorted by created_at desc. Filtering by client happens client-side.
export const fetchMessages = (signal?: AbortSignal) => getJson<Message[]>('messages', signal)
