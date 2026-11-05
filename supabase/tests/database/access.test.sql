begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

create function pg_temp.sign_in(email text)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u.id, 'role', 'authenticated')::text, true)
  from auth.users as u
  where u.email = sign_in.email;

  perform set_config('role', 'authenticated', true);
end;
$$;

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'manager@test.local', '{"role": "manager"}', '{"full_name": "Manager"}'),
  ('33333333-3333-4333-8333-333333333333', 'executor1@test.local', '{}', '{"full_name": "Executor One"}'),
  ('44444444-4444-4444-8444-444444444444', 'executor2@test.local', '{}', '{"full_name": "Executor Two"}');

select results_eq(
  $$ select role::text from public.profiles
     where id in ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333',
       '44444444-4444-4444-8444-444444444444')
     order by full_name $$,
  array['executor', 'executor', 'executor'],
  'new users get the executor role, metadata does not grant roles'
);

update public.profiles set role = 'manager' where id = '11111111-1111-4111-8111-111111111111';

insert into public.sites (id, name, address)
values
  ('55555555-5555-4555-8555-555555555555', 'Site One', 'Address 1'),
  ('66666666-6666-4666-8666-666666666666', 'Site Two', 'Address 2'),
  ('77777777-7777-4777-8777-777777777777', 'Empty Site', 'Address 3');

insert into public.tasks (id, site_id, title, assignee_id, author_id)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '55555555-5555-4555-8555-555555555555', 'Task of executor one',
    '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '66666666-6666-4666-8666-666666666666', 'Task of executor two',
    '44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111');

set local role anon;

select throws_ok($$ select * from public.tasks $$, '42501', null, 'anon cannot read tasks');
select throws_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'in_progress') $$,
  '42501', null, 'anon cannot change statuses'
);

reset role;
select pg_temp.sign_in('executor1@test.local');

select results_eq(
  $$ select id from public.tasks $$,
  array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid],
  'executor sees only assigned tasks'
);
select results_eq(
  $$ select id from public.sites $$,
  array['55555555-5555-4555-8555-555555555555'::uuid],
  'executor sees only sites where he has tasks'
);
select results_eq(
  $$ select distinct task_id from public.task_status_history $$,
  array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid],
  'executor sees history of assigned tasks only'
);
select lives_ok(
  $$ update public.tasks set title = 'Hacked' $$,
  'executor update of tasks is filtered out by RLS'
);
select lives_ok($$ delete from public.tasks $$, 'executor delete of tasks is filtered out by RLS');
select throws_ok(
  $$ update public.tasks set status = 'accepted' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '42501', null, 'executor cannot change status directly'
);
select throws_ok(
  $$ insert into public.tasks (site_id, title, assignee_id)
     values ('55555555-5555-4555-8555-555555555555', 'New', '33333333-3333-4333-8333-333333333333') $$,
  '42501', null, 'executor cannot create tasks'
);
select throws_ok(
  $$ insert into public.sites (name, address) values ('Site', 'Address') $$,
  '42501', null, 'executor cannot create sites'
);
select throws_ok($$ update public.profiles set role = 'manager' $$, '42501', null, 'executor cannot change roles');
select throws_ok(
  $$ insert into public.task_status_history (task_id, from_status, to_status, changed_by)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'in_review', 'accepted', '33333333-3333-4333-8333-333333333333') $$,
  '42501', null, 'executor cannot write history'
);
select throws_ok($$ delete from public.task_status_history $$, '42501', null, 'executor cannot delete history');

reset role;

select is(
  (select title from public.tasks where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'Task of executor one',
  'executor update left the task unchanged'
);
select is(
  (select count(*)::int from public.tasks
   where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')),
  2,
  'executor delete left tasks in place'
);

select pg_temp.sign_in('manager@test.local');

select results_eq(
  $$ select count(*)::int from public.tasks
     where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') $$,
  array[2],
  'manager sees all tasks'
);
select results_eq(
  $$ select count(*)::int from public.sites
     where id in ('55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666',
       '77777777-7777-4777-8777-777777777777') $$,
  array[3],
  'manager sees all sites'
);
select lives_ok(
  $$ insert into public.tasks (site_id, title, assignee_id)
     values ('77777777-7777-4777-8777-777777777777', 'Fresh task', '44444444-4444-4444-8444-444444444444') $$,
  'manager creates tasks'
);
select throws_ok(
  $$ insert into public.tasks (site_id, title, assignee_id, status)
     values ('77777777-7777-4777-8777-777777777777', 'Sneaky', '44444444-4444-4444-8444-444444444444', 'accepted') $$,
  '42501', null, 'status cannot be set on insert'
);
select throws_ok(
  $$ insert into public.tasks (site_id, title, assignee_id, author_id)
     values ('77777777-7777-4777-8777-777777777777', 'Sneaky', '44444444-4444-4444-8444-444444444444',
       '33333333-3333-4333-8333-333333333333') $$,
  '42501', null, 'author cannot be spoofed'
);
select throws_ok(
  $$ insert into public.tasks (site_id, title, assignee_id)
     values ('77777777-7777-4777-8777-777777777777', 'For a manager', '11111111-1111-4111-8111-111111111111') $$,
  'P0001', 'assignee_must_be_executor', 'tasks are assigned to executors only'
);
select throws_ok($$ update public.tasks set status = 'accepted' $$, '42501', null, 'manager cannot change status directly');
select throws_ok(
  $$ update public.task_status_history set comment = 'Edited' $$,
  '42501', null, 'manager cannot edit history'
);
select throws_ok(
  $$ delete from public.sites where id = '55555555-5555-4555-8555-555555555555' $$,
  '23503', null, 'site with tasks cannot be deleted'
);

reset role;

select results_eq(
  $$ select t.author_id::text || ' ' || t.status::text || ' ' || h.to_status::text
     from public.tasks as t
     join public.task_status_history as h on h.task_id = t.id
     where t.title = 'Fresh task' $$,
  array['11111111-1111-4111-8111-111111111111 new new'],
  'new task gets the current manager as author, status new and a history record'
);

select * from finish();

rollback;
