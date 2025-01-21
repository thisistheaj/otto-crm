-- Add foreign key constraint to workspace_members
ALTER TABLE workspace_members
ADD CONSTRAINT fk_workspace_members_workspace
FOREIGN KEY (workspace_id)
REFERENCES workspaces(id)
ON DELETE CASCADE;

-- Add foreign key constraint to workspace_members for user_id
ALTER TABLE workspace_members
ADD CONSTRAINT fk_workspace_members_user
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view workspaces they are members of" ON workspaces
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their workspace memberships" ON workspace_members
    FOR SELECT
    USING (user_id = auth.uid());

-- First member becomes admin, subsequent members need admin approval
CREATE POLICY "First member becomes admin or needs admin approval" ON workspace_members
    FOR INSERT
    WITH CHECK (
        (
            -- If this is the first member of the workspace
            NOT EXISTS (
                SELECT 1 FROM workspace_members
                WHERE workspace_id = workspace_members.workspace_id
            )
        )
        OR
        (
            -- Or if the current user is an admin of the workspace
            EXISTS (
                SELECT 1 FROM workspace_members
                WHERE workspace_id = workspace_members.workspace_id
                AND user_id = auth.uid()
                AND role = 'admin'
            )
        )
    ); 