import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // Create a Supabase client with the service role key
  const supabase = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
  
  
  const { data: workspace, error: workspaceError } = await supabase 
    .from("workspaces")
    .select("*")
    .eq("slug", params.workspaceSlug)
    .single();

  if (workspaceError || !workspace) {
    throw new Response("Workspace not found", { status: 404 });
  }

  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", params.articleId)
    .eq("workspace_id", workspace.id)
    .eq("status", "published")
    .single();

  if (error || !article) {
    throw new Response("Article not found", { status: 404 });
  }

  return json({ article });
};

export default function ArticleViewer() {
  const { article } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">{article.title}</h1>
          <div className="flex items-center text-sm text-gray-500">
            <span>Last updated: {new Date(article.updated_at).toLocaleDateString()}</span>
            {article.tags?.length > 0 && (
              <>
                <span className="mx-2">•</span>
                <div className="flex gap-2">
                  {article.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div 
          className="dark prose max-w-none text-gray-100 [&_h2]:text-gray-100 [&_strong]:text-gray-100"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </div>
  );
} 