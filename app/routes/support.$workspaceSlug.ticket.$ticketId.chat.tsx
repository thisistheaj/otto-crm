import { json } from "@remix-run/node";
import { useLoaderData, Link, useParams, useSubmit } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { MessageList } from "~/components/chat/message-list";
import { MessageInput } from "~/components/chat/message-input";
import { Button } from "~/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertCircle, PlusCircle } from "lucide-react";
import type { Message } from "~/types/chat";
import { CopyButton } from "~/components/ui/copy-button";
import { useRealtimeMessages } from "~/hooks/use-realtime-messages";
import { updateTicketStatus } from "~/models/ticket.server";

export async function loader({ request, params }: { request: Request; params: { workspaceSlug: string; ticketId: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });

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
      chat_rooms (
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
  const intent = formData.get("intent");

  if (intent === "update_status") {
    const status = formData.get("status") as string;
    const message = formData.get("message") as string;

    // Get ticket to ensure it exists and get chat room id
    const { data: ticket } = await supabase
      .from('tickets')
      .select('chat_room_id')
      .eq('id', params.ticketId)
      .single();

    if (!ticket?.chat_room_id) {
      throw new Response("Ticket not found", { status: 404 });
    }

    // Update ticket status
    await updateTicketStatus(supabase, params.ticketId, status);

    // Add a system message about the status change
    if (message) {
      await supabase
        .from('messages')
        .insert({
          room_id: ticket.chat_room_id,
          content: message,
          sender_type: 'system'
        });
    }

    return json({ success: true });
  }

  // Handle regular message sending
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

  // Split message on newlines and filter out empty lines
  const messages = message
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Create messages in sequence
  for (const content of messages) {
    await supabase
      .from('messages')
      .insert({
        room_id: ticket.chat_room_id,
        content,
        sender_type: 'customer'
      });
  }

  return json({ success: true }, { headers: response.headers });
}

export default function CustomerTicketChat() {
  const { ticket, messages: initialMessages } = useLoaderData<typeof loader>();
  const params = useParams();
  const submit = useSubmit();
  const messages = useRealtimeMessages(ticket.chat_room_id, initialMessages);

  function handleStatusUpdate(status: string, message: string) {
    const formData = new FormData();
    formData.append("intent", "update_status");
    formData.append("status", status);
    formData.append("message", message);
    submit(formData, { method: "post" });
  }

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
          
          {ticket.status === "pending" ? (
            <div className="p-4 space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                This ticket is awaiting your confirmation. Has your issue been resolved?
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => handleStatusUpdate("open", "Customer requested to reopen the ticket.")}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  No, Reopen Ticket
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleStatusUpdate("resolved", "Customer confirmed the issue was resolved.")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Yes, Mark as Resolved
                </Button>
              </div>
            </div>
          ) : ticket.status === "resolved" || ticket.status === "closed" ? (
            <div className="p-4 space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                This ticket is {ticket.status}. Would you like to reopen it or create a new ticket?
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => handleStatusUpdate("open", "Customer requested to reopen the ticket.")}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Reopen Ticket
                </Button>
                <Button
                  className="flex-1"
                  asChild
                >
                  <Link to={`/support/${params.workspaceSlug}/ticket/new`}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Ticket
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <MessageInput />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 