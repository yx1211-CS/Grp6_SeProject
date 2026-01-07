create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.account (accountID, email, username, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'username',
    'User' 
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();