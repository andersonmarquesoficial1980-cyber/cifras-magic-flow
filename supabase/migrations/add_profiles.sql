-- Tabela profiles vinculada ao auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text not null default 'free' check (role in ('free', 'premium', 'admin')),
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Admin pode ver todos
create policy "Admin can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Trigger para criar profile automaticamente no cadastro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'free');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
