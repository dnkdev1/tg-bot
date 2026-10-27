# Supabase Auth in a SPA

How authentication and authorization work when a browser-only app (React/Vite SPA,
no backend of its own) talks to Supabase with `@supabase/supabase-js`.

Key ideas:

- The SPA only ever holds the **publishable (anon) key** — it is public and grants nothing by itself.
- After login the user gets a **JWT access token** (short-lived, ~1h) + a **refresh token** (long-lived, single-use).
- Every request to Supabase carries the access token; **Postgres RLS policies** decide what that user may read/write (`auth.uid()`, `auth.jwt()`).
- The **secret / service_role key never goes into the SPA** — it bypasses RLS.

---

## 1. Components

```mermaid
flowchart LR
    subgraph Browser["Browser (SPA)"]
        UI["React UI"]
        SB["supabase-js client<br/>(publishable key)"]
        LS[("localStorage<br/>access + refresh token")]
        UI --> SB
        SB <--> LS
    end

    subgraph Supabase
        AUTH["Auth (GoTrue)<br/>/auth/v1"]
        REST["PostgREST<br/>/rest/v1"]
        RT["Realtime<br/>WebSocket"]
        EF["Edge Functions<br/>/functions/v1"]
        STO["Storage<br/>/storage/v1"]
        DB[("Postgres<br/>+ RLS policies")]
    end

    IDP["OAuth provider<br/>(Google, GitHub, …)"]

    SB -- "login / refresh / logout" --> AUTH
    SB -- "Bearer JWT" --> REST
    SB -- "JWT on join" --> RT
    SB -- "Bearer JWT" --> EF
    SB -- "Bearer JWT" --> STO
    AUTH <-.-> IDP
    REST --> DB
    RT --> DB
    STO --> DB
    EF -- "user JWT or service_role" --> DB
```

---

## 2. Sign in (email + password)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant SPA as SPA (supabase-js)
    participant LS as localStorage
    participant A as Supabase Auth

    U->>SPA: enter email + password
    SPA->>A: POST /auth/v1/token?grant_type=password<br/>apikey: publishable key
    A->>A: verify credentials
    A-->>SPA: { access_token (JWT), refresh_token, expires_in, user }
    SPA->>LS: persist session
    SPA-->>U: onAuthStateChange("SIGNED_IN")
```

Magic link / OTP work the same way, except step 2–3 are split: Auth emails a code or link,
and the token is issued when the user confirms it.

---

## 3. Sign in with OAuth (PKCE flow — default for SPAs)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant SPA as SPA (supabase-js)
    participant LS as localStorage
    participant A as Supabase Auth
    participant P as OAuth provider

    U->>SPA: click "Sign in with Google"
    SPA->>SPA: generate code_verifier,<br/>code_challenge = SHA256(verifier)
    SPA->>LS: store code_verifier
    SPA->>A: redirect /auth/v1/authorize?provider=google<br/>&code_challenge=…&redirect_to=https://app/callback
    A->>P: redirect to provider consent screen
    U->>P: log in + consent
    P-->>A: callback with provider code
    A->>P: exchange code → provider user info
    A-->>SPA: redirect https://app/callback?code=AUTH_CODE
    SPA->>LS: read code_verifier
    SPA->>A: POST /auth/v1/token?grant_type=pkce<br/>{ auth_code, code_verifier }
    A->>A: check SHA256(verifier) == challenge
    A-->>SPA: { access_token, refresh_token, user }
    SPA->>LS: persist session
    SPA-->>U: onAuthStateChange("SIGNED_IN")
```

`redirect_to` must be listed in **Auth → URL Configuration → Redirect URLs**.

---

## 4. Authorized data request + RLS

```mermaid
sequenceDiagram
    autonumber
    participant SPA as SPA (supabase-js)
    participant R as PostgREST
    participant DB as Postgres

    SPA->>R: GET /rest/v1/conversations<br/>apikey: publishable key<br/>Authorization: Bearer <access_token>
    R->>R: verify JWT signature + exp
    R->>DB: SET ROLE authenticated<br/>request.jwt.claims = { sub, role, email, … }
    DB->>DB: apply RLS policy<br/>e.g. USING (user_id = auth.uid())
    DB-->>R: only rows this user may see
    R-->>SPA: 200 JSON
```

Without a session the same request runs as role **`anon`** — only policies granted to `anon` apply.

Example policy:

```sql
alter table conversations enable row level security;

create policy "own rows"
on conversations for select
to authenticated
using (user_id = auth.uid());
```

