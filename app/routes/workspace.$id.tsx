import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { getWorkspace } from "~/models/workspace.server";

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
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">{workspace.name}</h1>
      <p className="text-muted-foreground">Workspace dashboard coming soon...</p>
    </div>
  );
} 