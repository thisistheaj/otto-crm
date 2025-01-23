import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY!;

// Create a Supabase client with the service role key
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { workspaceId } = params;
  const apiKey = request.headers.get('x-api-key');

  // Verify API key
  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Get workspace members
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (membersError) throw membersError;
    if (!members?.length) return json({ users: [] });

    // Get profiles for these members
    const userIds = members.map(m => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    // Transform the data into the expected format
    const users = members.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id);
      return {
        id: member.user_id,
        role: member.role,
        full_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
        joined_at: member.joined_at,
        updated_at: profile?.updated_at || member.updated_at
      };
    });

    return json({ users });
  } catch (error) {
    console.error("Error fetching workspace users:", error);
    return json(
      { error: "Failed to fetch workspace users" },
      { status: 500 }
    );
  }
}

// Only allow GET requests
export const action = async () => {
  return json({ error: "Method not allowed" }, { status: 405 });
}; 