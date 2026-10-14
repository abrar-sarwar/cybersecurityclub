-- Event management for the Cybersecurity Club at GSU website.
--
-- Layers, from the outside in:
--   1. Grants decide which API roles can touch a table at all. New Supabase
--      projects grant nothing by default, so every grant here is deliberate.
--   2. Row Level Security decides which rows. Anonymous visitors see published
--      events only. Officers (public.admin_users, not revoked, signed in with a
--      second factor) manage events. Owners manage officers.
--   3. Triggers keep bookkeeping columns honest (version, timestamps, actors)
--      and write the audit log, which the API roles can only read.
--
-- Helper functions live in the `private` schema, which the Data API does not
-- expose. The only callable server functions in `public` are restricted to the
-- service role.

-- ---------------------------------------------------------------------------
-- Schemas and types
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
-- Policies run as the querying role and call private helpers, so the API roles
-- need USAGE on the schema. EXECUTE is granted per function below.
grant usage on schema private to authenticated;

create type public.event_category as enum ('workshop', 'speaker', 'career', 'competition', 'general_meeting', 'other');
create type public.event_status as enum ('draft', 'published', 'canceled');
create type public.admin_role as enum ('owner', 'editor');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique check (email = lower(email) and length(email) between 3 and 320),
  display_name text check (display_name is null or length(display_name) <= 120),
  role public.admin_role not null default 'editor',
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
comment on table public.admin_users is 'Officers allowed into /admin. A row with revoked_at set has no access.';

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 120),
  description text not null default '' check (length(description) <= 5000),
  category public.event_category not null default 'other',
  status public.event_status not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  location text not null check (length(location) between 1 and 200),
  directions_url text check (directions_url is null or (directions_url ~ '^https://[^\s]+$' and length(directions_url) <= 500)),
  registration_url text check (registration_url is null or (registration_url ~ '^https://[^\s]+$' and length(registration_url) <= 500)),
  flyer_path text check (flyer_path is null or length(flyer_path) <= 300),
  flyer_alt text check (flyer_alt is null or length(flyer_alt) <= 300),
  flyer_width integer check (flyer_width is null or flyer_width between 1 and 10000),
  flyer_height integer check (flyer_height is null or flyer_height between 1 and 10000),
  recap text check (recap is null or length(recap) <= 5000),
  slides_url text check (slides_url is null or (slides_url ~ '^https://[^\s]+$' and length(slides_url) <= 500)),
  recording_url text check (recording_url is null or (recording_url ~ '^https://[^\s]+$' and length(recording_url) <= 500)),
  materials_url text check (materials_url is null or (materials_url ~ '^https://[^\s]+$' and length(materials_url) <= 500)),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_by uuid references auth.users (id) on delete set null,
  legacy_key text unique check (legacy_key is null or length(legacy_key) <= 120),
  constraint events_ends_after_starts check (ends_at > starts_at),
  constraint events_flyer_complete check (
    (flyer_path is null) = (flyer_alt is null)
    and (flyer_path is null) = (flyer_width is null)
    and (flyer_path is null) = (flyer_height is null)
  )
);
comment on table public.events is 'Club events. Public pages see status <> draft and deleted_at is null.';

create index events_public_idx on public.events (starts_at) where status <> 'draft' and deleted_at is null;
create index events_status_starts_idx on public.events (status, starts_at);
create index events_trash_idx on public.events (deleted_at) where deleted_at is not null;
create index events_flyer_path_idx on public.events (flyer_path) where flyer_path is not null;
create index events_created_by_idx on public.events (created_by);
create index events_updated_by_idx on public.events (updated_by);

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  action text not null check (length(action) between 1 and 60),
  event_id uuid,
  target_user_id uuid,
  details jsonb not null default '{}'::jsonb
);
comment on table public.audit_log is 'Server-written record of administrative changes. API roles may only read it.';
create index audit_log_at_idx on public.audit_log (at desc);
create index audit_log_event_idx on public.audit_log (event_id) where event_id is not null;

create table private.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Helpers used by policies. SECURITY DEFINER so a policy on admin_users can
-- read admin_users without recursing. Each one only looks at auth.uid().
-- ---------------------------------------------------------------------------
create function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.revoked_at is null
  )
  and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

create function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.revoked_at is null
      and a.role = 'owner'
  )
  and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

revoke all on function private.is_active_admin() from public, anon, authenticated, service_role;
revoke all on function private.is_owner() from public, anon, authenticated, service_role;
grant execute on function private.is_active_admin() to authenticated;
grant execute on function private.is_owner() to authenticated;

