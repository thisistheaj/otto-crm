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

type WorkspaceMemberWithProfile = {
  user_id: string;
  role: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
    is_available: boolean;
  };
};

export type WorkspaceMemberInfo = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  role: string;
  is_available: boolean;
};

export async function getWorkspaceMembers(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<WorkspaceMemberInfo[]> {
  // First get all workspace members
  const { data: members, error: membersError } = await supabase
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', workspaceId);

  if (membersError) throw membersError;

  if (!members?.length) return [];

  // Then get their profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', members.map(m => m.user_id));

  if (profilesError) throw profilesError;

  // Combine the data
  return members.map(member => {
    const profile = profiles?.find(p => p.id === member.user_id);
    return {
      id: member.user_id,
      full_name: profile?.full_name || null,
      avatar_url: profile?.avatar_url || null,
      email: profile?.email || '',
      role: member.role,
      is_available: profile?.is_available || false
    };
  });
}

export async function updateWorkspace(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  data: Partial<Workspace>
) {
  const { error } = await supabase
    .from('workspaces')
    .update(data)
    .eq('id', workspaceId);

  if (error) throw error;
}

export async function deleteWorkspace(
  supabase: SupabaseClient<Database>,
  workspaceId: string
) {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);

  if (error) throw error;
}

export async function updateMemberRole(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
  role: string
) {
  const { error } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function removeMember(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string
) {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw error;
} 