import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { getWorkspaceTickets, getTicketStats } from "~/models/ticket.server";
import { getKnowledgeBaseStats, getRecentArticles } from "~/models/article.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { MessageSquare, Clock, AlertCircle, Inbox, Ticket, BookOpen, FileText, PenLine, ExternalLink } from "lucide-react";

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const workspace = await getWorkspace(supabase, params.id, user.id);
  const stats = await getTicketStats(supabase, workspace.id);
  const kbStats = await getKnowledgeBaseStats(supabase, workspace.id);
  const tickets = await getWorkspaceTickets(supabase, workspace.id, { limit: 5 });
  const articles = await getRecentArticles(supabase, workspace.id, 5);

  return json({ 
    workspace, 
    tickets,
    stats,
    kbStats,
    articles
  }, { 
    headers: response.headers 
  });
}

export default function WorkspaceIndex() {
  const { workspace, tickets, stats, kbStats, articles } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 space-y-8">
      {/* Ticket Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Support Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTickets}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Tickets</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newTickets}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highPriorityTickets}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>
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

      {/* Knowledge Base Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Knowledge Base</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kbStats.totalArticles}</div>
              <p className="text-xs text-muted-foreground">Knowledge base size</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kbStats.publishedArticles}</div>
              <p className="text-xs text-muted-foreground">Live articles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <PenLine className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kbStats.draftArticles}</div>
              <p className="text-xs text-muted-foreground">Work in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Updated</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kbStats.recentArticles}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Articles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Articles</CardTitle>
            <CardDescription>Latest knowledge base updates</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/workspace/${workspace.id}/kb`}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {articles.map(article => (
              <div key={article.id} className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={article.status === "published" ? "default" : "secondary"}>
                      {article.status}
                    </Badge>
                    <p className="text-sm font-medium">
                      {article.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
                    {article.tags && article.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{article.tags.join(", ")}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/workspace/${workspace.id}/kb/article/${article.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            {articles.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No articles yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 