-- ---------------------------------------------------------------------------
-- Event triggers: bookkeeping and audit
-- ---------------------------------------------------------------------------
create function private.events_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    new.version := 1;
    new.created_at := now();
    new.updated_at := now();
    new.created_by := coalesce(actor, new.created_by);
    new.updated_by := coalesce(actor, new.updated_by);
    if new.status = 'published' and new.published_at is null then
      new.published_at := now();
    end if;
    if new.deleted_at is not null then
      new.deleted_by := coalesce(actor, new.deleted_by);
    else
      new.deleted_by := null;
    end if;
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'event id is immutable' using errcode = 'check_violation';
  end if;
  new.created_at := old.created_at;
  new.created_by := old.created_by;
  new.version := old.version + 1;
  new.updated_at := now();
  new.updated_by := coalesce(actor, new.updated_by);
  if old.published_at is not null then
    new.published_at := old.published_at;
  elsif new.status = 'published' then
    new.published_at := now();
  end if;
  if new.deleted_at is not null and old.deleted_at is null then
    new.deleted_by := coalesce(actor, new.deleted_by);
  elsif new.deleted_at is null then
    new.deleted_by := null;
  else
    new.deleted_by := old.deleted_by;
  end if;
  return new;
end;
$$;

revoke all on function private.events_before_write() from public, anon, authenticated, service_role;

create trigger events_before_write
  before insert or update on public.events
  for each row execute function private.events_before_write();

-- Runs as the function owner because the API roles cannot write audit_log.
create function private.events_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  act text;
  changed text[];
  target_id uuid := case when tg_op = 'DELETE' then old.id else new.id end;
  details jsonb;
begin
  if tg_op = 'INSERT' then
    act := case when new.status = 'published' then 'event.created_published' else 'event.created' end;
    details := jsonb_build_object('title', new.title, 'to_status', new.status::text);
  elsif tg_op = 'DELETE' then
    act := 'event.purged';
    details := jsonb_build_object('title', old.title, 'from_status', old.status::text);
  else
    if new.deleted_at is not null and old.deleted_at is null then
      act := 'event.trashed';
    elsif new.deleted_at is null and old.deleted_at is not null then
      act := 'event.restored';
    elsif new.status is distinct from old.status then
      act := case new.status
        when 'published' then 'event.published'
        when 'canceled' then 'event.canceled'
        else 'event.unpublished'
      end;
    elsif new.flyer_path is distinct from old.flyer_path then
      act := case when new.flyer_path is null then 'event.flyer_removed' else 'event.flyer_uploaded' end;
    else
      act := 'event.updated';
    end if;
    select array_agg(n.key order by n.key)
      into changed
      from jsonb_each(to_jsonb(new)) as n
     where n.value is distinct from (to_jsonb(old) -> n.key)
       and n.key not in ('updated_at', 'updated_by', 'version');
    details := jsonb_build_object(
      'title', new.title,
      'from_status', old.status::text,
      'to_status', new.status::text,
      'changed', coalesce(to_jsonb(changed), '[]'::jsonb)
    );
  end if;

  insert into public.audit_log (actor_id, actor_email, action, event_id, details)
  values ((select auth.uid()), (select auth.jwt() ->> 'email'), act, target_id, details);
  return null;
end;
$$;
revoke all on function private.events_audit() from public, anon, authenticated, service_role;

create trigger events_audit
  after insert or update or delete on public.events
  for each row execute function private.events_audit();

-- ---------------------------------------------------------------------------
-- Admin user triggers: bookkeeping, audit and the last-owner guard
-- ---------------------------------------------------------------------------
create function private.admin_users_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  new.email := lower(btrim(new.email));
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.created_by := coalesce(actor, new.created_by);
    new.updated_at := now();
    return new;
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'admin user_id is immutable' using errcode = 'check_violation';
  end if;
  new.created_at := old.created_at;
  new.created_by := old.created_by;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.admin_users_before_write() from public, anon, authenticated, service_role;

create trigger admin_users_before_write
  before insert or update on public.admin_users
  for each row execute function private.admin_users_before_write();

create function private.admin_users_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admin_users where role = 'owner' and revoked_at is null) then
    raise exception 'At least one active owner must remain' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;
revoke all on function private.admin_users_guard() from public, anon, authenticated, service_role;

create trigger admin_users_last_owner
  after update or delete on public.admin_users
  for each row execute function private.admin_users_guard();

create function private.admin_users_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  act text;
  target uuid := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
  details jsonb;
begin
  if tg_op = 'INSERT' then
    act := 'admin.invited';
    details := jsonb_build_object('email', new.email, 'role', new.role::text);
  elsif tg_op = 'DELETE' then
    act := 'admin.removed';
    details := jsonb_build_object('email', old.email, 'role', old.role::text);
  elsif new.revoked_at is not null and old.revoked_at is null then
    act := 'admin.revoked';
    details := jsonb_build_object('email', new.email, 'role', new.role::text);
  elsif new.revoked_at is null and old.revoked_at is not null then
    act := 'admin.reinstated';
    details := jsonb_build_object('email', new.email, 'role', new.role::text);
  elsif new.role is distinct from old.role then
    act := 'admin.role_changed';
    details := jsonb_build_object('email', new.email, 'from_role', old.role::text, 'to_role', new.role::text);
  else
    act := 'admin.updated';
    details := jsonb_build_object('email', new.email);
  end if;

  insert into public.audit_log (actor_id, actor_email, action, target_user_id, details)
  values ((select auth.uid()), (select auth.jwt() ->> 'email'), act, target, details);
  return null;
