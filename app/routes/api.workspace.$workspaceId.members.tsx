import { json } from "@remix-run/node";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspaceMembers } from "~/models/workspace.server";
import { verifyApiKey } from "~/utils/auth.server";

export async function loader({ request, params }: { request: Request; params: { workspaceId: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });

  // Verify API key
  await verifyApiKey(request);

  try {
    const members = await getWorkspaceMembers(supabase, params.workspaceId);
    return json(members, { headers: response.headers });
  } catch (error: any) {
    console.error('Error fetching workspace members:', error);
    return json({ error: 'Failed to fetch workspace members' }, { 
      status: 500,
      headers: response.headers 
    });
  }
} 