import { json, type ActionFunctionArgs } from "@remix-run/node";
import { createServerSupabase } from "~/utils/supabase.server";
import type { Database } from "~/types/database";
import { requireApiKey } from "~/utils/api.server";

type NewTicket = Database["public"]["Tables"]["tickets"]["Insert"];

export async function action({ request, params }: ActionFunctionArgs) {
  requireApiKey(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId } = params;

  try {
    const ticket = (await request.json()) as Partial<NewTicket>;
    
    if (!ticket.subject || !ticket.description || !ticket.email) {
      return json({
        error: "Missing required fields: subject, description, email"
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tickets")
      .insert([{
        workspace_id: workspaceId,
        subject: ticket.subject,
        description: ticket.description,
        email: ticket.email,
        status: ticket.status || "new",
        priority: ticket.priority || "normal"
      }])
      .select()
      .single();

    if (error) throw error;

    return json({ ticket: data });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export const loader = async () => {
  return json({ error: "Method not allowed" }, { status: 405 });
} 