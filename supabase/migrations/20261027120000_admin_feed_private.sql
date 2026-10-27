-- Make the admin panel's live feed admins-only.
--
-- Until now the triggers from 20261008120000_admin_realtime_feed.sql broadcast to a
-- PUBLIC "admin-feed" channel: anyone with the publishable key could listen.
-- Now they send to a PRIVATE channel, and Realtime lets a client join it only if
-- the policy below allows it, checked with the client's own access token: only
-- logged-in users whose app_metadata.role is "admin" (the same rule as the
-- clients/messages edge functions).

create or replace function public.broadcast_client_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    perform realtime.send(
      jsonb_build_object(
        'id', new.id,
        'created_at', new.created_at,
        'first_name', new.first_name,
        'last_name', new.last_name,
        'last_message_at', new.last_message_at
      ),
      'client',      -- event name
      'admin-feed',  -- channel (topic)
      true           -- private channel: only listeners allowed by the policy below
    );
  exception when others then
    -- the live feed must never break the bot's write
    raise warning 'admin-feed broadcast failed: %', sqlerrm;
  end;
  return null;
end;
$$;

create or replace function public.broadcast_message_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    perform realtime.send(
      jsonb_build_object(
        'id', new.id,
        'created_at', new.created_at,
        'author', new.author,
        'body', new.body,
        'messenger_type', new.messenger_type,
        'client_id', new.client_id
      ),
      'message',
      'admin-feed',
      true
    );
  exception when others then
    raise warning 'admin-feed broadcast failed: %', sqlerrm;
  end;
  return null;
end;
$$;

-- Who may LISTEN to the private "admin-feed" channel. Realtime checks this once,
-- when the client joins, using the client's JWT. No insert policy: clients cannot
-- send into the channel, only the triggers above can (they run as the database).
drop policy if exists "admins can listen to admin-feed" on realtime.messages;
create policy "admins can listen to admin-feed"
on realtime.messages
for select
to authenticated
using (
  realtime.topic() = 'admin-feed'
  and realtime.messages.extension = 'broadcast'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
