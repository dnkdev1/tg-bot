-- Edge Functions on the default *.supabase.co domain rewrite text/html GET
-- responses to text/plain (an anti-phishing measure; real HTML hosting needs a
-- custom domain). Storage's public bucket endpoint isn't subject to that
-- rewrite, so the bot's static pages (mini app, message log) are hosted here
-- instead, while the "bot" function stays a pure JSON API + webhook.
insert into storage.buckets (id, name, public)
values ('site', 'site', true)
on conflict (id) do nothing;
