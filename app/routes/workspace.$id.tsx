import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { 
  MessageSquare, 
  Settings, 
  Users, 
  Inbox,
  BookOpen,
} from "lucide-react";

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

export default function WorkspaceLayout() {
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
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to={`/workspace/${workspace.id}`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to={`/workspace/${workspace.id}/tickets`}>
              <Inbox className="mr-2 h-4 w-4" />
              Tickets
            </Link>
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
      <div className="flex-1">
        <Outlet context={{ workspace }} />
      </div>
    </div>
  );
} 