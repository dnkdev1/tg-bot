alter table public.messages rename to conversations;

alter index if exists messages_pkey rename to conversations_pkey;
alter index if exists messages_user_id_idx rename to conversations_user_id_idx;
