import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { getWorkspaceTickets, updateTicketStatus, updateTicketPriority } from "~/models/ticket.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
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
import { MessageSquare } from "lucide-react";
import { Link } from "@remix-run/react";

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
                  <TableCell>{ticket.email}</TableCell>
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
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
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
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/workspace/${workspace.id}/tickets/${ticket.id}/chat`}>
                        <MessageSquare className="h-4 w-4" />
                      </Link>
                    </Button>
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