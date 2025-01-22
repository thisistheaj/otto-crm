import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Send } from "lucide-react";

export async function loader({ request, params }: { request: Request; params: { id: string; ticketId: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const workspace = await getWorkspace(supabase, params.id, session.user.id);

  // Get ticket with chat room - using explicit relationship
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      id,
      subject,
      description,
      email,
      status,
      priority,
      created_at,
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
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', ticket.chat_room_id)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('Messages error:', messagesError);
  }

  return json({ 
    workspace, 
    ticket, 
    messages: messages || [] 
  }, { 
    headers: response.headers 
  });
}

export async function action({ request, params }: { request: Request; params: { id: string; ticketId: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const message = formData.get("message") as string;

  if (!message?.trim()) {
    return null;
  }

  // Get ticket to ensure it exists and get chat room id
  const { data: ticket } = await supabase
    .from('tickets')
    .select('chat_room_id')
    .eq('id', params.ticketId)
    .single();

  if (!ticket?.chat_room_id) {
    throw new Response("Ticket not found", { status: 404 });
  }

  // Create message
  await supabase
    .from('messages')
    .insert({
      room_id: ticket.chat_room_id,
      content: message.trim(),
      sender_type: 'agent'
    });

  return json({ success: true }, { headers: response.headers });
}

export default function AgentTicketChat() {
  const { workspace, ticket, messages } = useLoaderData<typeof loader>();

  return (
    <div className="p-8">
      <Card>
        {/* Ticket Info Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">
                {ticket.subject}
              </CardTitle>
              <CardDescription>
                Customer: {ticket.email}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                {ticket.status}
              </Badge>
              <Badge variant={ticket.priority === "high" ? "destructive" : "secondary"}>
                {ticket.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Chat messages container */}
          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {/* Initial ticket message */}
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted">
                <p className="text-sm font-medium mb-1">Initial Request</p>
                <p className="text-sm">{ticket.description}</p>
              </div>
            </div>

            {/* Chat messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_type === 'agent' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.sender_type === 'agent'
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
    </div>
  );
} 