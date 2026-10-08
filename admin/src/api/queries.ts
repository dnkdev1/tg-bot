import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClients, fetchMessages } from './endpoints.ts'
import type { Message } from './types.ts'

// Cache keys. Both message hooks share 'messages', so the endpoint is called once
// no matter how many components read it.
export const queryKeys = {
  clients: ['clients'] as const,
  messages: ['messages'] as const,
}

export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: ({ signal }) => fetchClients(signal),
  })
}

// Messages of one chat, oldest first (the order a chat window shows them).
export function useClientMessages(clientId: number | null) {
  // `select` must be a stable function: TanStack Query re-runs it (and returns a new
  // array) whenever it changes, which would re-render the whole message list.
  const select = useCallback(
    (messages: Message[]) =>
      messages
        .filter((m) => m.client_id === clientId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id),
    [clientId],
  )

  return useQuery({
    queryKey: queryKeys.messages,
    queryFn: ({ signal }) => fetchMessages(signal),
    enabled: clientId !== null,
    select,
  })
}

// Newest message per client, for the preview line in the chat list.
// The endpoint already returns newest first, so the first hit per client wins.
// Module-level function, so it is stable without useCallback.
function lastMessageByClient(messages: Message[]) {
  const last = new Map<number, Message>()
  for (const m of messages) if (!last.has(m.client_id)) last.set(m.client_id, m)
  return last
}

export function useLastMessageByClient() {
  return useQuery({
    queryKey: queryKeys.messages,
    queryFn: ({ signal }) => fetchMessages(signal),
    select: lastMessageByClient,
  })
}

// Total number of messages, for the stats line in the side menu
const countMessages = (messages: Message[]) => messages.length

export function useMessageCount() {
  return useQuery({
    queryKey: queryKeys.messages,
    queryFn: ({ signal }) => fetchMessages(signal),
    select: countMessages,
  })
}
