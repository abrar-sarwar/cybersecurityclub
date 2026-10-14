-- Row level security, privilege and trigger tests for event management.
-- Run with: supabase test db
-- Everything happens inside one rolled-back transaction, so the local
-- database is unchanged afterwards. JWT claims are simulated with
-- request.jwt.claims exactly as PostgREST sets them.
begin;
select no_plan();

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'owner@example.com', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'editor@example.com', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'revoked@example.com', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'outsider@example.com', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'spare@example.com', '{}', '{}', now(), now());

insert into public.admin_users (user_id, email, role) values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com', 'owner'),
  ('22222222-2222-2222-2222-222222222222', 'editor@example.com', 'editor'),
  ('33333333-3333-3333-3333-333333333333', 'revoked@example.com', 'editor');
update public.admin_users set revoked_at = now() where user_id = '33333333-3333-3333-3333-333333333333';

insert into public.events (id, title, status, starts_at, ends_at, location, flyer_path, flyer_alt, flyer_width, flyer_height) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Published event', 'published', now() + interval '1 day', now() + interval '1 day 1 hour', 'Room 1',
    'aaaaaaaa-0000-0000-0000-000000000001/pub.webp', 'Published flyer', 800, 1000),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Draft event', 'draft', now() + interval '2 days', now() + interval '2 days 1 hour', 'Room 2',
    'aaaaaaaa-0000-0000-0000-000000000002/draft.webp', 'Draft flyer', 800, 1000),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Canceled event', 'canceled', now() + interval '3 days', now() + interval '3 days 1 hour', 'Room 3', null, null, null, null),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Trashed event', 'published', now() + interval '4 days', now() + interval '4 days 1 hour', 'Room 4', null, null, null, null),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Second draft', 'draft', now() + interval '5 days', now() + interval '5 days 1 hour', 'Room 5', null, null, null, null);
update public.events set deleted_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000004';

insert into storage.buckets (id, name, public) values ('secret', 'secret', false);
insert into storage.objects (bucket_id, name, metadata) values
  ('flyers', 'aaaaaaaa-0000-0000-0000-000000000001/pub.webp', '{}'),
  ('flyers', 'aaaaaaaa-0000-0000-0000-000000000002/draft.webp', '{}'),
  ('secret', 'hidden.webp', '{}');

