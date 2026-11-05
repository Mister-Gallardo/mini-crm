begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

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

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'manager@test.local', '{"full_name": "Manager"}'),
  ('22222222-2222-4222-8222-222222222222', 'manager2@test.local', '{"full_name": "Second Manager"}'),
  ('33333333-3333-4333-8333-333333333333', 'executor1@test.local', '{"full_name": "Executor One"}'),
  ('44444444-4444-4444-8444-444444444444', 'executor2@test.local', '{"full_name": "Executor Two"}');

update public.profiles
set role = 'manager'
where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');

insert into public.sites (id, name, address)
values ('55555555-5555-4555-8555-555555555555', 'Site', 'Address');

insert into public.tasks (id, site_id, title, assignee_id, author_id)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '55555555-5555-4555-8555-555555555555',
  'Pour the foundation',
  '33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111'
);

select results_eq(
  $$ select coalesce(from_status::text, '-') || ' > ' || to_status::text
     from public.task_status_history
     where task_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  array['- > new'],
  'task creation is recorded in history'
);

select pg_temp.sign_in('executor2@test.local');

select is_empty(
  $$ select * from public.get_task_transitions('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') $$,
  'other executor has no actions on the task'
);
select throws_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'in_progress') $$,
  'P0001', 'task_not_found', 'other executor cannot change the task'
);

reset role;
select pg_temp.sign_in('manager@test.local');

select is_empty(
  $$ select * from public.get_task_transitions('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') $$,
  'manager has no actions on a new task'
);
select throws_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'in_progress') $$,
  'P0001', 'transition_not_allowed', 'manager cannot start the work'
);

reset role;
select pg_temp.sign_in('executor1@test.local');

select results_eq(
  $$ select to_status::text from public.get_task_transitions('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') $$,
  array['in_progress'],
  'assignee can start the work'
);
select throws_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'in_review') $$,
  'P0001', 'transition_not_allowed', 'new task cannot skip the work'
);
select lives_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'in_progress') $$,
  'assignee takes the task'
);
select lives_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'in_review') $$,
  'assignee sends the task for review'
);
select throws_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'accepted') $$,
  'P0001', 'transition_not_allowed', 'assignee cannot accept his own task'
);

reset role;
select pg_temp.sign_in('manager@test.local');

select results_eq(
  $$ select to_status::text || ':' || comment_required
     from public.get_task_transitions('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') $$,
  array['accepted:false', 'rework:true'],
  'manager can accept or return a task under review'
);
select throws_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'rework') $$,
  'P0001', 'comment_required', 'returning for rework requires a comment'
);
select throws_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'rework', '   ') $$,
  'P0001', 'comment_required', 'blank comment is rejected'
);
select lives_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'rework', 'Fix the cracks') $$,
  'manager returns the task for rework'
);

reset role;
select pg_temp.sign_in('executor1@test.local');

select lives_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'in_progress') $$,
  'assignee resumes the work'
);
select lives_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'in_review') $$,
  'assignee sends the task for review again'
);

reset role;
select pg_temp.sign_in('manager2@test.local');

select lives_ok(
  $$ select public.change_task_status('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'accepted') $$,
  'any manager can accept the task'
);
select is_empty(
  $$ select * from public.get_task_transitions('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') $$,
  'accepted task has no further actions'
);

reset role;

select results_eq(
  $$ select coalesce(from_status::text, '-') || ' > ' || to_status::text || coalesce(' (' || comment || ')', '')
     from public.task_status_history
     where task_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     order by id $$,
  array[
    '- > new',
    'new > in_progress',
    'in_progress > in_review',
    'in_review > rework (Fix the cracks)',
    'rework > in_progress',
    'in_progress > in_review',
    'in_review > accepted'
  ],
  'history keeps every transition with its comment'
);
select results_eq(
  $$ select p.full_name
     from public.task_status_history as h
     join public.profiles as p on p.id = h.changed_by
     where h.task_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     order by h.id $$,
  array['Manager', 'Executor One', 'Executor One', 'Manager', 'Executor One', 'Executor One', 'Second Manager'],
  'history records who changed the status'
);
select throws_ok(
  $$ insert into public.task_status_history (task_id, from_status, to_status, changed_by)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'in_review', 'rework', '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'history rejects rework without a comment even for privileged roles'
);
select throws_ok(
  $$ insert into public.task_status_history (task_id, from_status, to_status, changed_by)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'new', 'accepted', '11111111-1111-4111-8111-111111111111') $$,
  '23503', null, 'history accepts only transitions from the rules table'
);

select pg_temp.sign_in('manager@test.local');

select lives_ok(
  $$ delete from public.tasks where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'manager deletes the task'
);

reset role;

select is(
  (select count(*)::int from public.task_status_history where task_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0,
  'history is removed together with its task'
);

select * from finish();

rollback;
