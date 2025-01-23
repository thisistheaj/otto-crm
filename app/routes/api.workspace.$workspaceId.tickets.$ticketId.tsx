import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { createServerSupabase } from "~/utils/supabase.server";
import type { Database } from "~/types/database";

type TicketUpdate = Database["public"]["Tables"]["tickets"]["Update"];

// Get a single ticket
export async function loader({ request, params }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId, ticketId } = params;

  try {
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(`
        id,
        subject,
        description,
        email,
        status,
        priority,
        created_at,
        chat_room_id,
        workspace_id
      `)
      .eq("id", ticketId)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) throw error;
    if (!ticket) {
      return json({ error: "Ticket not found" }, { status: 404 });
    }

    return json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// Update or delete a ticket
export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "PATCH" && request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId, ticketId } = params;

  // Handle DELETE
  if (request.method === "DELETE") {
    try {
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", ticketId)
        .eq("workspace_id", workspaceId);

      if (error) throw error;
      return json({ success: true });
    } catch (error) {
      console.error("Error deleting ticket:", error);
      return json(
        { error: "Failed to delete ticket" },
        { status: 500 }
      );
    }
  }

  // Handle PATCH
  try {
    const updates = (await request.json()) as Partial<TicketUpdate>;
    
    // Don't allow updating workspace_id
    delete updates.workspace_id;
    
    const { data, error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("id", ticketId)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return json({ error: "Ticket not found" }, { status: 404 });
    }

    return json({ ticket: data });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
} 