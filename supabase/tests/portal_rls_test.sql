-- Row level security and privilege tests for the member portal.
-- Run with: supabase test db
begin;
select plan(56);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres). The auth.users trigger creates each profile.
-- ---------------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'member.a@gmail.com', '{"full_name":"Member A"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'member.b@gmail.com', '{"name":"Member B"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'officer@gmail.com', '{"full_name":"Officer O"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'admin@gmail.com', '{"full_name":"Admin Z","role":"admin"}', '{"role":"admin"}', now(), now());

select is(
  (select count(*)::int from public.profiles where role = 'member'),
  4,
  'new users always start as members, whatever their metadata says'
);
select is(
  (select full_name from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  'Member B',
  'full name is prefilled from provider metadata'
);

update public.profiles set role = 'officer' where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set role = 'admin' where id = '44444444-4444-4444-4444-444444444444';
update public.profiles
   set student_email = 'mbee1@student.gsu.edu', student_email_verified_at = now()
 where id = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*)::int from public.audit_log where action = 'member.role_changed' and actor_id is null),
  2,
  'seeding roles from SQL is written to the audit log'
);

insert into public.events (id, title, starts_at, ends_at, location)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Intro to CTFs', now() + interval '2 days', now() + interval '2 days 2 hours', 'Langdale 1010');

-- ---------------------------------------------------------------------------
-- Function privileges. Checked with has_function_privilege() rather than by
-- calling as the API roles: in the local image, a superuser psql session that
-- SET ROLEs and then hits a function ACL denial crashes the backend. Requests
-- through the Data API fail cleanly with 42501 (covered by the integration test).
-- ---------------------------------------------------------------------------
select ok(
  not has_function_privilege('authenticated', 'public.request_student_email_verification(uuid, text, text, timestamptz)', 'execute')
  and not has_function_privilege('anon', 'public.request_student_email_verification(uuid, text, text, timestamptz)', 'execute'),
  'API roles cannot issue verification tokens'
);
select ok(
  not has_function_privilege('authenticated', 'public.consume_student_email_token(text, uuid)', 'execute')
  and not has_function_privilege('anon', 'public.consume_student_email_token(text, uuid)', 'execute'),
  'API roles cannot consume verification tokens directly'
);
select ok(
  not has_function_privilege('authenticated', 'public.hit_rate_limit(text, text, integer, integer)', 'execute')
  and not has_function_privilege('anon', 'public.hit_rate_limit(text, text, integer, integer)', 'execute'),
  'API roles cannot touch rate limits'
);
select ok(
  has_function_privilege('service_role', 'public.request_student_email_verification(uuid, text, text, timestamptz)', 'execute')
  and has_function_privilege('service_role', 'public.consume_student_email_token(text, uuid)', 'execute')
  and has_function_privilege('service_role', 'public.hit_rate_limit(text, text, integer, integer)', 'execute'),
  'the server role can run the server-only functions'
);
select ok(
  not has_function_privilege('anon', 'public.set_member_role(uuid, public.member_role)', 'execute')
  and not has_function_privilege('anon', 'public.check_in_member(uuid, uuid)', 'execute'),
  'anonymous visitors cannot call staff functions'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'insert')
  and not has_column_privilege('authenticated', 'public.profiles', 'role', 'update')
  and not has_column_privilege('authenticated', 'public.profiles', 'student_email_verified_at', 'update')
  and has_column_privilege('authenticated', 'public.profiles', 'notify_events', 'update'),
  'profile column grants allow only the member-editable fields'
);

-- ---------------------------------------------------------------------------
-- Anonymous visitors
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok($$ select * from public.profiles $$, '42501', null, 'anon cannot read profiles');
select throws_ok($$ select * from public.events $$, '42501', null, 'anon cannot read events');
select throws_ok($$ select * from public.audit_log $$, '42501', null, 'anon cannot read the audit log');
reset role;