-- ---------------------------------------------------------------------------
-- Triggers seen from the superuser (actor null: scripts and SQL console)
-- ---------------------------------------------------------------------------
select isnt((select published_at from public.events where id = 'aaaaaaaa-0000-0000-0000-000000000001'), null, 'inserting a published event stamps published_at');
select is((select published_at from public.events where id = 'aaaaaaaa-0000-0000-0000-000000000002'), null, 'a draft has no published_at');
select is((select version from public.events where id = 'aaaaaaaa-0000-0000-0000-000000000004'), 2, 'trashing bumped the version');
select is((select count(*)::int from public.audit_log where action = 'event.created_published' and event_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 1, 'creating a published event is audited');
select is((select count(*)::int from public.audit_log where action = 'event.trashed' and event_id = 'aaaaaaaa-0000-0000-0000-000000000004' and actor_id is null), 1, 'SQL console changes are audited with a null actor');
select is((select count(*)::int from public.audit_log where action = 'admin.invited'), 3, 'admin rows are audited on insert');
select is((select count(*)::int from public.audit_log where action = 'admin.revoked' and target_user_id = '33333333-3333-3333-3333-333333333333'), 1, 'revocation is audited');

-- Rate limiter: fixed window
select ok(public.hit_rate_limit('test:key', 2, 60), 'first hit allowed');
select ok(public.hit_rate_limit('test:key', 2, 60), 'second hit allowed');
select ok(not public.hit_rate_limit('test:key', 2, 60), 'third hit in the window refused');
select ok(not public.hit_rate_limit('', 2, 60), 'empty keys are refused');

-- ---------------------------------------------------------------------------
-- Privileges. Function ACLs are checked with has_function_privilege() rather than
-- by calling them: a function ACL denial from a SET ROLE'd superuser session
-- crashes the local Postgres image. Requests through the Data API fail cleanly.
-- ---------------------------------------------------------------------------
select ok(
  not has_function_privilege('anon', 'public.hit_rate_limit(text, integer, integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.hit_rate_limit(text, integer, integer)', 'execute')
  and has_function_privilege('service_role', 'public.hit_rate_limit(text, integer, integer)', 'execute'),
  'only the service role can call hit_rate_limit');
select ok(
  not has_function_privilege('anon', 'public.log_action(text, uuid, text, uuid, uuid, jsonb)', 'execute')
  and not has_function_privilege('authenticated', 'public.log_action(text, uuid, text, uuid, uuid, jsonb)', 'execute')
  and has_function_privilege('service_role', 'public.log_action(text, uuid, text, uuid, uuid, jsonb)', 'execute'),
  'only the service role can call log_action');
select ok(
  not has_table_privilege('anon', 'public.events', 'insert')
  and not has_table_privilege('anon', 'public.events', 'update')
  and not has_table_privilege('anon', 'public.events', 'delete')
  and not has_table_privilege('anon', 'public.admin_users', 'select')
  and not has_table_privilege('anon', 'public.audit_log', 'select'),
  'anonymous grants are read-only on events and nothing else');
select ok(
  not has_table_privilege('authenticated', 'public.audit_log', 'insert')
  and not has_table_privilege('authenticated', 'public.audit_log', 'update')
  and not has_table_privilege('authenticated', 'public.audit_log', 'delete'),
  'signed-in users have no write grants on the audit log');
select ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'anonymous visitors cannot reach the private schema');

-- ---------------------------------------------------------------------------
-- Anonymous visitors
-- ---------------------------------------------------------------------------
set local role anon;
select results_eq(
  $$ select title from public.events order by title $$,
  $$ values ('Canceled event'), ('Published event') $$,
  'anon sees published and canceled events, never drafts or trash');
select throws_ok($$ insert into public.events (title, starts_at, ends_at, location) values ('nope', now(), now() + interval '1 hour', 'r') $$, '42501', null, 'anon cannot insert events');
select throws_ok($$ update public.events set title = 'nope' $$, '42501', null, 'anon cannot update events');
select throws_ok($$ delete from public.events $$, '42501', null, 'anon cannot delete events');
select throws_ok($$ select * from public.admin_users $$, '42501', null, 'anon cannot read admin_users');
select throws_ok($$ select * from public.audit_log $$, '42501', null, 'anon cannot read the audit log');
select results_eq(
  $$ select name from storage.objects order by name $$,
  $$ values ('aaaaaaaa-0000-0000-0000-000000000001/pub.webp') $$,
  'anon can only see the flyer object of a published event');
select throws_ok($$ select private.is_active_admin() $$, '42501', null, 'anon cannot call private helpers');
reset role;

-- ---------------------------------------------------------------------------
-- Editor who signed in with a password only (aal1)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","email":"editor@example.com","aal":"aal1"}', true);
select is((select private.is_active_admin()), false, 'without a second factor an editor is not an active admin');
select is_empty($$ select id from public.events where status = 'draft' $$, 'without MFA an editor cannot see drafts');
select is_empty($$ update public.events set title = 'Hijack' where id = 'aaaaaaaa-0000-0000-0000-000000000001' returning id $$, 'without MFA an editor cannot update events');
select throws_ok($$ insert into public.events (title, starts_at, ends_at, location) values ('aal1 insert', now(), now() + interval '1 hour', 'r') $$, '42501', null, 'without MFA an editor cannot insert events');
select results_eq($$ select user_id from public.admin_users $$, $$ values ('22222222-2222-2222-2222-222222222222'::uuid) $$, 'an officer can always read their own admin row');
select is_empty($$ select id from public.audit_log $$, 'without MFA the audit log is hidden');
select throws_ok($$ insert into storage.objects (bucket_id, name, metadata) values ('flyers', 'x/aal1.webp', '{}') $$, '42501', null, 'without MFA an editor cannot upload');

