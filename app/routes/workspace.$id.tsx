import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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

// Mock data - will be replaced with real data later
const mockData = {
  stats: {
    activeChats: 3,
    avgResponseTime: "2m",
    resolvedToday: 28,
    openTickets: 5
  },
  recentConversations: [
    { 
      id: 1, 
      customer: "John Smith",
      message: "Having trouble with checkout",
      status: "active",
      time: "2m ago",
      priority: "high"
    },
    { 
      id: 2, 
      customer: "Emma Davis",
      message: "Where is my order #1234?",
      status: "waiting",
      time: "5m ago",
      priority: "medium"
    },
    { 
      id: 3, 
      customer: "Mike Johnson",
      message: "Need to change shipping address",
      status: "active",
      time: "10m ago",
      priority: "low"
    }
  ],
  openTickets: [
    {
      id: 1,
      customer: "Sarah Wilson",
      issue: "Refund request",
      status: "needs_review",
      time: "1h ago"
    },
    {
      id: 2,
      customer: "David Brown",
      issue: "Product damaged",
      status: "in_progress",
      time: "2h ago"
    },
    {
      id: 3,
      customer: "Lisa Anderson",
      issue: "Wrong size received",
      status: "pending",
      time: "3h ago"
    }
  ],
  knowledgeBase: {
    popularArticles: [
      {
        id: 1,
        title: "How to Process Refunds",
        category: "Payments",
        views: 1234,
        lastUpdated: "2d ago"
      },
      {
        id: 2,
        title: "Shipping Policy Overview",
        category: "Shipping",
        views: 982,
        lastUpdated: "1w ago"
      },
      {
        id: 3,
        title: "Common Order Issues",
        category: "Orders",
        views: 756,
        lastUpdated: "3d ago"
      }
    ],
    categories: [
      { id: 1, name: "Getting Started", articles: 12 },
      { id: 2, name: "Orders & Shipping", articles: 24 },
      { id: 3, name: "Returns & Refunds", articles: 18 },
      { id: 4, name: "Technical Support", articles: 31 }
    ]
  }
};

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const workspace = await getWorkspace(supabase, params.id, session.user.id);
  return json({ workspace }, { headers: response.headers });
}

export default function Workspace() {
  const { workspace } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={undefined} />
            <AvatarFallback>{workspace.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-lg font-semibold truncate">{workspace.name}</h2>
          </div>
        </div>
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start">
            <MessagesSquare className="mr-2 h-4 w-4" />
            Live Chat
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Inbox className="mr-2 h-4 w-4" />
            Tickets
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <BookOpen className="mr-2 h-4 w-4" />
            Knowledge Base
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            Team
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.stats.activeChats}</div>
              <p className="text-xs text-muted-foreground">2 waiting for response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.stats.avgResponseTime}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.stats.resolvedToday}</div>
              <p className="text-xs text-muted-foreground">+5 from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.stats.openTickets}</div>
              <p className="text-xs text-muted-foreground">2 high priority</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversations and Open Tickets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Conversations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>Active and recent customer chats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.recentConversations.map(chat => (
                  <div key={chat.id} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          chat.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <p className="text-sm font-medium leading-none">
                          {chat.customer}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {chat.message}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {chat.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Open Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Open Tickets</CardTitle>
              <CardDescription>Issues that need resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.openTickets.map(ticket => (
                  <div key={ticket.id} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          ticket.status === 'needs_review' ? 'bg-red-100 text-red-700' :
                          ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </div>
                        <p className="text-sm font-medium leading-none">
                          {ticket.customer}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {ticket.issue}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {ticket.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

                {/* Knowledge Base Quick Access */}
                <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Knowledge Base</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search articles..." className="pl-8" />
              </div>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Article
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Popular Articles */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Popular Articles</CardTitle>
                <CardDescription>Frequently accessed documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.knowledgeBase.popularArticles.map(article => (
                    <div key={article.id} className="flex items-center">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {article.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{article.category}</span>
                          <span>•</span>
                          <span>{article.views} views</span>
                          <span>•</span>
                          <span>Updated {article.lastUpdated}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Browse by topic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockData.knowledgeBase.categories.map(category => (
                    <Button
                      key={category.id}
                      variant="ghost"
                      className="w-full justify-between"
                    >
                      <span>{category.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {category.articles} articles
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>


      </div>
    </div>
  );
} 