-- Create publication if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Enable real-time for messages table
alter publication supabase_realtime add table messages;

-- Enable row level security for messages table
alter table messages enable row level security;

-- Create policy to allow reading messages if you have access to the workspace
create policy "Allow reading messages if you have access to the workspace"
  on messages
  for select
  using (
    exists (
      select 1 from tickets t
      join workspaces w on w.id = t.workspace_id
      where t.chat_room_id = messages.room_id
    )
  );

-- Create policy to allow inserting messages if you have access to the workspace
create policy "Allow inserting messages if you have access to the workspace"
  on messages
  for insert
  with check (
    exists (
      select 1 from tickets t
      join workspaces w on w.id = t.workspace_id
      where t.chat_room_id = messages.room_id
    )
  ); 