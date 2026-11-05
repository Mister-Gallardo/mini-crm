create schema private;

alter default privileges in schema private revoke execute on functions from public;

create type public.user_role as enum ('manager', 'executor');
create type public.task_status as enum ('new', 'in_progress', 'in_review', 'accepted', 'rework');
create type public.transition_actor as enum ('manager', 'assignee');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 100),
  role public.user_role not null default 'executor',
  created_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  address text not null check (char_length(btrim(address)) between 1 and 300),
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  assignee_id uuid not null,
  author_id uuid not null default auth.uid(),
  status public.task_status not null default 'new',
  created_at timestamptz not null default now(),
  constraint tasks_site_id_fkey foreign key (site_id) references public.sites (id) on delete restrict,
  constraint tasks_assignee_id_fkey foreign key (assignee_id) references public.profiles (id),
  constraint tasks_author_id_fkey foreign key (author_id) references public.profiles (id)
);

create index tasks_site_id_idx on public.tasks (site_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_author_id_idx on public.tasks (author_id);

create table public.task_status_transitions (
  from_status public.task_status not null,
  to_status public.task_status not null,
  actor public.transition_actor not null,
  comment_required boolean not null default false,
  primary key (from_status, to_status)
);

insert into public.task_status_transitions (from_status, to_status, actor, comment_required)
values
  ('new', 'in_progress', 'assignee', false),
  ('in_progress', 'in_review', 'assignee', false),
  ('in_review', 'accepted', 'manager', false),
  ('in_review', 'rework', 'manager', true),
  ('rework', 'in_progress', 'assignee', false);

create table public.task_status_history (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.tasks (id) on delete cascade,
  from_status public.task_status,
  to_status public.task_status not null,
  comment text check (char_length(comment) <= 2000),
  changed_by uuid not null references public.profiles (id),
  changed_at timestamptz not null default now(),
  constraint task_status_history_transition_fkey
    foreign key (from_status, to_status) references public.task_status_transitions (from_status, to_status),
  constraint task_status_history_initial_status check (from_status is not null or to_status = 'new'),
  constraint task_status_history_rework_comment
    check (to_status <> 'rework' or coalesce(btrim(comment), '') <> '')
);

create index task_status_history_task_id_idx on public.task_status_history (task_id, id);
create index task_status_history_changed_by_idx on public.task_status_history (changed_by);
create index task_status_history_transition_idx on public.task_status_history (from_status, to_status);

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'executor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
