// @ts-nocheck
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

// PostgREST returns at most 1000 rows per request, so "all clients" is read page by page.
const PAGE_SIZE = 1000;

// Admins only: the caller must send "Authorization: Bearer <access token>" of a
// logged-in user whose app_metadata.role is "admin" (set by SQL, users cannot
// change it themselves). No / invalid / expired token -> 401 from withSupabase;
// valid token of a non-admin -> 403 below. user_telegram_id is deliberately not selected.
export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (ctx.userClaims?.appMetadata?.role !== "admin") {
      return Response.json({ error: "Admins only" }, { status: 403 });
    }

    const clients = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await ctx.supabaseAdmin
        .from("clients")
        .select("id, created_at, first_name, last_name, last_message_at")
        .order("last_message_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) return Response.json({ error: error.message }, { status: 500 });

      clients.push(...data);
      if (data.length < PAGE_SIZE) break;
    }

    // pretty-printed (one field per line) so the raw JSON is readable in a browser tab
    return new Response(JSON.stringify(clients, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }),
};
