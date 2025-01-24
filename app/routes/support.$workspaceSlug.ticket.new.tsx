import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { supabaseAdmin } from "~/utils/supabase.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { ArrowRight } from "lucide-react";

type TicketWithWorkspace = {
  id: string;
  workspace: {
    slug: string;
  };
};

type TicketResponse = {
  id: string;
  workspace: {
    slug: string;
  };
};

export async function loader({ request, params }: { request: Request; params: { workspaceSlug: string } }) {
  const response = new Response();
  const supabase = supabaseAdmin;

  // Verify workspace exists
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', params.workspaceSlug)
    .single();

  if (error || !workspace) {
    throw new Response("Workspace not found", { status: 404 });
  }

  return json({ workspace }, { headers: response.headers });
}

export async function action({ request, params }: { request: Request; params: { workspaceSlug: string } }) {
  const response = new Response();
  const supabase = supabaseAdmin;
  const formData = await request.formData();

  // Check if this is a ticket lookup
  const ticketId = formData.get("ticketId");
  if (ticketId) {
    // Verify ticket exists and belongs to this workspace
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        subject,
        description,
        email,
        status,
        priority,
        created_at,
        workspace:workspaces (
          id,
          name,
          slug
        )
      `)
      .eq('id', ticketId)
      .single<TicketResponse>();

    if (error || !data || !data.workspace) {
      return json({ error: "Ticket not found" }, { headers: response.headers });
    }

    const ticket: TicketWithWorkspace = {
      id: data.id,
      workspace: data.workspace
    };

    if (ticket.workspace.slug !== params.workspaceSlug) {
      return json({ error: "Ticket not found in this workspace" }, { headers: response.headers });
    }

    return redirect(`/support/${params.workspaceSlug}/ticket/${ticket.id}/chat`);
  }

  // Handle new ticket creation
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;

  if (!email || !subject || !description) {
    return json({ error: "All fields are required" }, { headers: response.headers });
  }

  // Get workspace id
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', params.workspaceSlug)
    .single();

  if (!workspace) {
    return json({ error: "Workspace not found" }, { headers: response.headers });
  }

  // Create ticket and chat room
  const { data: chatRoom } = await supabase
    .from('chat_rooms')
    .insert({ status: 'open' })
    .select()
    .single();

  const { data: ticket } = await supabase
    .from('tickets')
    .insert({
      workspace_id: workspace.id,
      email,
      subject,
      description,
      status: 'new',
      priority: 'medium',
      chat_room_id: chatRoom.id
    })
    .select()
    .single();

  return redirect(`/support/${params.workspaceSlug}/ticket/${ticket.id}/chat`);
}

export default function NewTicket() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="container max-w-2xl mx-auto p-8 space-y-8">
      {/* Ticket Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>Have a Ticket ID?</CardTitle>
          <CardDescription>
            Enter your ticket number to continue your conversation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="flex gap-4">
            <Input
              name="ticketId"
              placeholder="Enter your ticket ID"
              className="flex-1"
            />
            <Button type="submit">
              Continue Chat
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Form>
          {actionData?.error && (
            <p className="text-sm text-destructive mt-2">{actionData.error}</p>
          )}
        </CardContent>
      </Card>

      {/* New Ticket Form */}
      <Card>
        <CardHeader>
          <CardTitle>Start a New Support Request</CardTitle>
          <CardDescription>
            Fill out the form below to create a new support ticket
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Brief description of your issue"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Please provide details about your issue"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Request
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 