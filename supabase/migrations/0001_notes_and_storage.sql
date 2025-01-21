-- Create notes table
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  title text not null,
  content text not null
);

-- Set up RLS (Row Level Security)
alter table notes enable row level security;

-- Create policy to allow users to only see their own notes
create policy "Users can only see their own notes" on notes
  for all using (auth.uid() = user_id);

-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name)
values ('user-files', 'user-files')
on conflict do nothing;

-- Set up storage policy
create policy "Users can only access their own folder" on storage.objects
  for all using (auth.uid()::text = (storage.foldername(name))[1]); 