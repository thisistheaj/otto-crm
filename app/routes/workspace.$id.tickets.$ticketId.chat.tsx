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
import { AlertCircle, Loader2 } from "lucide-react";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";

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
    console.log("suggestion:");
    console.log(suggestion);
    return json(suggestion);
  }

  if (intent === "update_status") {
    const status = formData.get("status");
    console.log('Updating ticket status to:', status);
    
    // Update ticket status
    await updateTicketStatus(supabase, params.ticketId, status as string);
    
    // Add system message about status change
    const { data: ticketData } = await supabase
      .from('tickets')
      .select('chat_room_id')
      .eq('id', params.ticketId)
      .single();

    if (ticketData?.chat_room_id) {
      await supabase
        .from('messages')
        .insert({
          room_id: ticketData.chat_room_id,
          content: `Ticket status updated to: ${status}`,
          sender_type: 'system'
        });
    }

    return json({ success: true });
  }

  // Handle existing message sending logic
  const message = formData.get("message") as string;
  if (!message?.trim()) {
    return null;
  }

  // Get ticket to ensure it exists and get chat room id
  const { data: ticketInfo } = await supabase
    .from('tickets')
    .select('chat_room_id')
    .eq('id', params.ticketId)
    .single();

  if (!ticketInfo?.chat_room_id) {
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
        room_id: ticketInfo.chat_room_id,
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
  const [proposedStatus, setProposedStatus] = useState<false | "pending">(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [autoSend, setAutoSend] = useState(false);

  // Function to get suggestion
  function getSuggestion() {
    const formData = new FormData();
    formData.append("intent", "get-suggestion");
    fetcher.submit(formData, { method: "post" });
    setLastFetchTime(Date.now());
  }

  // Handle fetcher state
  const isLoading = fetcher.state === "submitting";

  // Helper function to find mentioned titles in text
  function findMentionedTitles(text: string): string[] {
    const matches = text.match(/\[(.*?)\]/g) || [];
    return matches.map(match => match.slice(1, -1));
  }

  // Function to automatically send message and update status
  async function autoSendMessage(text: string, citationsToInclude: Citation[], status: false | "pending") {
    // First send the message
    const messageFormData = new FormData();
    let finalText = text;
    if (citationsToInclude.length > 0) {
      finalText += "\n\nHelpful Resources:\n" + citationsToInclude.map(citation => 
        `[${citation.title}](${window.location.origin}${citation.url})`
      ).join("\n");
    }
    console.log("Sending message:", finalText);
    
    // Add message to form data before submitting
    messageFormData.append("message", finalText);

    // Submit message and wait for completion
    await new Promise<void>((resolve) => {
      const submitter = submit(messageFormData, { method: "post" });
      // Wait a bit to ensure the message is processed
      setTimeout(resolve, 500);
    });

    // Then update status if needed
    if (status === "pending") {
      console.log('Setting ticket status to pending...');
      const statusFormData = new FormData();
      statusFormData.append("intent", "update_status");
      statusFormData.append("status", "pending");
      
      // Submit status update and wait for completion
      await new Promise<void>((resolve) => {
        submit(statusFormData, { method: "post" });
        // Wait a bit to ensure the status update is processed
        setTimeout(resolve, 500);
      });
    }
  }

  // Handle fetcher data
  useEffect(() => {
    // Only process new fetcher data
    if (fetcher.data && 'content' in fetcher.data && 'setStatus' in fetcher.data && fetcher.state === "idle" && lastFetchTime) {
      console.log('Received suggestion data:', fetcher.data);
      
      if (autoSend) {
        // Find mentioned citations
        const mentionedTitles = findMentionedTitles(fetcher.data.content);
        const citationsToInclude = fetcher.data.citations.filter(
          citation => mentionedTitles.includes(citation.title)
        );
        
        // Auto send the message and update status
        (async () => {
          try {
            await autoSendMessage(
              fetcher.data.content,
              citationsToInclude,
              fetcher.data.setStatus
            );
            // Reset states after both operations complete
            setLastFetchTime(null);
          } catch (error) {
            console.error('Error auto-sending message:', error);
          }
        })();
      } else {
        // Show the suggestion dialog
        setSuggestion(fetcher.data.content);
        setCitations(fetcher.data.citations);
        setProposedStatus(fetcher.data.setStatus);
      }
    }
  }, [fetcher.data, fetcher.state, lastFetchTime, autoSend]);

  // Function to use suggestion
  function useSuggestion(text: string, selectedCitations: Citation[], finalStatus: false | "pending") {
    if (inputRef.current) {
      inputRef.current.value = text;
      inputRef.current.focus();
    }
    setSuggestion(null);
    
    // Update status if needed
    if (finalStatus === "pending") {
      console.log('Setting ticket status to pending...');
      const formData = new FormData();
      formData.append("intent", "update_status");
      formData.append("status", "pending");
      submit(formData, { method: "post" });
    }
  }

  // Function to close suggestion dialog
  function closeSuggestion() {
    setSuggestion(null);
    setLastFetchTime(null);
    setProposedStatus(false);
  }

  // Function to open ticket
  function openTicket() {
    const formData = new FormData();
    formData.append("intent", "open_ticket");
    submit(formData, { method: "post" });
  }

  // Get button text based on state
  const getButtonText = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>AI is typing...</span>
        </div>
      );
    }
    return autoSend ? "Send Suggested Response" : "Get Suggestion";
  };

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
              {/* Add suggestion button and auto-send checkbox */}
              <div className="px-4 pt-6 pb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="flex-1 mr-4 min-h-[36px]"
                    onClick={getSuggestion}
                    disabled={isLoading}
                  >
                    {getButtonText()}
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-send"
                      checked={autoSend}
                      onCheckedChange={(checked) => setAutoSend(checked as boolean)}
                    />
                    <Label htmlFor="auto-send" className="text-sm">
                      Auto send
                    </Label>
                  </div>
                </div>
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
            proposedStatus={proposedStatus}
            onUse={(text, selectedCitations, finalStatus) => {
              useSuggestion(text, selectedCitations, finalStatus);
              closeSuggestion();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
} 