-- ---------------------------------------------------------------------------
-- Editor with a verified second factor (aal2)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","email":"editor@example.com","aal":"aal2"}', true);
select is((select private.is_active_admin()), true, 'an editor with MFA is an active admin');
select is((select private.is_owner()), false, 'an editor is not an owner');
select is((select count(*)::int from public.events), 5, 'an active admin sees every event including drafts and trash');
select lives_ok($$ update public.events set title = 'Draft event, edited', version = 999 where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$, 'an editor can edit a draft');
select is((select version from public.events where id = 'aaaaaaaa-0000-0000-0000-000000000002'), 2, 'version increments by one and ignores the client value');
select is((select updated_by from public.events where id = 'aaaaaaaa-0000-0000-0000-000000000002'), '22222222-2222-2222-2222-222222222222'::uuid, 'updated_by is the signed-in officer');
select is((select count(*)::int from public.audit_log where action = 'event.updated' and event_id = 'aaaaaaaa-0000-0000-0000-000000000002' and actor_id = '22222222-2222-2222-2222-222222222222' and actor_email = 'editor@example.com'), 1, 'edits are audited with the actor');
select is((select details -> 'changed' from public.audit_log where action = 'event.updated' and event_id = 'aaaaaaaa-0000-0000-0000-000000000002'), '["title"]'::jsonb, 'the audit entry lists the changed columns');
select is_empty($$ update public.events set title = 'stale write' where id = 'aaaaaaaa-0000-0000-0000-000000000002' and version = 1 returning id $$, 'a stale version matches no row, so the conflicting write is refused');
select lives_ok($$ update public.events set status = 'published' where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$, 'an editor can publish');
select isnt((select published_at from public.events where id = 'aaaaaaaa-0000-0000-0000-000000000002'), null, 'publishing stamps published_at');
select is((select count(*)::int from public.audit_log where action = 'event.published' and event_id = 'aaaaaaaa-0000-0000-0000-000000000002'), 1, 'publishing is audited');
select lives_ok($$ update public.events set status = 'canceled' where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$, 'an editor can cancel');
select is((select count(*)::int from public.audit_log where action = 'event.canceled' and event_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 1, 'cancellation is audited');
select lives_ok($$ insert into public.events (title, starts_at, ends_at, location, created_by) values ('Editor made this', now() + interval '3 days', now() + interval '3 days 2 hours', 'Room 9', '11111111-1111-1111-1111-111111111111') $$, 'an editor can create events');
select is((select created_by from public.events where title = 'Editor made this'), '22222222-2222-2222-2222-222222222222'::uuid, 'created_by is the actor, whatever the client sent');
select lives_ok($$ update public.events set deleted_at = now() where title = 'Editor made this' $$, 'an editor can move an event to the trash');
select is((select deleted_by from public.events where title = 'Editor made this'), '22222222-2222-2222-2222-222222222222'::uuid, 'trashing records who did it');
select is_empty($$ delete from public.events where title = 'Editor made this' returning id $$, 'an editor cannot permanently delete');
select throws_ok($$ update public.events set id = 'aaaaaaaa-0000-0000-0000-00000000ffff' where title = 'Editor made this' $$, '23514', null, 'event ids cannot be changed');
select throws_ok($$ update public.events set registration_url = 'javascript:alert(1)' where id = 'aaaaaaaa-0000-0000-0000-000000000003' $$, '23514', null, 'the database refuses non-https links');
select throws_ok($$ update public.events set ends_at = starts_at - interval '1 hour' where id = 'aaaaaaaa-0000-0000-0000-000000000003' $$, '23514', null, 'the database refuses an end before the start');

-- privilege escalation attempts
select is_empty($$ update public.admin_users set role = 'owner' where user_id = '22222222-2222-2222-2222-222222222222' returning user_id $$, 'an editor cannot promote themselves');
select is((select role::text from public.admin_users where user_id = '22222222-2222-2222-2222-222222222222'), 'editor', 'the role is unchanged after the attempt');
select throws_ok($$ insert into public.admin_users (user_id, email, role) values ('44444444-4444-4444-4444-444444444444', 'outsider@example.com', 'owner') $$, '42501', null, 'an editor cannot add administrators');
select is_empty($$ update public.admin_users set revoked_at = now() where user_id = '11111111-1111-1111-1111-111111111111' returning user_id $$, 'an editor cannot revoke the owner');
select is_empty($$ delete from public.admin_users where user_id = '11111111-1111-1111-1111-111111111111' returning user_id $$, 'an editor cannot remove the owner');
select is((select count(*)::int from public.admin_users), 3, 'an active admin can read the roster');

-- audit log integrity
select throws_ok($$ insert into public.audit_log (action) values ('forged') $$, '42501', null, 'an editor cannot write the audit log');
select throws_ok($$ update public.audit_log set action = 'x' $$, '42501', null, 'an editor cannot alter the audit log');
select throws_ok($$ delete from public.audit_log $$, '42501', null, 'an editor cannot erase the audit log');
select ok((select count(*) from public.audit_log) > 0, 'an editor can read the audit log');

-- storage
select lives_ok($$ insert into storage.objects (bucket_id, name, metadata) values ('flyers', 'aaaaaaaa-0000-0000-0000-000000000005/new.webp', '{}') $$, 'an editor can upload a flyer object');
select is((select count(*)::int from storage.objects where bucket_id = 'flyers'), 3, 'an editor sees every flyer object including drafts');
select is_empty($$ select name from storage.objects where bucket_id = 'secret' $$, 'an editor cannot see other buckets');
select throws_ok($$ insert into storage.objects (bucket_id, name, metadata) values ('secret', 'leak.webp', '{}') $$, '42501', null, 'an editor cannot write to other buckets');
-- Storage forbids deleting objects with plain SQL (storage.protect_delete); removal goes through the Storage API,
-- which this policy governs. The integration tests exercise it over HTTP.
select ok(exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'flyers_admin_delete' and cmd = 'DELETE'), 'a delete policy for active admins exists on flyer objects');

