-- GoTrue writes app_metadata after inserting the user, so the trigger cannot read the role from it.
-- Every new user starts as an executor; managers are promoted by an administrator in public.profiles.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  );

  return new;
end;
$$;
