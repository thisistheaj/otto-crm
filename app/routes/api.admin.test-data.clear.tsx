import { json, type ActionFunctionArgs } from "@remix-run/node";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY!;
const TEST_DATA_WORKSPACE_ID = process.env.TEST_DATA_WORKSPACE_ID!;

// Create a Supabase client with the service role key
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // Verify admin API key
  const apiKey = request.headers.get("x-admin-key");
  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify workspace ID is configured
  if (!TEST_DATA_WORKSPACE_ID) {
    return json(
      { error: "TEST_DATA_WORKSPACE_ID not configured" },
      { status: 500 }
    );
  }

  try {
    const summary = {
      messages: 0,
      chatRooms: 0,
      tickets: 0,
      documents: 0,
      articles: 0
    };

    // First get all tickets in the workspace
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("id, chat_room_id")
      .eq("workspace_id", TEST_DATA_WORKSPACE_ID);
    
    if (ticketsError) throw ticketsError;

    // Get all chat room IDs from these tickets
    const chatRoomIds = tickets
      ?.map(ticket => ticket.chat_room_id)
      .filter(Boolean) as string[];

    // Delete messages for these chat rooms
    if (chatRoomIds.length > 0) {
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .delete()
        .in("room_id", chatRoomIds)
        .select("id");
      
      if (messagesError) throw messagesError;
      summary.messages = messages?.length ?? 0;
    }

    // Delete chat rooms
    if (chatRoomIds.length > 0) {
      const { data: deletedRooms, error: deleteRoomsError } = await supabase
        .from("chat_rooms")
        .delete()
        .in("id", chatRoomIds)
        .select("id");
      
      if (deleteRoomsError) throw deleteRoomsError;
      summary.chatRooms = deletedRooms?.length ?? 0;
    }

    // Delete tickets
    const { data: deletedTickets, error: deleteTicketsError } = await supabase
      .from("tickets")
      .delete()
      .eq("workspace_id", TEST_DATA_WORKSPACE_ID)
      .select("id");
    
    if (deleteTicketsError) throw deleteTicketsError;
    summary.tickets = deletedTickets?.length ?? 0;

    // Delete documents (database records only)
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .delete()
      .eq("workspace_id", TEST_DATA_WORKSPACE_ID)
      .select("id");
    
    if (documentsError) throw documentsError;
    summary.documents = documents?.length ?? 0;

    // Delete articles
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .delete()
      .eq("workspace_id", TEST_DATA_WORKSPACE_ID)
      .select("id");
    
    if (articlesError) throw articlesError;
    summary.articles = articles?.length ?? 0;

    return json({
      message: "Test data cleared successfully",
      summary
    });
  } catch (error) {
    console.error("Error clearing test data:", error);
    return json(
      { error: "Failed to clear test data" },
      { status: 500 }
    );
  }
} 