-- Drop and recreate the function with fixed user_id reference
CREATE OR REPLACE FUNCTION join_workspace_with_code(
  code uuid,
  user_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  workspace_record workspaces%ROWTYPE;
  result json;
begin
  -- Start transaction
  begin
    -- Get workspace by join code
    SELECT * INTO workspace_record
    FROM workspaces
    WHERE join_code = code;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid join code';
    END IF;

    -- Check if user is already a member
    IF EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_record.id
      AND wm.user_id = join_workspace_with_code.user_id
    ) THEN
      RAISE EXCEPTION 'Already a member of this workspace';
    END IF;

    -- Add user as member with agent role
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (workspace_record.id, join_workspace_with_code.user_id, 'agent');

    -- Return workspace details
    SELECT json_build_object(
      'id', id,
      'name', name,
      'role', 'agent'
    ) INTO result
    FROM workspaces
    WHERE id = workspace_record.id;

    RETURN result;
  exception
    when others then
      RAISE EXCEPTION 'Failed to join workspace: %', SQLERRM;
  end;
end;
$$; 