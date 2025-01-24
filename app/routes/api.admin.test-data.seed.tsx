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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      )
      .select();
    
    if (documentsError) throw documentsError;
    summary.documents = documents?.length ?? 0;

    // 3. Process tickets and their messages
    for (const ticketData of testData.tickets) {
      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          workspace_id: TEST_DATA_WORKSPACE_ID,
          subject: ticketData.subject,
          description: ticketData.description,
          email: ticketData.email,
          status: ticketData.status,
          priority: ticketData.priority,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (ticketError) throw ticketError;
      summary.tickets++;

      // Create chat room for this ticket
      const { data: chatRoom, error: chatRoomError } = await supabase
        .from("chat_rooms")
        .insert({
          ticket_id: ticket.id,
          status: "active",
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatRoomError) throw chatRoomError;
      summary.chatRooms++;

      // Update ticket with chat room id
      await supabase
        .from("tickets")
        .update({ chat_room_id: chatRoom.id })
        .eq("id", ticket.id);

      // Create messages for this ticket
      if (ticketData.messages?.length) {
        const { error: messagesError } = await supabase
          .from("messages")
          .insert(
            ticketData.messages.map(message => ({
              room_id: chatRoom.id,
              content: message.content,
              sender_type: message.sender_type,
              created_at: message.created_at || new Date().toISOString()
            }))
          );

        if (messagesError) throw messagesError;
        summary.messages += ticketData.messages.length;
      }
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