---

## 5. Token refresh

```mermaid
sequenceDiagram
    autonumber
    participant SPA as SPA (supabase-js)
    participant LS as localStorage
    participant A as Supabase Auth

    Note over SPA: autoRefreshToken: true<br/>timer fires shortly before access_token expires
    SPA->>A: POST /auth/v1/token?grant_type=refresh_token<br/>{ refresh_token }
    alt refresh token valid (not used, not revoked)
        A->>A: rotate: revoke old refresh token
        A-->>SPA: new access_token + new refresh_token
        SPA->>LS: overwrite session
        SPA-->>SPA: onAuthStateChange("TOKEN_REFRESHED")
    else expired / reused / revoked
        A-->>SPA: 400 invalid refresh token
        SPA->>LS: clear session
        SPA-->>SPA: onAuthStateChange("SIGNED_OUT")
    end
```

On page reload supabase-js reads the session from localStorage, and refreshes it immediately if the access token is already expired.

---

## 6. Edge Function call

```mermaid
sequenceDiagram
    autonumber
    participant SPA as SPA
    participant EF as Edge Function
    participant A as Supabase Auth
    participant DB as Postgres

    SPA->>EF: supabase.functions.invoke("x")<br/>Authorization: Bearer <access_token>
    EF->>EF: gateway checks JWT (verify_jwt = true)
    EF->>A: supabase.auth.getUser(token)
    A-->>EF: user { id, email, app_metadata.role }
    alt act as the user (RLS applies)
        EF->>DB: client created with user's Authorization header
    else privileged action
        EF->>EF: check user role / permissions in code
        EF->>DB: client created with service_role key (bypasses RLS)
    end
    DB-->>EF: result
    EF-->>SPA: response
```

---

## 7. Realtime subscription

```mermaid
sequenceDiagram
    autonumber
    participant SPA as SPA
    participant RT as Realtime
    participant DB as Postgres

    SPA->>RT: WebSocket connect (apikey)<br/>join channel with access_token
    RT->>RT: verify JWT
    DB-->>RT: change on table (WAL)
    RT->>RT: check RLS for this user's JWT
    RT-->>SPA: postgres_changes event (only allowed rows)
    Note over SPA,RT: on TOKEN_REFRESHED supabase-js<br/>sends the new token to the socket
```

---

## 8. Sign out

```mermaid
sequenceDiagram
    autonumber
    participant SPA as SPA
    participant LS as localStorage
    participant A as Supabase Auth

    SPA->>A: POST /auth/v1/logout<br/>Bearer <access_token>
    A->>A: revoke refresh token(s)
    A-->>SPA: 204
    SPA->>LS: remove session
    SPA-->>SPA: onAuthStateChange("SIGNED_OUT")
    Note over SPA: already issued access_token stays<br/>technically valid until exp (≤ 1h)
```

---

## 9. Session lifecycle (state view)

```mermaid
stateDiagram-v2
    [*] --> Anonymous: app loads, no session
    [*] --> Restoring: session found in localStorage
    Restoring --> Authenticated: token valid / refreshed
    Restoring --> Anonymous: refresh failed
    Anonymous --> Authenticated: signIn (password / OTP / OAuth)
    Authenticated --> Authenticated: TOKEN_REFRESHED
    Authenticated --> Anonymous: signOut / refresh failed
```

---

## Client setup for a SPA with login

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      flowType: 'pkce',        // OAuth / magic link via code exchange
      persistSession: true,    // keep session in localStorage
      autoRefreshToken: true,  // refresh before expiry
      detectSessionInUrl: true // handle ?code= on the callback route
    },
  },
)

supabase.auth.onAuthStateChange((event, session) => {
  // SIGNED_IN | TOKEN_REFRESHED | SIGNED_OUT | USER_UPDATED | PASSWORD_RECOVERY
})
```

> Note: the current `admin/src/api/supabase.ts` uses `persistSession: false, autoRefreshToken: false`
> because the admin panel has no user login yet (Realtime only). Switch to the settings above when adding auth.

## Security checklist

- RLS **enabled on every table** exposed through the API.
- Only the publishable key in the SPA bundle; `service_role` / secret key only in Edge Functions.
- Role checks (admin, etc.) via `app_metadata` (users can't edit it), not `user_metadata`.
- Redirect URLs allow-listed in the dashboard.
- localStorage is readable by any script on the page → keep XSS surface small (CSP, no untrusted HTML).
