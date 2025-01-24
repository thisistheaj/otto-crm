import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useOutletContext, useSubmit } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { LogOut } from "lucide-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { WorkspaceNav } from "~/components/workspace-nav";

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const workspace = await getWorkspace(supabase, params.id, user.id);
  return json({ 
    workspace,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!
    }
  }, { headers: response.headers });
}

export async function action({ request }: { request: Request }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  
  await supabase.auth.signOut();
  return redirect("/login", {
    headers: response.headers
  });
}

export default function WorkspaceLayout() {
  const { workspace, env } = useLoaderData<typeof loader>();
  const rootContext = useOutletContext<{ supabase: SupabaseClient }>();
  const submit = useSubmit();
  
  const handleLogout = () => {
    submit(null, { method: "post" });
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={undefined} />
            <AvatarFallback>{workspace.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-lg font-semibold truncate">{workspace.name}</h2>
          </div>
        </div>
        <div className="space-y-1 mt-4 flex-1">
          <WorkspaceNav workspaceId={workspace.id} />
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <Outlet context={rootContext} />
      </div>
    </div>
  );
} 