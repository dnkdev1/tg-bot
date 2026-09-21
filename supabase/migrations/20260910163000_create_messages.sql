create table if not exists public.messages (
  id bigint generated always as identity primary key,
  sender text not null,
  text text not null,
  date timestamptz not null,
  user_id bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_user_id_idx on public.messages (user_id);

-- no policies: the bot function talks to this table only through the
-- service-role (supabaseAdmin) client, which bypasses RLS. Enabling RLS with
-- no policies blocks direct anon/public access via the auto-generated REST API.
alter table public.messages enable row level security;
