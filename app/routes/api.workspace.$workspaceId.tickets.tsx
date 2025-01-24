import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { createServerSupabase } from "~/utils/supabase.server";
import type { Database } from "~/types/database";
import { requireApiKey } from "~/utils/api.server";

type TicketFilters = {
  status?: string;
  priority?: string;
  email?: string;
  created_after?: string;
  created_before?: string;
  search?: string;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  requireApiKey(request);
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId } = params;
  
  if (!workspaceId) {
    return json(
      { error: "workspace_id is required" },
      { status: 400 }
    );
  }

  // Get query parameters
  const url = new URL(request.url);
  const filters: TicketFilters = {
    status: url.searchParams.get("status") || undefined,
    priority: url.searchParams.get("priority") || undefined,
    email: url.searchParams.get("email") || undefined,
    created_after: url.searchParams.get("created_after") || undefined,
    created_before: url.searchParams.get("created_before") || undefined,
    search: url.searchParams.get("search") || undefined,
  };

  try {
    let query = supabase
      .from("tickets")
      .select(`
        id,
        subject,
        description,
        email,
        status,
        priority,
        created_at,
        chat_room_id
      `)
      .eq("workspace_id", workspaceId);

    // Apply filters
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters.email) {
      query = query.eq("email", filters.email);
    }
    if (filters.created_after) {
      query = query.gte("created_at", filters.created_after);
    }
    if (filters.created_before) {
      query = query.lte("created_at", filters.created_before);
    }
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Always sort by created_at desc
    query = query.order("created_at", { ascending: false });

    const { data: tickets, error } = await query;

    if (error) throw error;

    return json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

// Only allow GET requests
export const action = async () => {
  return json({ error: "Method not allowed" }, { status: 405 });
} 