-- ---------------------------------------------------------------------------
-- Member A: signed in, student email not verified
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select results_eq(
  $$ select id from public.profiles $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'a member can read only their own profile'
);
select is_empty(
  $$ select id from public.profiles where id = '22222222-2222-2222-2222-222222222222' $$,
  'a member cannot read another member''s profile'
);
select lives_ok(
  $$ update public.profiles
        set full_name = 'Member Alpha', grad_month = 5, grad_year = 2028, major = 'Computer Science',
            interests = array['ctfs', 'osint'], notify_events = true
      where id = '11111111-1111-1111-1111-111111111111' $$,
  'a member can update the editable profile fields'
);
select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'a member cannot change their own role'
);
select throws_ok(
  $$ update public.profiles set membership_status = 'active' where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'a member cannot change their membership status'
);
select throws_ok(
  $$ update public.profiles set student_email_verified_at = now() where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'a member cannot mark their student email as verified'
);
select throws_ok(
  $$ update public.profiles set student_email = 'someone@student.gsu.edu' where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'a member cannot set their student email directly'
);
select is_empty(
  $$ update public.profiles set full_name = 'Hijacked' where id = '22222222-2222-2222-2222-222222222222' returning id $$,
  'a member cannot update another member''s profile'
);
select throws_ok(
  $$ update public.profiles set interests = array['lockpicking'] where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'interests are limited to the published list'
);
select throws_ok(
  $$ insert into public.profiles (id) values (gen_random_uuid()) $$,
  '42501', null, 'a member cannot create profiles'
);
select throws_ok(
  $$ insert into public.activity (user_id, type, awarded_by)
     values ('11111111-1111-1111-1111-111111111111', 'challenge_completed', '11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'a member cannot award themselves activity'
);
select is_empty($$ select id from public.audit_log $$, 'a member cannot read the audit log');
select throws_ok(
  $$ select * from public.student_email_verifications $$,
  '42501', null, 'a member cannot read verification tokens'
);
select throws_ok(
  $$ select public.set_member_role('11111111-1111-1111-1111-111111111111', 'admin') $$,
  '42501', 'Only admins can change roles', 'a member cannot call the role change function'
);
select is(
  (select count(*)::int from public.events),
  1,
  'a member can read events'
);
select throws_ok(
  $$ insert into public.events (title, starts_at, created_by)
     values ('Fake event', now() + interval '1 day', '11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'a member cannot create events'
);
select throws_ok(
  $$ insert into public.event_rsvps (event_id, user_id)
     values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'an unverified member cannot RSVP'
);
reset role;

-- ---------------------------------------------------------------------------
-- Member B: verified student email
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select lives_ok(
  $$ insert into public.event_rsvps (event_id, user_id)
     values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222') $$,
  'a verified member can RSVP'
);
select throws_ok(
  $$ insert into public.event_rsvps (event_id, user_id)
     values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'a member cannot RSVP on someone else''s behalf'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is_empty($$ select * from public.event_rsvps $$, 'a member cannot see other members'' RSVPs');
reset role;

-- ---------------------------------------------------------------------------
-- Officer
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.profiles),
  4,
  'an officer can read member profiles'
);
select is(
  (select count(*)::int from public.event_rsvps),
  1,
  'an officer can read RSVPs'
);
select lives_ok(
  $$ insert into public.events (title, starts_at, created_by)
     values ('Blue team workshop', now() + interval '5 days', '33333333-3333-3333-3333-333333333333') $$,
  'an officer can create events'
);
select throws_ok(
  $$ insert into public.events (title, starts_at, created_by)
     values ('Spoofed creator', now() + interval '5 days', '44444444-4444-4444-4444-444444444444') $$,
  '42501', null, 'an officer cannot create events as someone else'
);
select lives_ok(
  $$ select public.check_in_member('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222') $$,
  'an officer can check a member in'
);
select is(
  (select count(*)::int from public.activity
    where user_id = '22222222-2222-2222-2222-222222222222' and type = 'workshop_attended'),
  1,
  'check-in awards workshop activity'
);
select throws_ok(
  $$ select public.set_member_role('22222222-2222-2222-2222-222222222222', 'officer') $$,
  '42501', 'Only admins can change roles', 'an officer cannot change roles'
);
select is_empty($$ select id from public.audit_log $$, 'an officer cannot read the audit log');
select is_empty(
  $$ delete from public.events returning id $$,
  'an officer cannot delete events'
);
reset role;

-- ---------------------------------------------------------------------------
-- Member B reads their own activity; Member A cannot
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is_empty($$ select id from public.activity $$, 'a member cannot read another member''s activity');
reset role;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);

