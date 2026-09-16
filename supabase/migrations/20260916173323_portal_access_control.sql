-- Member portal access control: grants, row level security, guard triggers,
-- audit triggers and the few functions that must run with elevated rights.
--
-- Layers, from outside in:
--   1. Table and column grants decide what the API roles can touch at all.
--      New Supabase projects no longer grant these by default, so every grant
--      here is deliberate.
--   2. Row level security decides which rows.
--   3. Triggers guard profile columns and write the audit log, so role and
--      membership changes are recorded no matter which path made them.

-- ---------------------------------------------------------------------------
-- Private schema: helpers used by policies. Not exposed through the Data API.
-- ---------------------------------------------------------------------------
revoke all on schema private from public;
grant usage on schema private to authenticated;

alter table private.rate_limit_hits enable row level security;
revoke all on table private.rate_limit_hits from public, anon, authenticated;

-- SECURITY DEFINER so policies on profiles can read the caller's own role
-- without recursing through the profiles policies. Both only ever look at the
-- row for auth.uid().
create function private.has_role(min_role public.member_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and membership_status = 'active'
      and role >= min_role
  );
$$;

create function private.is_verified_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and membership_status = 'active'
      and student_email_verified_at is not null
  );
$$;

revoke all on function private.has_role(public.member_role) from public;
revoke all on function private.is_verified_member() from public;
grant execute on function private.has_role(public.member_role) to authenticated;
grant execute on function private.is_verified_member() to authenticated;

-- ---------------------------------------------------------------------------
-- Profile lifecycle triggers
-- ---------------------------------------------------------------------------

-- Every new auth user gets a member profile. Only the display name is copied
-- from provider metadata (it is user-editable, so it never decides access).
-- Role and membership always start at their defaults: nobody picks a role.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(
      btrim(left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 120)),
      ''
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Defence in depth behind the column grants below: requests made as the API
-- roles can only change the member-editable columns. Staff changes go through
-- the SECURITY DEFINER functions further down, which run as their owner.
create function private.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') and (
    new.id is distinct from old.id
    or new.student_email is distinct from old.student_email
    or new.student_email_verified_at is distinct from old.student_email_verified_at
    or new.role is distinct from old.role
    or new.membership_status is distinct from old.membership_status
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Members can only change full_name, grad_month, grad_year, major, interests and notify_events'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function private.guard_profile_update();

-- Records every role or membership status change, whichever path made it
-- (admin function, server code with the secret key, or the SQL editor).
create function private.audit_profile_access_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    session_user
  );
begin
  if new.role is distinct from old.role then
    insert into public.audit_log (actor_id, action, target_user_id, details)
    values (
      (select auth.uid()),
      'member.role_changed',
      new.id,
      jsonb_build_object('from', old.role, 'to', new.role, 'source', source)
    );
  end if;
  if new.membership_status is distinct from old.membership_status then
    insert into public.audit_log (actor_id, action, target_user_id, details)
    values (
      (select auth.uid()),
      'member.membership_status_changed',
      new.id,
      jsonb_build_object('from', old.membership_status, 'to', new.membership_status, 'source', source)
    );
  end if;
  return null;
end;
$$;

create trigger profiles_audit_access_change
  after update of role, membership_status on public.profiles
  for each row execute function private.audit_profile_access_change();

-- Event deletions are recorded atomically with the delete.
create function private.audit_event_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor_id, action, details)
  values (
    (select auth.uid()),
    'event.deleted',
    jsonb_build_object('event_id', old.id, 'title', old.title, 'starts_at', old.starts_at)
  );
  return old;
end;
$$;

create trigger events_audit_delete
  after delete on public.events
  for each row execute function private.audit_event_deleted();

revoke all on function private.audit_event_deleted() from public;
revoke all on function private.handle_new_user() from public;
revoke all on function private.set_updated_at() from public;
revoke all on function private.guard_profile_update() from public;
revoke all on function private.audit_profile_access_change() from public;

