import { useEffect, useState } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { queryKeys } from './queries.ts'
import { supabase } from './supabase.ts'
import type { Client, Message } from './types.ts'

// Live updates over a WebSocket (Supabase Realtime, Broadcast).
// Database triggers (migration 20261008120000_admin_realtime_feed.sql) send every
// inserted/updated client and message to the "admin-feed" channel; this hook
// writes them straight into the TanStack Query cache, so the chat list and the
// open chat re-render instantly without refetching anything.

export type FeedStatus = 'connecting' | 'live' | 'offline'

const CHANNEL = 'admin-feed'

// Same order the edge functions return: newest first
const newestMessageFirst = (a: Message, b: Message) =>
  b.created_at.localeCompare(a.created_at) || b.id - a.id
const newestClientFirst = (a: Client, b: Client) =>
  (b.last_message_at ?? '').localeCompare(a.last_message_at ?? '') || b.id - a.id

// Replace the row with the same id (update) or add it (insert), then re-sort.
// If the initial list has not loaded yet there is nothing to patch: that request
// will return the row anyway.
function upsert<T extends { id: number }>(list: T[] | undefined, row: T, order: (a: T, b: T) => number) {
  if (!list) return list
  return [...list.filter((item) => item.id !== row.id), row].sort(order)
}

function applyClient(queryClient: QueryClient, client: Client) {
  queryClient.setQueryData<Client[]>(queryKeys.clients, (list) => upsert(list, client, newestClientFirst))
}

function applyMessage(queryClient: QueryClient, message: Message) {
  queryClient.setQueryData<Message[]>(queryKeys.messages, (list) => upsert(list, message, newestMessageFirst))

  // A message from a client we have never seen: fetch the clients list again.
  // (Normally the client's own event arrives first, because the bot saves the client
  // before the message.)
  const clients = queryClient.getQueryData<Client[]>(queryKeys.clients)
  if (clients && !clients.some((c) => c.id === message.client_id)) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.clients })
  }
}

// Subscribe once for the whole app (called in App). Returns the connection state
// for the "Connecting…" indicator.
export function useRealtimeFeed(): FeedStatus {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<FeedStatus>('connecting')

  useEffect(() => {
    let wasLive = false

    const channel = supabase
      .channel(CHANNEL)
      .on('broadcast', { event: 'client' }, ({ payload }) => applyClient(queryClient, payload as Client))
      .on('broadcast', { event: 'message' }, ({ payload }) => applyMessage(queryClient, payload as Message))
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') {
          // Back after a disconnect (Wi-Fi drop, laptop sleep): events sent while we
          // were away are lost, so reload everything once.
          if (wasLive) void queryClient.invalidateQueries()
          wasLive = true
          setStatus('live')
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
          // supabase-js keeps retrying by itself; we only show it
          setStatus('offline')
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])

  return status
}
