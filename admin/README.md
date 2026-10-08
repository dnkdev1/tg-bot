# TG Bot Admin

Telegram-style admin panel for the bot: chats on the left (from the `clients` edge
function), the selected chat's messages on the right (from the `messages` edge function),
updated live over a WebSocket (Supabase Realtime).

Stack: React 19, TypeScript, Vite, CSS Modules, TanStack Query, `@supabase/supabase-js` (Realtime only).

## Run locally

```sh
cd admin
npm install
npm run dev        # http://localhost:5173
```

`admin/.env` (git-ignored) needs:

```
VITE_FUNCTIONS_URL=https://<project-ref>.supabase.co/functions/v1
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Only public values belong here. Never the secret / `service_role` key.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server with hot reload |
| `npm run build` | typecheck + production build into `dist/` |
| `npm run preview` | serve the built `dist/` |
| `npm run lint` | oxlint |

## How data flows

1. On load, `src/api/queries.ts` fetches `/clients` and `/messages` from the edge functions.
2. `src/api/realtime.ts` subscribes to the Realtime channel `admin-feed`. Database
   triggers (`supabase/migrations/20261008120000_admin_realtime_feed.sql`) broadcast every
   inserted/updated client and message there; the panel merges them into the cache instantly.
3. A full refetch every 60s (and after a reconnect) catches anything the socket missed.

## Deploy

Pushing changes under `admin/` to `master` runs `.github/workflows/deploy-admin.yml`,
which builds the panel and publishes it to GitHub Pages:
https://dnkdev1.github.io/tg-bot/

Supabase Storage cannot host it: on `*.supabase.co` it serves HTML as `text/plain`.

## Security note

The panel has no login. It shows what the public `clients`/`messages` edge functions
and the public `admin-feed` channel already expose to anyone. Protecting it needs auth
on those endpoints (e.g. Supabase Auth plus a private channel).
