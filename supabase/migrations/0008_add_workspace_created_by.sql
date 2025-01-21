-- Add created_by column to workspaces
ALTER TABLE workspaces
ADD COLUMN created_by UUID NOT NULL REFERENCES auth.users(id);

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS create_workspace_with_admin;

-- Create the stored procedure with proper error handling
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