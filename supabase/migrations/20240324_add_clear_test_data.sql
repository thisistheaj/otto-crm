-- Create a function to clear test data for a workspace
create or replace function clear_test_data(target_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  room_ids uuid[];
begin
  -- Get chat room IDs for the workspace
  select array_agg(t.chat_room_id)
  into room_ids
  from tickets t
  where t.workspace_id = target_id
  and t.chat_room_id is not null;

  -- Delete messages first
  if array_length(room_ids, 1) > 0 then
    delete from messages where room_id = any(room_ids);
  end if;

  -- Set chat_room_id to null in tickets to break circular dependency
  update tickets t
  set chat_room_id = null
  where t.workspace_id = target_id;

  -- Delete chat rooms
  delete from chat_rooms cr
  where cr.ticket_id in (
    select t.id from tickets t where t.workspace_id = target_id
  );

  -- Delete tickets
  delete from tickets t where t.workspace_id = target_id;

  -- Delete documents
  delete from documents d where d.workspace_id = target_id;

  -- Delete articles
  delete from articles a where a.workspace_id = target_id;
end;
$$; 