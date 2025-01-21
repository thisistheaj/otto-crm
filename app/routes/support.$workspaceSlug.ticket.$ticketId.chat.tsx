import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { supabaseAdmin } from "~/utils/supabase.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Send } from "lucide-react";

export async function loader({ params }: { params: { workspaceSlug: string; ticketId: string } }) {
  try {
    // Get workspace
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .select('id, name')
      .eq('slug', params.workspaceSlug)
      .single();

    if (workspaceError || !workspace) {
      throw new Response("Workspace not found", { status: 404 });
    }

    // Get ticket with chat room - using explicit relationship
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        id,
        subject,
        description,
        status,
        chat_room_id,
        chat_rooms!tickets_chat_room_id_fkey (
          id,
          status
        )
      `)
      .eq('id', params.ticketId)
      .eq('workspace_id', workspace.id)
      .single();

    if (ticketError || !ticket) {
      throw new Response("Ticket not found", { status: 404 });
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('room_id', ticket.chat_room_id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Messages error:', messagesError);
    }

    return json({ workspace, ticket, messages: messages || [] });
  } catch (error) {
    console.error('Unexpected error in chat loader:', error);
    throw error;
  }
}

export async function action({ request, params }: { request: Request; params: { workspaceSlug: string; ticketId: string } }) {
  const formData = await request.formData();
  const message = formData.get("message") as string;

  if (!message?.trim()) {
    return null;
  }

  // Get ticket to ensure it exists and get chat room id
  const { data: ticket } = await supabaseAdmin
    .from('tickets')
    .select('chat_room_id')
    .eq('id', params.ticketId)
    .single();

  if (!ticket?.chat_room_id) {
    throw new Response("Ticket not found", { status: 404 });
  }

  // Create message
  await supabaseAdmin
    .from('messages')
    .insert({
      room_id: ticket.chat_room_id,
      content: message.trim(),
      sender_type: 'customer'
    });

  return null;
}

export default function TicketChat() {
  const { workspace, ticket, messages } = useLoaderData<typeof loader>();

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-medium">
          {ticket.subject}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Chat messages container */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_type === 'customer' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.sender_type === 'customer'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className="border-t p-4">
          <Form method="post" className="flex gap-2">
            <Input
              name="message"
              placeholder="Type your message..."
              className="flex-1"
              required
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
} 