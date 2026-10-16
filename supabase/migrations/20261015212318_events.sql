-- Club events: edited on /admin, shown on /events. Only the website's server
-- talks to this table, with the project's secret key. RLS is on with no
-- policies and the Data API roles have no privileges, so the REST API returns
-- nothing to anyone else.

create table public.events (
  id               text primary key check (id ~ '^[A-Za-z0-9_-]{1,64}$'),
  title            text not null check (char_length(title) between 1 and 120),
  description      text not null default '' check (char_length(description) <= 2000),
  date             date not null,
  -- Wall clock in the club's timezone, as typed; instants are derived when read.
  start_time       text check (start_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  end_time         text check (end_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  location         text not null default '' check (char_length(location) <= 200),
  category         text not null default '' check (char_length(category) <= 40),
  image_url        text not null default '' check (char_length(image_url) <= 500),
  image_alt        text not null default '' check (char_length(image_alt) <= 300),
  registration_url text not null default '' check (char_length(registration_url) <= 500),
  status           text not null default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  published        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.events is 'Club events; edited on /admin, read by /events.';

create index events_published_date_idx on public.events (date) where published;

alter table public.events enable row level security;
revoke all on table public.events from anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Flyers: public to read (they are posters), written only by the server, and
-- only as the WebP the site re-encodes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('flyers', 'flyers', true, 5242880, array['image/webp'])
on conflict (id) do nothing;
