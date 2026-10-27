import { useSyncExternalStore } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase.ts'

// The current login session, shared by the whole app.
// undefined = not known yet (the client is still reading localStorage / refreshing),
// null = logged out, Session = logged in.
let session: Session | null | undefined
const listeners = new Set<() => void>()

// One listener for the whole app. Fires INITIAL_SESSION right away with whatever
// was saved in localStorage, then SIGNED_IN / TOKEN_REFRESHED / SIGNED_OUT. This
// also covers other tabs: logging out in one tab logs out all of them.
supabase.auth.onAuthStateChange((_event, newSession) => {
  session = newSession
  listeners.forEach((notify) => notify())
})

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, () => session)
}

// Throws on wrong email/password, so the form can show the message.
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