-- ---------------------------------------------------------------------------
-- Admin functions (callable by signed-in users, enforced inside)
-- ---------------------------------------------------------------------------
create function public.set_member_role(target_user_id uuid, new_role public.member_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role('admin') then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  if target_user_id = (select auth.uid()) and new_role <> 'admin' then
    raise exception 'Admins cannot remove their own admin role' using errcode = '42501';
  end if;

  update public.profiles set role = new_role where id = target_user_id;
  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
end;
$$;

create function public.set_membership_status(target_user_id uuid, new_status public.membership_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role('admin') then
    raise exception 'Only admins can change membership status' using errcode = '42501';
  end if;
  if target_user_id = (select auth.uid()) then
    raise exception 'Admins cannot change their own membership status' using errcode = '42501';
  end if;

  update public.profiles set membership_status = new_status where id = target_user_id;
  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.set_member_role(uuid, public.member_role) from public, anon;
revoke all on function public.set_membership_status(uuid, public.membership_status) from public, anon;
grant execute on function public.set_member_role(uuid, public.member_role) to authenticated;
grant execute on function public.set_membership_status(uuid, public.membership_status) to authenticated;

-- Check-in records attendance and the matching activity together. SECURITY
-- INVOKER, so the officer policies on both tables still apply.
create function public.check_in_member(p_event_id uuid, p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.event_attendance (event_id, user_id, checked_in_by)
  values (p_event_id, p_user_id, (select auth.uid()))
  on conflict do nothing;

  insert into public.activity (user_id, type, reference_id, awarded_by)
  values (p_user_id, 'workshop_attended', p_event_id::text, (select auth.uid()))
  on conflict do nothing;
end;
$$;

create function public.undo_check_in(p_event_id uuid, p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.event_attendance where event_id = p_event_id and user_id = p_user_id;
  delete from public.activity
  where user_id = p_user_id and type = 'workshop_attended' and reference_id = p_event_id::text;
end;
$$;

revoke all on function public.check_in_member(uuid, uuid) from public, anon;
revoke all on function public.undo_check_in(uuid, uuid) from public, anon;
grant execute on function public.check_in_member(uuid, uuid) to authenticated;
grant execute on function public.undo_check_in(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Server-only functions (secret key). Never granted to anon or authenticated.
-- ---------------------------------------------------------------------------

-- Attaches a student address to the account and stores a fresh hashed token.
-- Earlier unused tokens for the account are retired so only the newest link works.
create function public.request_student_email_verification(
  p_user_id uuid,
  p_email text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  if v_profile.student_email_verified_at is not null then
    raise exception 'Student email is already verified' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.profiles
    where student_email = p_email and student_email_verified_at is not null and id <> p_user_id
  ) then
    raise exception 'Student email is already verified on another account' using errcode = '23505';
  end if;

  update public.profiles set student_email = p_email where id = p_user_id;

  update public.student_email_verifications
     set used_at = now()
   where user_id = p_user_id and used_at is null;

  insert into public.student_email_verifications (user_id, email, token_hash, expires_at)
  values (p_user_id, p_email, p_token_hash, p_expires_at);
end;
$$;

-- Consumes a token once, and only for the account that requested it, so a
-- member who is tricked into clicking someone else's link verifies nothing.
-- Returns 'verified', 'already_verified', 'email_changed', 'email_in_use',
-- 'wrong_account' or 'invalid' (unknown, used or expired).
create function public.consume_student_email_token(p_token_hash text, p_user_id uuid)
returns table (result text, verified_user_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  update public.student_email_verifications as v
     set used_at = now()
   where v.token_hash = p_token_hash
     and v.user_id = p_user_id
     and v.used_at is null
     and v.expires_at > now()
  returning v.user_id, v.email into v_user_id, v_email;

  if v_user_id is null then
    if exists (
      select 1 from public.student_email_verifications as v
      where v.token_hash = p_token_hash and v.used_at is null and v.expires_at > now()
    ) then
      return query select 'wrong_account'::text, null::uuid;
    else
      return query select 'invalid'::text, null::uuid;
    end if;
    return;
  end if;

  begin
    update public.profiles as p
       set student_email_verified_at = now()
     where p.id = v_user_id
       and p.student_email = v_email
       and p.student_email_verified_at is null;

    if found then
      return query select 'verified'::text, v_user_id;
    elsif exists (
      select 1 from public.profiles as p
      where p.id = v_user_id and p.student_email = v_email and p.student_email_verified_at is not null
    ) then
      return query select 'already_verified'::text, v_user_id;
    else
      return query select 'email_changed'::text, v_user_id;
    end if;
  exception when unique_violation then
    return query select 'email_in_use'::text, v_user_id;
  end;
end;
$$;

-- Sliding-window limiter. Returns true and records a hit when the caller is
-- under the limit; returns false without recording when the limit is reached.
create function public.hit_rate_limit(
  p_bucket text,
  p_subject text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  if p_max < 1 or p_window_seconds not between 1 and 86400 then
    raise exception 'Invalid rate limit' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_subject, 0));

  delete from private.rate_limit_hits
  where bucket = p_bucket and created_at < now() - interval '1 day';

  select count(*) into v_hits
  from private.rate_limit_hits
  where bucket = p_bucket
    and subject = p_subject
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_hits >= p_max then
    return false;
  end if;

  insert into private.rate_limit_hits (bucket, subject) values (p_bucket, p_subject);
  return true;
end;
$$;

revoke all on function public.request_student_email_verification(uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.consume_student_email_token(text, uuid) from public, anon, authenticated;
revoke all on function public.hit_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.request_student_email_verification(uuid, text, text, timestamptz) to service_role;
grant execute on function public.consume_student_email_token(text, uuid) to service_role;
grant execute on function public.hit_rate_limit(text, text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on table
  public.profiles,
  public.student_email_verifications,
  public.events,
  public.event_rsvps,
  public.event_attendance,
  public.activity,
  public.audit_log
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.student_email_verifications,
  public.events,
  public.event_rsvps,
  public.event_attendance,
  public.activity,
  public.audit_log
to service_role;

grant select on table public.profiles to authenticated;
grant update (full_name, grad_month, grad_year, major, interests, notify_events)
  on table public.profiles to authenticated;

grant select, delete on table public.events to authenticated;
grant insert (title, description, location, starts_at, ends_at, created_by)
  on table public.events to authenticated;
grant update (title, description, location, starts_at, ends_at)
  on table public.events to authenticated;

grant select, delete on table public.event_rsvps to authenticated;
grant insert (event_id, user_id) on table public.event_rsvps to authenticated;

grant select, delete on table public.event_attendance to authenticated;
grant insert (event_id, user_id, checked_in_by) on table public.event_attendance to authenticated;

grant select, delete on table public.activity to authenticated;
grant insert (user_id, type, reference_id, awarded_by) on table public.activity to authenticated;

grant select on table public.audit_log to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.student_email_verifications enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.event_attendance enable row level security;
alter table public.activity enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy "Members read their own profile; officers read all"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select private.has_role('officer')));

create policy "Members update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- student_email_verifications: no policies. Only the secret key reaches it.

-- events
create policy "Signed-in users read events"
  on public.events for select to authenticated
  using (true);

create policy "Officers create events"
  on public.events for insert to authenticated
  with check ((select private.has_role('officer')) and created_by = (select auth.uid()));

create policy "Officers edit events"
  on public.events for update to authenticated
  using ((select private.has_role('officer')))
  with check ((select private.has_role('officer')));

create policy "Admins delete events"
  on public.events for delete to authenticated
  using ((select private.has_role('admin')));

-- event_rsvps
create policy "Members read their own RSVPs; officers read all"
  on public.event_rsvps for select to authenticated
  using ((select auth.uid()) = user_id or (select private.has_role('officer')));

create policy "Verified members RSVP for themselves to upcoming events"
  on public.event_rsvps for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.is_verified_member())
    and exists (
      select 1 from public.events as e
      where e.id = event_id and coalesce(e.ends_at, e.starts_at) > now()
    )
  );

create policy "Members cancel their own RSVPs"
  on public.event_rsvps for delete to authenticated
  using ((select auth.uid()) = user_id);

-- event_attendance
create policy "Members read their own attendance; officers read all"
  on public.event_attendance for select to authenticated
  using ((select auth.uid()) = user_id or (select private.has_role('officer')));

create policy "Officers record attendance"
  on public.event_attendance for insert to authenticated
  with check ((select private.has_role('officer')) and checked_in_by = (select auth.uid()));

create policy "Officers remove attendance"
  on public.event_attendance for delete to authenticated
  using ((select private.has_role('officer')));

-- activity
create policy "Members read their own activity; officers read all"
  on public.activity for select to authenticated
  using ((select auth.uid()) = user_id or (select private.has_role('officer')));

create policy "Officers award activity"
  on public.activity for insert to authenticated
  with check ((select private.has_role('officer')) and awarded_by = (select auth.uid()));

create policy "Officers remove activity"
  on public.activity for delete to authenticated
  using ((select private.has_role('officer')));

-- audit_log: readable by admins; written only by triggers and server code.
create policy "Admins read the audit log"
  on public.audit_log for select to authenticated
  using ((select private.has_role('admin')));
