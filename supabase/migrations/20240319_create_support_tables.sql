create table tickets (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) not null,
  subject text not null,
  description text not null,
  email text not null,
  status text not null default 'new',
  priority text not null default 'medium',
  chat_room_id uuid,
  created_at timestamp with time zone default now() not null
);

create table chat_rooms (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) not null,
  status text not null default 'open',
  created_at timestamp with time zone default now() not null
);

-- Add foreign key constraint after chat_rooms table exists
alter table tickets 
  add constraint tickets_chat_room_id_fkey 
  foreign key (chat_room_id) 
  references chat_rooms(id);

create table messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references chat_rooms(id) not null,
  content text not null,
  sender_type text not null check (sender_type in ('customer', 'agent')),
  created_at timestamp with time zone default now() not null
); 