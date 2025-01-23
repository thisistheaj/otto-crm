import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";
import { requireApiKey } from "~/utils/api.server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];

// Get a single article
export async function loader({ request, params }: LoaderFunctionArgs) {
  requireApiKey(request);
  const { workspaceId, articleId } = params;

  try {
    const { data: article, error } = await supabase
      .from("articles")
      .select(`
        id,
        title,
        content,
        status,
        created_at,
        updated_at,
        author_id,
        workspace_id,
        tags
      `)
      .eq("id", articleId)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) throw error;
    if (!article) {
      return json({ error: "Article not found" }, { status: 404 });
    }

    return json({ article });
  } catch (error) {
    console.error("Error fetching article:", error);
    return json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// Update or delete article
export async function action({ request, params }: ActionFunctionArgs) {
  requireApiKey(request);
  if (request.method !== "PATCH" && request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { workspaceId, articleId } = params;

  // Handle DELETE
  if (request.method === "DELETE") {
    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId)
        .eq("workspace_id", workspaceId);

      if (error) throw error;
      return json({ success: true });
    } catch (error) {
      console.error("Error deleting article:", error);
      return json(
        { error: "Failed to delete article" },
        { status: 500 }
      );
    }
  }

  // Handle PATCH
  try {
    const updates = (await request.json()) as Partial<ArticleUpdate>;
    
    // Don't allow updating workspace_id
    delete updates.workspace_id;
    
    // Set updated_at
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("articles")
      .update(updates)
      .eq("id", articleId)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return json({ error: "Article not found" }, { status: 404 });
    }

    return json({ article: data });
  } catch (error) {
    console.error("Error updating article:", error);
    return json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
} 