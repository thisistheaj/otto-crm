import { json } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation, useOutletContext } from "@remix-run/react";
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import { useState } from "react";
import { supabaseAdmin } from "~/utils/supabase.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { TicketIcon, MessageSquare, BookOpen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Link } from "@remix-run/react";

export async function loader({ request, params }: { request: Request; params: { workspaceSlug: string } }) {
  const response = new Response();
  const supabase = supabaseAdmin

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
  const location = useLocation();
  const isRoot = location.pathname === `/support/${workspace.slug}`;
  
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
              <h1 className="text-2xl font-bold">{workspace.name} Support</h1>
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
        {isRoot ? (
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight">How can we help you today?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get instant help through chat or browse our knowledge base for answers to common questions.
            </p>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <Card className="relative group hover:shadow-lg transition-all">
                <Link to={`/support/${workspace.slug}/ticket/new`} className="absolute inset-0" />
                <CardHeader>
                  <div className="mx-auto rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-center">Start a Chat</CardTitle>
                  <CardDescription className="text-center">
                    Chat with our support team in real-time to get immediate help
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Follow up on previous support tickets
                  </p>
                </CardContent>
              </Card>

              <Card className="relative group hover:shadow-lg transition-all opacity-70">
                <CardHeader>
                  <div className="mx-auto rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-center">Knowledge Base</CardTitle>
                  <CardDescription className="text-center">
                    Find answers in our documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Browse articles and guides
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Outlet context={{ supabase: supabase }} />
        )}
      </main>
    </div>
  );
} 