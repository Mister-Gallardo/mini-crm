create function private.ensure_assignee_is_executor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = new.assignee_id and role = 'executor'
  ) then
    raise exception 'assignee_must_be_executor';
  end if;

  return new;
end;
$$;

create trigger tasks_assignee_is_executor
  before insert or update of assignee_id on public.tasks
  for each row execute function private.ensure_assignee_is_executor();

create function private.log_task_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_status_history (task_id, to_status, changed_by)
  values (new.id, new.status, new.author_id);

  return null;
end;
$$;

create trigger tasks_log_created
  after insert on public.tasks
  for each row execute function private.log_task_created();

create function private.allowed_transitions(task public.tasks)
returns setof public.task_status_transitions
language sql
stable
set search_path = ''
as $$
  select rule.*
  from public.task_status_transitions as rule
  where rule.from_status = task.status
    and case rule.actor
      when 'manager' then (select private.is_manager())
      when 'assignee' then task.assignee_id = (select auth.uid())
    end;
$$;

grant execute on function private.allowed_transitions(public.tasks) to authenticated;

create function public.get_task_transitions(task_id uuid)
returns table (to_status public.task_status, comment_required boolean)
language sql
stable
set search_path = ''
as $$
  select allowed.to_status, allowed.comment_required
  from public.tasks as task
  cross join lateral private.allowed_transitions(task) as allowed
  where task.id = get_task_transitions.task_id
  order by allowed.to_status;
$$;

create function public.change_task_status(
  task_id uuid,
  next_status public.task_status,
  comment text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_task public.tasks;
  transition_rule public.task_status_transitions;
  clean_comment text := nullif(btrim(comment), '');
begin
  select *
  into current_task
  from public.tasks
  where id = change_task_status.task_id
  for update;

  if not found
    or not coalesce((select private.is_manager()) or current_task.assignee_id = (select auth.uid()), false)
  then
    raise exception 'task_not_found';
  end if;

  select *
  into transition_rule
  from private.allowed_transitions(current_task)
  where to_status = next_status;

  if not found then
    raise exception 'transition_not_allowed';
  end if;

  if transition_rule.comment_required and clean_comment is null then
    raise exception 'comment_required';
  end if;

  update public.tasks
  set status = next_status
  where id = current_task.id;

  insert into public.task_status_history (task_id, from_status, to_status, comment, changed_by)
  values (current_task.id, current_task.status, next_status, clean_comment, (select auth.uid()));
end;
$$;

revoke execute on function public.get_task_transitions(uuid) from public, anon;
revoke execute on function public.change_task_status(uuid, public.task_status, text) from public, anon;
grant execute on function public.get_task_transitions(uuid) to authenticated;
grant execute on function public.change_task_status(uuid, public.task_status, text) to authenticated;
