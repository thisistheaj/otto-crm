create or replace function create_workspace_with_admin(
  workspace_name text,
  user_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  new_workspace json;
begin
  -- Start transaction
  begin
    -- Create workspace
    insert into workspaces (name, created_by)
    values (workspace_name, user_id)
    returning json_build_object(
      'id', id,
      'name', name,
      'created_by', created_by
    ) into new_workspace;

    -- Add creator as admin
    insert into workspace_members (workspace_id, user_id, role)
    values (
      (new_workspace->>'id')::uuid,
      user_id,
      'admin'
    );

    return new_workspace;
  end;
end;
$$; 