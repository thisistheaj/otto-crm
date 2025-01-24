import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useOutletContext, useSubmit } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";
import { getProfile } from "~/models/profile.server";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { LogOut, CircleUserRound } from "lucide-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { WorkspaceNav } from "~/components/workspace-nav";
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [workspace, profile] = await Promise.all([
    getWorkspace(supabase, params.id, user.id),
    getProfile(supabase, user.id)
  ]);

  return json({ 
    workspace,
    profile,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!
    }
  }, { headers: response.headers });
}

export async function action({ request }: { request: Request }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "toggle_availability") {
    const isAvailable = formData.get("is_available") === "true";
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ is_available: isAvailable })
        .eq('id', user.id);
    }
    
    return json({ success: true }, { headers: response.headers });
  }
  
  // Handle logout
  await supabase.auth.signOut();
  return redirect("/login", {
    headers: response.headers
  });
}

export default function WorkspaceLayout() {
  const { workspace, profile, env } = useLoaderData<typeof loader>();
  const rootContext = useOutletContext<{ supabase: SupabaseClient }>();
  const submit = useSubmit();
  
  const handleLogout = () => {
    submit(null, { method: "post" });
  };

  const toggleAvailability = (isAvailable: boolean) => {
    const formData = new FormData();
    formData.append("action", "toggle_availability");
    formData.append("is_available", isAvailable.toString());
    submit(formData, { method: "post" });
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col fixed h-screen">
        {/* Workspace header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={undefined} />
              <AvatarFallback>{workspace.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <h2 className="text-lg font-semibold truncate">{workspace.name}</h2>
            </div>
          </div>
        </div>

        {/* Scrollable navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-1 p-4">
            <WorkspaceNav workspaceId={workspace.id} workspaceSlug={workspace.slug} />
          </nav>
        </div>

        {/* User profile and logout section */}
        <div className="border-t">
          {/* User profile section */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>
                  <CircleUserRound className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile.full_name || 'Anonymous'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile.is_available ? 'Available' : 'Away'}
                </p>
              </div>
              <Switch
                checked={profile.is_available}
                onCheckedChange={toggleAvailability}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>

          {/* Logout button */}
          <div className="p-4 pt-0">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground" 
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64">
        <Outlet context={rootContext} />
      </div>
    </div>
  );
} 