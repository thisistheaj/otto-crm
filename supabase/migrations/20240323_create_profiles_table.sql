create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  availability_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
); 