import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database';

export type Workspace = Database['public']['Tables']['workspaces']['Row'];
export type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert'];
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'];

export type WorkspaceMembershipWithWorkspace = {
  workspace_id: string;
  role: 'admin' | 'agent';
  workspaces: {
    id: string;
    name: string;
    slug: string;
  };
};

export async function getWorkspaces(supabase: SupabaseClient<Database>, userId: string) {
  const { data: memberships, error } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      role,
      workspaces (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return memberships as WorkspaceMembershipWithWorkspace[];
}

export async function createWorkspace(
  supabase: SupabaseClient<Database>,
  userId: string,
  workspace: WorkspaceInsert
) {
  const { data: newWorkspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert(workspace)
    .select()
    .single();

  if (workspaceError) throw workspaceError;

  // Add creator as admin
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      user_id: userId,
      workspace_id: newWorkspace.id,
      role: 'admin',
    });

  if (memberError) throw memberError;
  return newWorkspace;
}

export async function getWorkspace(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string
) {
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner (
        role
      )
    `)
    .eq('id', workspaceId)
    .eq('workspace_members.user_id', userId)
    .single();

  if (error) throw error;
  return workspace;
} 