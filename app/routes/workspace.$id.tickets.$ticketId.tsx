import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { getWorkspaceTickets, updateTicketStatus, updateTicketPriority } from "~/models/ticket.server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { MessageSquare } from "lucide-react";
import { Link } from "@remix-run/react";
import { cn } from "~/lib/utils";

type TicketStatus = "new" | "open" | "pending" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high";

export async function loader({ request, params }: { request: Request; params: { id: string; ticketId: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const workspace = await getWorkspace(supabase, params.id, user.id);
  const tickets = await getWorkspaceTickets(supabase, workspace.id);
  const ticket = tickets.find(t => t.id === params.ticketId);

  if (!ticket) {
    throw new Response("Ticket not found", { status: 404 });
  }

  return json({ 
    workspace,
    ticket
  }, { 
    headers: response.headers 
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const status = formData.get("status") as string;
  const priority = formData.get("priority") as string;

  if (status) {
    await updateTicketStatus(supabase, params.ticketId!, status);
  }

  if (priority) {
    await updateTicketPriority(supabase, params.ticketId!, priority);
  }

  return json({ success: true }, { headers: response.headers });
}

export default function TicketDetailRoute() {
  const { workspace, ticket } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isUpdating = navigation.state === "submitting";

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "new": return "text-blue-500 dark:text-blue-400";
      case "open": return "text-yellow-500 dark:text-yellow-400";
      case "pending": return "text-orange-500 dark:text-orange-400";
      case "resolved": return "text-green-500 dark:text-green-400";
      case "closed": return "text-gray-500 dark:text-gray-400";
      default: return "";
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case "high": return "text-red-500 dark:text-red-400";
      case "medium": return "text-yellow-500 dark:text-yellow-400";
      case "low": return "text-green-500 dark:text-green-400";
      default: return "";
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
              <CardDescription className="mt-2">
                Submitted by {ticket.email}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/workspace/${workspace.id}/tickets/${ticket.id}/chat`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Open Chat
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status and Priority Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                defaultValue={ticket.status}
                onValueChange={(value: TicketStatus) => {
                  const formData = new FormData();
                  formData.append("status", value);
                  fetch(window.location.pathname, {
                    method: "POST",
                    body: formData,
                  });
                }}
                disabled={isUpdating}
              >
                <SelectTrigger className={cn("w-full", getStatusColor(ticket.status as TicketStatus))}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" className={getStatusColor("new")}>New</SelectItem>
                  <SelectItem value="open" className={getStatusColor("open")}>Open</SelectItem>
                  <SelectItem value="pending" className={getStatusColor("pending")}>Pending</SelectItem>
                  <SelectItem value="resolved" className={getStatusColor("resolved")}>Resolved</SelectItem>
                  <SelectItem value="closed" className={getStatusColor("closed")}>Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                defaultValue={ticket.priority}
                onValueChange={(value: TicketPriority) => {
                  const formData = new FormData();
                  formData.append("priority", value);
                  fetch(window.location.pathname, {
                    method: "POST",
                    body: formData,
                  });
                }}
                disabled={isUpdating}
              >
                <SelectTrigger className={cn("w-full", getPriorityColor(ticket.priority as TicketPriority))}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className={getPriorityColor("low")}>Low</SelectItem>
                  <SelectItem value="medium" className={getPriorityColor("medium")}>Medium</SelectItem>
                  <SelectItem value="high" className={getPriorityColor("high")}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Description</h3>
              <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium">Timeline</h3>
              <div className="mt-2 text-muted-foreground">
                Created: {new Date(ticket.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 