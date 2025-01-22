import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { MessageList } from "~/components/chat/message-list";
import { MessageInput } from "~/components/chat/message-input";
import type { Message } from "~/types/chat";
import { useRealtimeMessages } from "~/hooks/use-realtime-messages";

export async function loader({ request, params }: { request: Request; params: { id: string; ticketId: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const workspace = await getWorkspace(supabase, params.id, user.id);

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

  // Add system message for initial request
  const allMessages: Message[] = [
    {
      id: 'initial-request',
      room_id: ticket.chat_room_id,
      content: ticket.description,
      sender_type: 'system',
      created_at: ticket.created_at
    },
    ...(messages || [])
  ];

  return json({ 
    workspace, 
    ticket, 
    messages: allMessages 
  }, { 
    headers: response.headers 
  });
}

export async function action({ request, params }: { request: Request; params: { id: string; ticketId: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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
  const { ticket, messages: initialMessages } = useLoaderData<typeof loader>();
  const messages = useRealtimeMessages(ticket.chat_room_id, initialMessages);

  return (
    <div className="p-8">
      <Card>
        {/* Ticket Info Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-medium">
                  {ticket.subject}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  #{ticket.id}
                </span>
              </div>
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
          <MessageList messages={messages} currentSenderType="agent" />
          <MessageInput />
        </CardContent>
      </Card>
    </div>
  );
} 