-- ---------------------------------------------------------------------------
-- Revoked officer, even with MFA
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated","email":"revoked@example.com","aal":"aal2"}', true);
select is((select private.is_active_admin()), false, 'a revoked officer is not an active admin even with MFA');
select is_empty($$ select id from public.events where status = 'draft' $$, 'a revoked officer cannot see drafts');
select is_empty($$ update public.events set title = 'Revoked edit' where id = 'aaaaaaaa-0000-0000-0000-000000000003' returning id $$, 'a revoked officer cannot edit');
select throws_ok($$ insert into public.events (title, starts_at, ends_at, location) values ('r', now(), now() + interval '1 hour', 'x') $$, '42501', null, 'a revoked officer cannot create');
select throws_ok($$ insert into storage.objects (bucket_id, name, metadata) values ('flyers', 'x/revoked.webp', '{}') $$, '42501', null, 'a revoked officer cannot upload');
select results_eq($$ select user_id from public.admin_users $$, $$ values ('33333333-3333-3333-3333-333333333333'::uuid) $$, 'a revoked officer sees only their own row');
select is_empty($$ select id from public.audit_log $$, 'a revoked officer cannot read the audit log');

-- ---------------------------------------------------------------------------
-- Signed-in user who was never an officer
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated","email":"outsider@example.com","aal":"aal2"}', true);
select is((select private.is_active_admin()), false, 'a user without an admin row is not an admin');
select results_eq(
  $$ select title from public.events order by title $$,
  $$ values ('Canceled event'), ('Draft event, edited'), ('Published event') $$,
  'an outsider sees only public events');
