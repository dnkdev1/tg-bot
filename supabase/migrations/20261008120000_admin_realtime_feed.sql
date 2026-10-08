-- Real-time feed for the admin panel (admin/).
--
-- After every insert/update on clients and messages, a trigger broadcasts the row
-- over Supabase Realtime (WebSocket) to the public channel "admin-feed".
-- Broadcast is used instead of Postgres Changes so the tables stay locked
-- (RLS on, no policies): the trigger picks the columns itself and, like the
-- clients/messages edge functions, leaves out the Telegram user ids.

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
      false          -- public channel: no Supabase Auth needed to listen
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
      false
    );
  exception when others then
    raise warning 'admin-feed broadcast failed: %', sqlerrm;
  end;
  return null;
end;
$$;

-- trigger functions cannot be called directly anyway; revoke for clarity
revoke execute on function public.broadcast_client_change() from public, anon, authenticated;
revoke execute on function public.broadcast_message_change() from public, anon, authenticated;

drop trigger if exists clients_admin_feed on public.clients;
create trigger clients_admin_feed
  after insert or update on public.clients
  for each row execute function public.broadcast_client_change();

drop trigger if exists messages_admin_feed on public.messages;
create trigger messages_admin_feed
  after insert or update on public.messages
  for each row execute function public.broadcast_message_change();
