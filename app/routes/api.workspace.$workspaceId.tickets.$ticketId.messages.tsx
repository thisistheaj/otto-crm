import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { createServerSupabase } from "~/utils/supabase.server";
import type { Database } from "~/types/database";
import { requireApiKey } from "~/utils/api.server";

type Message = Database["public"]["Tables"]["messages"]["Insert"];

// Get messages for a ticket
export async function loader({ request, params }: LoaderFunctionArgs) {
  requireApiKey(request);
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId, ticketId } = params;

  try {
    // First verify the ticket belongs to the workspace
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("chat_room_id")
      .eq("id", ticketId)
      .eq("workspace_id", workspaceId)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket?.chat_room_id) {
      return json({ error: "No chat room found for ticket" }, { status: 404 });
    }

    // Then get all messages for this chat room
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", ticket.chat_room_id)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    return json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// Add a new message
export async function action({ request, params }: ActionFunctionArgs) {
  requireApiKey(request);
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId, ticketId } = params;

  try {
    // First verify the ticket belongs to the workspace and get/create chat room
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("chat_room_id")
      .eq("id", ticketId)
      .eq("workspace_id", workspaceId)
      .single();

    if (ticketError) throw ticketError;

    let chatRoomId = ticket?.chat_room_id;

    // Create chat room if it doesn't exist
    if (!chatRoomId) {
      const { data: chatRoom, error: chatRoomError } = await supabase
        .from("chat_rooms")
        .insert([{ ticket_id: ticketId, status: "active" }])
        .select()
        .single();

      if (chatRoomError) throw chatRoomError;
      
      chatRoomId = chatRoom.id;

      // Update ticket with chat room id
      await supabase
        .from("tickets")
        .update({ chat_room_id: chatRoomId })
        .eq("id", ticketId)
        .eq("workspace_id", workspaceId);
    }

    const messageData = (await request.json()) as Partial<Message>;
    
    if (!messageData.content || !messageData.sender_type) {
      return json({
        error: "Missing required fields: content, sender_type"
      }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert([{
        room_id: chatRoomId,
        content: messageData.content,
        sender_type: messageData.sender_type
      }])
      .select()
      .single();

    if (error) throw error;

    return json({ message });
  } catch (error) {
    console.error("Error adding message:", error);
    return json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
} 