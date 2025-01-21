import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database';

export type Workspace = Database['public']['Tables']['workspaces']['Row'];
export type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert'];
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'];

export type WorkspaceMembershipWithWorkspace = Database["public"]["Tables"]["workspace_members"]["Row"] & {
  workspaces: Database["public"]["Tables"]["workspaces"]["Row"];
};

export async function getWorkspaces(supabase: SupabaseClient<Database>, userId: string) {
  const { data: workspaces } = await supabase
    .from("workspace_members")
    .select(`
      *,
      workspaces (
        *
      )
    `)
    .eq("user_id", userId);

  return workspaces as WorkspaceMembershipWithWorkspace[];
}

export async function createWorkspace(
  supabase: SupabaseClient<Database>,
  data: {
    name: string;
    created_by: string;
  }
) {
  // Start a transaction by using RPC
  const { data: workspace, error: workspaceError } = await supabase.rpc('create_workspace_with_admin', {
    workspace_name: data.name,
    user_id: data.created_by
  });

  if (workspaceError) {
    console.error('Error creating workspace:', workspaceError);
    throw new Error('Failed to create workspace');
  }

  return workspace;
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

export async function joinWorkspaceWithCode(
  supabase: SupabaseClient<Database>,
  code: string,
  userId: string
) {
  const { data: workspace, error } = await supabase.rpc('join_workspace_with_code', {
    code,
    user_id: userId
  });

  if (error) {
    console.error('Error joining workspace:', error);
    throw new Error(error.message);
  }

  return workspace;
} 