select lives_ok(
  $$ select public.set_member_role('22222222-2222-2222-2222-222222222222', 'officer') $$,
  'an admin can change a member''s role'
);
select results_eq(
  $$ select actor_id, details ->> 'from', details ->> 'to' from public.audit_log
      where action = 'member.role_changed' and target_user_id = '22222222-2222-2222-2222-222222222222' $$,
  $$ values ('44444444-4444-4444-4444-444444444444'::uuid, 'member', 'officer') $$,
  'the role change is written to the audit log with the admin as actor'
);
select lives_ok(
  $$ select public.set_membership_status('33333333-3333-3333-3333-333333333333', 'suspended') $$,
  'an admin can suspend a member'
);
select throws_ok(
  $$ select public.set_member_role('44444444-4444-4444-4444-444444444444', 'member') $$,
  '42501', 'Admins cannot remove their own admin role', 'an admin cannot demote themselves'
);
select lives_ok(
  $$ delete from public.events where title = 'Blue team workshop' $$,
  'an admin can delete events'
);
select results_eq(
  $$ select actor_id, details ->> 'title' from public.audit_log where action = 'event.deleted' $$,
  $$ values ('44444444-4444-4444-4444-444444444444'::uuid, 'Blue team workshop') $$,
  'event deletion is written to the audit log with the admin as actor'
);
select ok(
  (select count(*) from public.audit_log) >= 5,
  'an admin can read the audit log'
);
select throws_ok(
  $$ delete from public.audit_log $$,
  '42501', null, 'nobody can delete audit log entries through the API'
);
reset role;

-- A suspended officer loses officer access.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select results_eq(
  $$ select id from public.profiles $$,
  $$ values ('33333333-3333-3333-3333-333333333333'::uuid) $$,
  'a suspended officer can only read their own profile'
);
reset role;

-- ---------------------------------------------------------------------------
-- Student email verification (server only, secret key)
-- ---------------------------------------------------------------------------
set local role service_role;

select lives_ok(
  $$ select public.request_student_email_verification(
       '11111111-1111-1111-1111-111111111111', 'malpha1@student.gsu.edu', repeat('b', 64), now() + interval '24 hours') $$,
  'the server can issue a verification token'
);
select results_eq(
  $$ select result from public.consume_student_email_token(repeat('b', 64), '22222222-2222-2222-2222-222222222222') $$,
  $$ values ('wrong_account') $$,
  'a token cannot verify a different signed-in account'
);
select is(
  (select student_email_verified_at from public.profiles where id = '22222222-2222-2222-2222-222222222222') is not null
  and (select student_email from public.profiles where id = '22222222-2222-2222-2222-222222222222') = 'mbee1@student.gsu.edu',
  true,
  'the wrong account keeps its own student email'
);
select results_eq(
  $$ select result from public.consume_student_email_token(repeat('b', 64), '11111111-1111-1111-1111-111111111111') $$,
  $$ values ('verified') $$,
  'the token verifies the account that requested it'
);
select results_eq(
  $$ select result from public.consume_student_email_token(repeat('b', 64), '11111111-1111-1111-1111-111111111111') $$,
  $$ values ('invalid') $$,
  'a token cannot be used twice'
);
reset role;

select * from finish();
rollback;