select is_empty($$ select user_id from public.admin_users $$, 'an outsider sees no admin rows');
select is_empty($$ select id from public.audit_log $$, 'an outsider cannot read the audit log');
select throws_ok($$ insert into public.events (title, starts_at, ends_at, location) values ('o', now(), now() + interval '1 hour', 'x') $$, '42501', null, 'an outsider cannot create events');

-- ---------------------------------------------------------------------------
-- Owner with MFA
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","email":"owner@example.com","aal":"aal2"}', true);
select is((select private.is_owner()), true, 'an owner with MFA is an owner');
select lives_ok($$ insert into public.admin_users (user_id, email, role) values ('44444444-4444-4444-4444-444444444444', 'Outsider@Example.com ', 'editor') $$, 'an owner can add an editor');
select is((select email from public.admin_users where user_id = '44444444-4444-4444-4444-444444444444'), 'outsider@example.com', 'emails are normalised');
select is((select created_by from public.admin_users where user_id = '44444444-4444-4444-4444-444444444444'), '11111111-1111-1111-1111-111111111111'::uuid, 'invitations record the inviting owner');
select is((select count(*)::int from public.audit_log where action = 'admin.invited' and target_user_id = '44444444-4444-4444-4444-444444444444' and actor_id = '11111111-1111-1111-1111-111111111111'), 1, 'invitations are audited');
select lives_ok($$ update public.admin_users set role = 'owner' where user_id = '44444444-4444-4444-4444-444444444444' $$, 'an owner can promote an editor');
select is((select count(*)::int from public.audit_log where action = 'admin.role_changed' and target_user_id = '44444444-4444-4444-4444-444444444444'), 1, 'role changes are audited');
select lives_ok($$ update public.admin_users set revoked_at = now() where user_id = '22222222-2222-2222-2222-222222222222' $$, 'an owner can revoke an editor');
select is((select count(*)::int from public.audit_log where action = 'admin.revoked' and target_user_id = '22222222-2222-2222-2222-222222222222'), 1, 'revocations are audited');
select lives_ok($$ update public.admin_users set revoked_at = null where user_id = '22222222-2222-2222-2222-222222222222' $$, 'an owner can reinstate an editor');
select is((select count(*)::int from public.audit_log where action = 'admin.reinstated' and target_user_id = '22222222-2222-2222-2222-222222222222'), 1, 'reinstatement is audited');
select lives_ok($$ update public.admin_users set role = 'editor' where user_id = '44444444-4444-4444-4444-444444444444' $$, 'an owner can demote another owner while one remains');
select throws_ok($$ update public.admin_users set revoked_at = now() where user_id = '11111111-1111-1111-1111-111111111111' $$, '23514', null, 'the last active owner cannot be revoked');
select throws_ok($$ delete from public.admin_users where user_id = '11111111-1111-1111-1111-111111111111' $$, '23514', null, 'the last active owner cannot be removed');
select throws_ok($$ update public.admin_users set role = 'editor' where user_id = '11111111-1111-1111-1111-111111111111' $$, '23514', null, 'the last active owner cannot be demoted');
select throws_ok($$ update public.admin_users set user_id = '55555555-5555-5555-5555-555555555555' where user_id = '22222222-2222-2222-2222-222222222222' $$, '23514', null, 'admin rows cannot be reassigned to another user');
select is_empty($$ delete from public.events where id = 'aaaaaaaa-0000-0000-0000-000000000003' returning id $$, 'an owner cannot permanently delete an event that is not in the trash');
select lives_ok($$ delete from public.events where id = 'aaaaaaaa-0000-0000-0000-000000000004' $$, 'an owner can permanently delete a trashed event');
select is((select count(*)::int from public.events where id = 'aaaaaaaa-0000-0000-0000-000000000004'), 0, 'the purged event is gone');
select is((select count(*)::int from public.audit_log where action = 'event.purged' and event_id = 'aaaaaaaa-0000-0000-0000-000000000004' and actor_id = '11111111-1111-1111-1111-111111111111'), 1, 'purges are audited');
reset role;

select * from finish();
rollback;
