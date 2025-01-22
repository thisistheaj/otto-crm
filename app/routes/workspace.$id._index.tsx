import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { getWorkspaceTickets } from "~/models/ticket.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { 
  MessageSquare, 
  Settings, 
  Users, 
  Clock,
  Timer,
  BarChart3,
  MessagesSquare,
  Inbox,
  BookOpen,
  Search,
  FileText,
  Star,
  PlusCircle
} from "lucide-react";
import { Input } from "~/components/ui/input";

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const workspace = await getWorkspace(supabase, params.id, session.user.id);
  
  // Get recent tickets
  const tickets = await getWorkspaceTickets(supabase, workspace.id, {
    limit: 5
  });

  // Get ticket stats
  const openTickets = tickets.filter(t => t.status === "open").length;
  const highPriorityTickets = tickets.filter(t => t.priority === "high").length;

  return json({ 
    workspace, 
    tickets,
    stats: {
      openTickets,
      highPriorityTickets
    }
  }, { 
    headers: response.headers 
  });
}

export default function WorkspaceIndex() {
  const { workspace, tickets, stats } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            {stats.highPriorityTickets > 0 && (
              <p className="text-xs text-destructive">{stats.highPriorityTickets} high priority</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Latest support requests</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/workspace/${workspace.id}/tickets`}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={ticket.priority === "high" ? "destructive" : "secondary"}>
                      {ticket.priority}
                    </Badge>
                    <p className="text-sm font-medium">
                      {ticket.subject}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ticket.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                    {ticket.status}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/workspace/${workspace.id}/tickets/${ticket.id}/chat`}>
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 