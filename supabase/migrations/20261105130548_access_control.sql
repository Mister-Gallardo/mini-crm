create function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'manager'
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_manager() to authenticated;

revoke all on table
  public.profiles,
  public.sites,
  public.tasks,
  public.task_status_transitions,
  public.task_status_history
from anon, authenticated;

revoke all on sequence public.task_status_history_id_seq from anon, authenticated;

grant select on table public.profiles, public.task_status_transitions, public.task_status_history
to authenticated;

grant select, delete on table public.sites, public.tasks to authenticated;
grant insert (name, address), update (name, address) on table public.sites to authenticated;
grant insert (site_id, title, description, assignee_id), update (site_id, title, description, assignee_id)
on table public.tasks to authenticated;

alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.tasks enable row level security;
alter table public.task_status_transitions enable row level security;
alter table public.task_status_history enable row level security;

create policy "staff can read profiles" on public.profiles
  for select to authenticated
  using (true);

create policy "staff can read transitions" on public.task_status_transitions
  for select to authenticated
  using (true);

create policy "managers see all sites, executors see sites with their tasks" on public.sites
  for select to authenticated
  using (
    (select private.is_manager())
    or exists (
      select 1
      from public.tasks
      where tasks.site_id = sites.id and tasks.assignee_id = (select auth.uid())
    )
  );

create policy "managers create sites" on public.sites
  for insert to authenticated
  with check ((select private.is_manager()));

create policy "managers update sites" on public.sites
  for update to authenticated
  using ((select private.is_manager()))
  with check ((select private.is_manager()));

create policy "managers delete sites" on public.sites
  for delete to authenticated
  using ((select private.is_manager()));

create policy "managers see all tasks, executors see assigned" on public.tasks
  for select to authenticated
  using ((select private.is_manager()) or assignee_id = (select auth.uid()));

create policy "managers create tasks" on public.tasks
  for insert to authenticated
  with check ((select private.is_manager()));

create policy "managers update tasks" on public.tasks
  for update to authenticated
  using ((select private.is_manager()))
  with check ((select private.is_manager()));

create policy "managers delete tasks" on public.tasks
  for delete to authenticated
  using ((select private.is_manager()));

create policy "history is visible with its task" on public.task_status_history
  for select to authenticated
  using (exists (select 1 from public.tasks where tasks.id = task_status_history.task_id));
