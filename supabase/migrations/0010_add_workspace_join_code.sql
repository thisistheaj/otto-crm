-- Add join_code to workspaces
ALTER TABLE workspaces
ADD COLUMN join_code UUID UNIQUE DEFAULT gen_random_uuid();

-- Update the create_workspace_with_admin function to include join_code in response
CREATE OR REPLACE FUNCTION create_workspace_with_admin(
  workspace_name text,
  user_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  new_workspace json;
  generated_slug text;
begin
  -- Generate a slug from the name
  generated_slug := lower(regexp_replace(workspace_name, '[^a-zA-Z0-9]+', '-', 'g'));
  generated_slug := generated_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
  
  -- Start transaction
  begin
    -- Create workspace
    insert into workspaces (name, slug, created_by)
    values (
      workspace_name,
      generated_slug,
      user_id
    )
    returning json_build_object(
      'id', id,
      'name', name,
      'slug', slug,
      'join_code', join_code,
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
  exception
    when others then
      raise exception 'Failed to create workspace: %', SQLERRM;
  end;
end;
$$;

-- Function to join workspace with code
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
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_record.id
      AND user_id = join_workspace_with_code.user_id
    ) THEN
      RAISE EXCEPTION 'Already a member of this workspace';
    END IF;

    -- Add user as member with agent role
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (workspace_record.id, user_id, 'agent');

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