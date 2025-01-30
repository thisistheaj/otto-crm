import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useFetcher } from "@remix-run/react";
import { createServerSupabase, supabaseAdmin } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { MessageList } from "~/components/chat/message-list";
import { MessageInput } from "~/components/chat/message-input";
import { SuggestionDialog } from "~/components/chat/suggestion-dialog";
import type { Message } from "~/types/chat";
import type { RagResponse, Citation } from "~/types/rag";
import { useRealtimeMessages } from "~/hooks/use-realtime-messages";
import { useState, useRef, useEffect } from "react";
import { getRagSuggestion } from "~/utils/rag.server";
import { updateTicketStatus } from "~/models/ticket.server";
import { AlertCircle } from "lucide-react";

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
      chat_rooms (
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

  // Get agent profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

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
    messages: allMessages,
    profile
  }, { 
    headers: response.headers 
  });
}

export async function action({ request, params }: { request: Request; params: { id: string; ticketId: string } }) {
  const response = new Response();
  const supabase = supabaseAdmin;
  const supabaseAuth = createServerSupabase({ request, response });
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "open_ticket") {
    // First get the ticket to get the chat_room_id
    const { data: ticket } = await supabase
      .from('tickets')
      .select('chat_room_id, workspace_id')
      .eq('id', params.ticketId)
      .single();

    if (!ticket?.chat_room_id) {
      throw new Response("Ticket not found", { status: 404 });
    }

    // Get agent's full name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Update ticket status to open
    await updateTicketStatus(supabase, params.ticketId, "open");

    // Send greeting message
    await supabase
      .from('messages')
      .insert({
        room_id: ticket.chat_room_id,
        content: `Hi 👋 I'm ${profile?.full_name} and I'm here to help!`,
        sender_type: 'agent'
      });

    return json({ success: true });
  }

  if (intent === "get-suggestion") {
    // First get the ticket to get the chat_room_id and description
    const { data: ticket } = await supabase
      .from('tickets')
      .select('chat_room_id, description, created_at, workspace_id')
      .eq('id', params.ticketId)
      .single();

    if (!ticket?.chat_room_id) {
      throw new Response("Ticket not found", { status: 404 });
    }

    // Get workspace info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, slug')
      .eq('id', ticket.workspace_id)
      .single();

    if (!workspace) {
      throw new Response("Workspace not found", { status: 404 });
    }

    // Get messages using chat_room_id
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', ticket.chat_room_id)
      .order('created_at', { ascending: true });

    // Format messages for RAG, including initial ticket description as system message
    const formattedMessages = [
      // Add initial ticket description as system message
      {
        role: "system",
        content: ticket.description
      },
      // Add rest of the messages
      ...(messages?.map(m => ({
        role: m.sender_type === "agent" ? "assistant" : "user",
        content: m.content
      })) || [])
    ];

    // Get suggestion using RAG
    const suggestion = await getRagSuggestion(formattedMessages, {
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug
    });
    return json(suggestion);
  }

  // Handle existing message sending logic
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
        sender_type: 'agent'
      });
  }

  return json({ success: true }, { headers: response.headers });
}

export default function AgentTicketChat() {
  const { ticket, messages: initialMessages, profile } = useLoaderData<typeof loader>();
  const messages = useRealtimeMessages(ticket.chat_room_id, initialMessages);
  const fetcher = useFetcher<RagResponse>();
  const submit = useSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Add state for suggestion handling
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Function to get suggestion
  function getSuggestion() {
    const formData = new FormData();
    formData.append("intent", "get-suggestion");
    fetcher.submit(formData, { method: "post" });
    setLastFetchTime(Date.now());
  }

  // Handle fetcher state
  const isLoading = fetcher.state === "submitting";

  // Handle fetcher data
  useEffect(() => {
    // Only process new fetcher data
    if (fetcher.data && fetcher.state === "idle" && lastFetchTime) {
      setSuggestion(fetcher.data.content);
      setCitations(fetcher.data.citations);
    }
  }, [fetcher.data, fetcher.state, lastFetchTime]);

  // Function to use suggestion
  function useSuggestion(text: string, selectedCitations: Citation[]) {
    if (inputRef.current) {
      inputRef.current.value = text;
      inputRef.current.focus();
    }
    setSuggestion(null);
  }

  // Function to close suggestion dialog
  function closeSuggestion() {
    setSuggestion(null);
    setLastFetchTime(null);
  }

  // Function to open ticket
  function openTicket() {
    const formData = new FormData();
    formData.append("intent", "open_ticket");
    submit(formData, { method: "post" });
  }

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
          
          {ticket.status === "new" ? (
            <div className="p-4">
              <Button
                className="w-full"
                onClick={openTicket}
              >
                Open Ticket
              </Button>
            </div>
          ) : ticket.status === "resolved" || ticket.status === "closed" ? (
            <div className="p-4 space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                This ticket is {ticket.status}
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  const formData = new FormData();
                  formData.append("intent", "open_ticket");
                  submit(formData, { method: "post" });
                }}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Reopen Ticket
              </Button>
            </div>
          ) : (
            <>
              {/* Add suggestion button */}
              <div className="px-4 pt-4">
                <Button
                  variant="outline"
                  className="w-full mb-2"
                  onClick={getSuggestion}
                  disabled={isLoading}
                >
                  {isLoading ? "Getting suggestion..." : "Get Suggestion"}
                </Button>
              </div>
              
              <MessageInput ref={inputRef} />
            </>
          )}

          {/* Add suggestion dialog */}
          <SuggestionDialog
            suggestion={suggestion || ""}
            citations={citations}
            isOpen={!!suggestion}
            onClose={closeSuggestion}
            onUse={(text, selectedCitations) => {
              useSuggestion(text, selectedCitations);
              closeSuggestion();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
} 