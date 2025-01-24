import { json, type ActionFunctionArgs } from "@remix-run/node";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";
import { testData } from "~/data/test-data";

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
      articles: 0,
      documents: 0,
      tickets: 0,
      chatRooms: 0,
      messages: 0
    };

    // 1. Create articles
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .insert(
        testData.articles.map(article => ({
          ...article,
          workspace_id: TEST_DATA_WORKSPACE_ID,
          created_at: article.created_at || new Date().toISOString(),
          updated_at: article.updated_at || new Date().toISOString()
        }))
      )
      .select();
    
    if (articlesError) throw articlesError;
    summary.articles = articles?.length ?? 0;

    // 2. Create documents
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .insert(
        testData.documents.map(document => ({
          ...document,
          workspace_id: TEST_DATA_WORKSPACE_ID,
          created_at: document.created_at || new Date().toISOString(),
          updated_at: document.updated_at || new Date().toISOString()
        }))
      )
      .select();
    
    if (documentsError) throw documentsError;
    summary.documents = documents?.length ?? 0;

    // 3. Create tickets with chat rooms
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .insert(
        testData.tickets.map(ticket => ({
          ...ticket,
          workspace_id: TEST_DATA_WORKSPACE_ID,
          created_at: ticket.created_at || new Date().toISOString()
        }))
      )
      .select();
    
    if (ticketsError) throw ticketsError;
    summary.tickets = tickets?.length ?? 0;

    // 4. Create chat rooms for each ticket
    const chatRoomPromises = tickets?.map(async ticket => {
      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({
          ticket_id: ticket.id,
          status: "active",
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Update ticket with chat room id
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ chat_room_id: room.id })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      return room;
    }) ?? [];

    const chatRooms = await Promise.all(chatRoomPromises);
    summary.chatRooms = chatRooms.length;

    // 5. Create messages (using the first chat room for our test messages)
    if (chatRooms.length > 0) {
      const firstRoom = chatRooms[0];
      console.log("Using first chat room for messages:", firstRoom);
      if (!firstRoom?.id) {
        console.error("First room is missing ID:", firstRoom);
        throw new Error("Failed to get chat room ID for messages");
      }

      // Create messages for the first chat room
      const messagesToCreate = testData.messages.map(message => {
        // Ignore the placeholder room_id from test data
        const { room_id: _, ...messageWithoutRoomId } = message;
        return {
          ...messageWithoutRoomId,
          room_id: firstRoom.id,
          created_at: message.created_at || new Date().toISOString()
        };
      });
      console.log("Creating messages:", messagesToCreate);

      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .insert(messagesToCreate)
        .select();
      
      if (messagesError) {
        console.error("Error creating messages:", messagesError);
        throw messagesError;
      }
      console.log("Created messages:", messages);
      summary.messages = messages?.length ?? 0;
    }

    return json({
      message: "Test data seeded successfully",
      summary
    });
  } catch (error) {
    console.error("Error seeding test data:", error);
    return json(
      { error: "Failed to seed test data" },
      { status: 500 }
    );
  }
} 