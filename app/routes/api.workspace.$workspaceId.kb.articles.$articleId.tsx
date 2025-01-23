import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { createServerSupabase } from "~/utils/supabase.server";
import type { Database } from "~/types/database";

type ArticleUpdate = Database["public"]["Tables"]["kb_articles"]["Update"];

// Get a single article
export async function loader({ request, params }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId, articleId } = params;

  try {
    const { data: article, error } = await supabase
      .from("kb_articles")
      .select(`
        id,
        title,
        content,
        published,
        created_at,
        updated_at,
        author_id,
        workspace_id
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
  if (request.method !== "PATCH" && request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId, articleId } = params;

  // Handle DELETE
  if (request.method === "DELETE") {
    try {
      const { error } = await supabase
        .from("kb_articles")
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
      .from("kb_articles")
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