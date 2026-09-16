-- Member portal schema.
--
-- Access control (grants, row level security, triggers and the admin
-- functions) lives in the next migration so the table shapes are easy to read.
-- Personal data is limited to what the portal needs: no student IDs,
-- birthdays or addresses.

create schema if not exists private;

create type public.member_role as enum ('member', 'officer', 'admin');
create type public.membership_status as enum ('active', 'suspended');
create type public.activity_type as enum ('workshop_attended', 'challenge_completed');

-- ---------------------------------------------------------------------------
-- Profiles: one row per auth user, created by a trigger on auth.users.
-- The sign-in identity (usually a personal Google account) lives in auth.users;
-- the GSU student address is only a verified attribute of the same account.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text
    check (full_name is null or char_length(btrim(full_name)) between 1 and 120),
  student_email text
    check (
      student_email is null
      or (
        student_email = lower(student_email)
        and char_length(student_email) <= 254
        and student_email ~ '^[a-z0-9._%+-]+@student\.gsu\.edu$'
      )
    ),
  student_email_verified_at timestamptz,
  grad_month smallint check (grad_month between 1 and 12),
  grad_year smallint check (grad_year between 2000 and 2100),
  major text check (major is null or char_length(btrim(major)) between 1 and 120),
  interests text[] not null default '{}'
    check (
      cardinality(interests) <= 6
      and interests <@ array[
        'osint', 'defensive_security', 'ethical_hacking', 'ctfs', 'cloud_security', 'forensics'
      ]::text[]
    ),
  notify_events boolean not null default false,
  role public.member_role not null default 'member',
  membership_status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_verified_requires_email
    check (student_email_verified_at is null or student_email is not null)
);

comment on table public.profiles is 'Club member profile. Members may edit only full_name, grad_month, grad_year, major, interests and notify_events.';

-- A student address can be verified by one account at a time.
create unique index profiles_verified_student_email_key
  on public.profiles (student_email)
  where student_email_verified_at is not null;

create index profiles_staff_idx on public.profiles (role) where role <> 'member';

-- ---------------------------------------------------------------------------
-- Student email verification: hashed, single-use tokens that expire in 24h.
-- Only server code (secret key) reads or writes this table.
-- ---------------------------------------------------------------------------
create table public.student_email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- The address the link was sent to. Verification only succeeds while the
  -- profile still holds this address.
  email text not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index student_email_verifications_user_idx
  on public.student_email_verifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Events, RSVPs and attendance
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 5000),
  location text not null default '' check (char_length(location) <= 200),
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or ends_at > starts_at)
);

create index events_starts_at_idx on public.events (starts_at);
create index events_created_by_idx on public.events (created_by);

create table public.event_rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index event_rsvps_user_idx on public.event_rsvps (user_id);

create table public.event_attendance (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  checked_in_by uuid references public.profiles (id) on delete set null,
  checked_in_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index event_attendance_user_idx on public.event_attendance (user_id);
create index event_attendance_checked_in_by_idx on public.event_attendance (checked_in_by);

-- ---------------------------------------------------------------------------
-- Activity: awarded by officers. Powers the member progress graph later
-- (practice range challenges will add rows of type challenge_completed).
-- ---------------------------------------------------------------------------
create table public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.activity_type not null,
  -- Event id for workshops, challenge identifier for challenges.
  reference_id text check (reference_id is null or char_length(reference_id) between 1 and 200),
  awarded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index activity_once_per_reference_key
  on public.activity (user_id, type, reference_id)
  where reference_id is not null;
create index activity_user_created_idx on public.activity (user_id, created_at desc);
create index activity_awarded_by_idx on public.activity (awarded_by);

-- ---------------------------------------------------------------------------
-- Audit log: append-only record of role, membership and other staff actions.
-- Ids are stored without foreign keys so entries survive account deletion.
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null check (char_length(action) between 1 and 80),
  target_user_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_target_idx on public.audit_log (target_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Rate limiting for verification emails, sign-in links and staff actions.
-- Subjects are keyed hashes of a user id or IP address, never raw values.
-- Kept in the unexposed private schema; reached only through
-- public.hit_rate_limit(), which only the server's secret key may call.
-- ---------------------------------------------------------------------------
create table private.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  subject text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_hits_lookup_idx on private.rate_limit_hits (bucket, subject, created_at);
create index rate_limit_hits_cleanup_idx on private.rate_limit_hits (bucket, created_at);
