import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/types/database";

type TicketFilters = {
  status?: string;
  priority?: string;
  limit?: number;
};

export async function getWorkspaceTickets(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  filters: TicketFilters = {}
) {
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
      chat_room_id,
      chat_rooms (
        id,
        status
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data: tickets, error } = await query;

  if (error) {
    console.error("Error fetching tickets:", error);
    throw new Error("Failed to fetch tickets");
  }

  return tickets;
}

export async function updateTicketStatus(
  supabase: SupabaseClient<Database>,
  ticketId: string,
  status: string
) {
  const { error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", ticketId);

  if (error) {
    console.error("Error updating ticket status:", error);
    throw new Error("Failed to update ticket status");
  }
}

export async function updateTicketPriority(
  supabase: SupabaseClient<Database>,
  ticketId: string,
  priority: string
) {
  const { error } = await supabase
    .from("tickets")
    .update({ priority })
    .eq("id", ticketId);

  if (error) {
    console.error("Error updating ticket priority:", error);
    throw new Error("Failed to update ticket priority");
  }
} 