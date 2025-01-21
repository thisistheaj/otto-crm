import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { supabaseAdmin } from "~/utils/supabase.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { workspaceSlug, ticketId } = params;

  // Validate workspace exists
  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from("workspaces")
    .select("id, name")
    .eq("slug", workspaceSlug)
    .single();

  if (workspaceError || !workspace) {
    throw new Response("Workspace not found", { status: 404 });
  }

  // Fetch ticket with chat room - using explicit relationship
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from("tickets")
    .select(`
      id,
      subject,
      description,
      email,
      status,
      priority,
      created_at,
      chat_rooms!tickets_chat_room_id_fkey (
        id,
        status
      )
    `)
    .eq("id", ticketId)
    .eq("workspace_id", workspace.id)
    .single();

  if (ticketError || !ticket) {
    throw new Response("Ticket not found", { status: 404 });
  }

  return json({ workspace, ticket });
}

export default function TicketDetailRoute() {
  const { ticket } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
            <div className="flex gap-2">
              <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                {ticket.status}
              </Badge>
              <Badge variant={
                ticket.priority === "high" ? "destructive" : 
                ticket.priority === "medium" ? "default" : 
                "secondary"
              }>
                {ticket.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Contact</h3>
            <p className="text-muted-foreground">{ticket.email}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Created</h3>
            <p className="text-muted-foreground">
              {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>

          <div className="pt-4">
            <Link to="chat">
              <Button className="w-full">
                Open Chat
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 