import { json } from "@remix-run/node";
import { useLoaderData, Link, useParams, useOutletContext } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { MessageList } from "~/components/chat/message-list";
import { MessageInput } from "~/components/chat/message-input";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Message } from "~/types/chat";
import { CopyButton } from "~/components/ui/copy-button";
import { useRealtimeMessages } from "~/hooks/use-realtime-messages";

export async function loader({ request, params }: { request: Request; params: { workspaceSlug: string; ticketId: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });

  // Get ticket with chat room - using explicit relationship
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      id,
      description,
      created_at,
      chat_room_id,
      chat_rooms!tickets_chat_room_id_fkey (
        id,
        status
      )
    `)
    .eq('id', params.ticketId)
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
    ticket, 
    messages: allMessages 
  }, { 
    headers: response.headers 
  });
}

export async function action({ request, params }: { request: Request; params: { workspaceSlug: string; ticketId: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });

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
      sender_type: 'customer'
    });

  return json({ success: true }, { headers: response.headers });
}

export default function CustomerTicketChat() {
  const { ticket, messages: initialMessages } = useLoaderData<typeof loader>();
  const params = useParams();
    
  const messages = useRealtimeMessages(ticket.chat_room_id, initialMessages);

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/support/${params.workspaceSlug}/ticket/${ticket.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Ticket
                </Link>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Ticket #{ticket.id}</span>
              <CopyButton value={ticket.id} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <MessageList messages={messages} currentSenderType="customer" />
          <MessageInput />
        </CardContent>
      </Card>
    </div>
  );
} 