end;
$$;
revoke all on function private.admin_users_audit() from public, anon, authenticated, service_role;

create trigger admin_users_audit
  after insert or update or delete on public.admin_users
  for each row execute function private.admin_users_audit();

-- ---------------------------------------------------------------------------
-- Server-only functions (service role). Fixed-window rate limiting and audit
-- entries for actions that do not change a table (sign-ins, MFA, invites).
-- ---------------------------------------------------------------------------
create function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  ts timestamptz := now();
  current_count integer;
begin
  if p_key is null or length(p_key) = 0 or length(p_key) > 200 or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;
  insert into private.rate_limits as r (key, window_start, count)
  values (p_key, ts, 1)
  on conflict (key) do update
    set count = case when r.window_start + make_interval(secs => p_window_seconds) <= ts then 1 else r.count + 1 end,
        window_start = case when r.window_start + make_interval(secs => p_window_seconds) <= ts then ts else r.window_start end
  returning count into current_count;
  -- Occasionally sweep stale windows so the table stays small.
  if random() < 0.01 then
    delete from private.rate_limits where window_start < ts - interval '1 day';
  end if;
  return current_count <= p_limit;
end;
$$;
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

create function public.log_action(
  p_action text,
  p_actor_id uuid,
  p_actor_email text,
  p_event_id uuid,
  p_target_user_id uuid,
  p_details jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, actor_email, action, event_id, target_user_id, details)
  values (p_actor_id, p_actor_email, left(p_action, 60), p_event_id, p_target_user_id, coalesce(p_details, '{}'::jsonb));
$$;
revoke all on function public.log_action(text, uuid, text, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.log_action(text, uuid, text, uuid, uuid, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Grants. The Data API only reaches what is granted here.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

-- The local image (and projects created before 2026-05-30) grant ALL on new
-- public tables to the API roles through default privileges. Start from zero.
revoke all on table public.events, public.admin_users, public.audit_log from public, anon, authenticated, service_role;
revoke all on table private.rate_limits from public, anon, authenticated, service_role;
revoke all on sequence public.audit_log_id_seq from public, anon, authenticated, service_role;

grant select on table public.events to anon;
grant select, insert, update, delete on table public.events to authenticated;
grant select, insert, update, delete on table public.admin_users to authenticated;
grant select on table public.audit_log to authenticated;

grant all on table public.events, public.admin_users, public.audit_log to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;
alter table public.admin_users enable row level security;
alter table public.audit_log enable row level security;
alter table private.rate_limits enable row level security;

-- Visitors: published and canceled events that are not in the trash.
create policy events_public_read on public.events
  for select to anon
  using (status <> 'draft' and deleted_at is null);

-- Signed-in users see the same, and active officers with a second factor see everything.
create policy events_authenticated_read on public.events
  for select to authenticated
  using ((status <> 'draft' and deleted_at is null) or (select private.is_active_admin()));

create policy events_admin_insert on public.events
  for insert to authenticated
  with check ((select private.is_active_admin()));

create policy events_admin_update on public.events
  for update to authenticated
  using ((select private.is_active_admin()))
  with check ((select private.is_active_admin()));

-- Permanent deletion: owners only, and only from the trash.
create policy events_owner_purge on public.events
  for delete to authenticated
  using ((select private.is_owner()) and deleted_at is not null);

-- Officers can read their own row (to learn they are revoked, or need MFA) and
-- active officers can read the roster. Only owners write.
create policy admin_users_read on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_active_admin()));

create policy admin_users_owner_insert on public.admin_users
  for insert to authenticated
  with check ((select private.is_owner()));

create policy admin_users_owner_update on public.admin_users
  for update to authenticated
  using ((select private.is_owner()))
  with check ((select private.is_owner()));

create policy admin_users_owner_delete on public.admin_users
  for delete to authenticated
  using ((select private.is_owner()));

create policy audit_log_admin_read on public.audit_log
  for select to authenticated
  using ((select private.is_active_admin()));

-- ---------------------------------------------------------------------------
-- Storage: one private bucket for flyers
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('flyers', 'flyers', false, 5242880, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- A flyer is readable exactly when the event it belongs to is public.
create policy flyers_public_read on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'flyers'
    and exists (
      select 1 from public.events e
      where e.flyer_path = storage.objects.name
        and e.status <> 'draft'
        and e.deleted_at is null
    )
  );

create policy flyers_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'flyers' and (select private.is_active_admin()));

create policy flyers_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'flyers' and (select private.is_active_admin()));

create policy flyers_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'flyers' and (select private.is_active_admin()))
  with check (bucket_id = 'flyers' and (select private.is_active_admin()));

create policy flyers_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'flyers' and (select private.is_active_admin()));
