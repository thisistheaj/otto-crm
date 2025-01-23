import { json } from "@remix-run/node";
import { Outlet, useLoaderData, Link } from "@remix-run/react";
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import { useState } from "react";
import { supabaseAdmin } from "~/utils/supabase.server";
import { Button } from "~/components/ui/button";
import { TicketIcon } from "lucide-react";

export async function loader({ request, params }: { request: Request; params: { workspaceSlug: string } }) {
  const response = new Response();
  const supabase = supabaseAdmin;

  // Get workspace
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', params.workspaceSlug)
    .single();

  if (error || !workspace) {
    console.error('Workspace not found');
    console.error(error);
    throw new Response("Workspace not found", { status: 404 });
  }

  return json({ 
    workspace,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!
    }
  }, { headers: response.headers });
}

export default function SupportLayout() {
  const { workspace, env } = useLoaderData<typeof loader>();
  
  const [supabase] = useState(() => 
    createBrowserClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY
    )
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link to={`/support/${workspace.slug}`} className="hover:text-primary">
                <h1 className="text-2xl font-bold">{workspace.name} Support</h1>
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link to={`/support/${workspace.slug}/ticket/new`}>
                  <TicketIcon className="mr-2 h-4 w-4" />
                  New Ticket
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet context={{ supabase: supabase }} />
      </main>
    </div>
  );
} 