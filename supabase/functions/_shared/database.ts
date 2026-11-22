// @ts-nocheck
// The ONLY place in the app that connects to the database.
//
// Every edge function (bot, clients, messages) and every repository gets its
// database client from getDatabase() below; nothing else may create a Supabase
// client or read the database keys. To change how the app connects (other key,
// other options, a different driver), change this file only.
//
// It uses createAdminClient() from @supabase/server, the same function
// withSupabase() uses to build ctx.supabaseAdmin, so the connection behaves
// exactly as before: it reads SUPABASE_URL and SUPABASE_SECRET_KEYS, which
// Supabase injects into every deployed edge function automatically.
//
// The client has full access (it bypasses Row Level Security). Callers that
// serve other users must check permissions themselves before querying.

// full npm: specifier (not the bare "@supabase/server" from deno.json) so this
// shared file works in every function regardless of its own import map
import { createAdminClient } from "npm:@supabase/server@^1/core";

let database = null;

// One client per edge-function instance, created on first use and reused by
// later requests (it holds no user session, so sharing it is safe).
export function getDatabase() {
  if (!database) {
    database = createAdminClient();
  }
  return database;
}
