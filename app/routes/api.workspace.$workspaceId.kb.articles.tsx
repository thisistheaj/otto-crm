import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { createServerSupabase } from "~/utils/supabase.server";
import type { Database } from "~/types/database";

type Article = Database["public"]["Tables"]["kb_articles"]["Insert"];

// Get all articles
export async function loader({ request, params }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId } = params;

  // Get query parameters for filtering
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const published = url.searchParams.get("published");

  try {
    let query = supabase
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
      .eq("workspace_id", workspaceId);

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    if (published !== null) {
      query = query.eq("published", published === "true");
    }

    // Always sort by updated_at desc
    query = query.order("updated_at", { ascending: false });

    const { data: articles, error } = await query;

    if (error) throw error;

    return json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// Create new article
export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId } = params;

  try {
    const article = (await request.json()) as Partial<Article>;
    
    if (!article.title || !article.content) {
      return json({
        error: "Missing required fields: title, content"
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("kb_articles")
      .insert([{
        workspace_id: workspaceId,
        title: article.title,
        content: article.content,
        published: article.published ?? false,
        author_id: article.author_id
      }])
      .select()
      .single();

    if (error) throw error;

    return json({ article: data });
  } catch (error) {
    console.error("Error creating article:", error);
    return json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
} 