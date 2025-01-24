import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { getWorkspaceTickets, updateTicketStatus, updateTicketPriority } from "~/models/ticket.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { MessageSquare, Ticket } from "lucide-react";
import { Link } from "@remix-run/react";
import { cn } from "~/lib/utils";

type TicketStatus = "new" | "open" | "pending" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high";

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const workspace = await getWorkspace(supabase, params.id, user.id);
  const tickets = await getWorkspaceTickets(supabase, workspace.id);

  return json({ 
    workspace, 
    tickets 
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
  const ticketId = formData.get("ticketId") as string;
  const status = formData.get("status") as string;
  const priority = formData.get("priority") as string;

  if (status) {
    await updateTicketStatus(supabase, ticketId, status);
  }

  if (priority) {
    await updateTicketPriority(supabase, ticketId, priority);
  }

  return json({ success: true }, { headers: response.headers });
}

export default function TicketsRoute() {
  const { workspace, tickets } = useLoaderData<typeof loader>();
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
    <div className="p-8">
      <Card>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.subject}</TableCell>
                  <TableCell className="text-muted-foreground">{ticket.email}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={ticket.status}
                      onValueChange={(value: TicketStatus) => {
                        const formData = new FormData();
                        formData.append("ticketId", ticket.id);
                        formData.append("status", value);
                        fetch(window.location.pathname, {
                          method: "POST",
                          body: formData,
                        });
                      }}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className={cn("w-32", getStatusColor(ticket.status as TicketStatus))}>
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
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={ticket.priority}
                      onValueChange={(value: TicketPriority) => {
                        const formData = new FormData();
                        formData.append("ticketId", ticket.id);
                        formData.append("priority", value);
                        fetch(window.location.pathname, {
                          method: "POST",
                          body: formData,
                        });
                      }}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className={cn("w-32", getPriorityColor(ticket.priority as TicketPriority))}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className={getPriorityColor("low")}>Low</SelectItem>
                        <SelectItem value="medium" className={getPriorityColor("medium")}>Medium</SelectItem>
                        <SelectItem value="high" className={getPriorityColor("high")}>High</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/workspace/${workspace.id}/tickets/${ticket.id}`}>
                          <Ticket className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/workspace/${workspace.id}/tickets/${ticket.id}/chat`}>
                          <MessageSquare className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
} 