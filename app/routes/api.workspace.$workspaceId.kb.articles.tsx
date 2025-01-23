import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

type Article = Database["public"]["Tables"]["articles"]["Insert"];

// Get all articles
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { workspaceId } = params;

  // Get query parameters for filtering
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");

  try {
    let query = supabase
      .from("articles")
      .select(`
        id,
        title,
        content,
        tags,
        status,
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
    if (status) {
      query = query.eq("status", status);
    }

    // Always sort by updated_at desc
    query = query.order("updated_at", { ascending: false });

    const { data: articles, error } = await query;

    if (error) {
      console.error("Error fetching articles:", error);
      throw error;
    }

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

  const { workspaceId } = params;

  try {
    const article = (await request.json()) as Partial<Article>;
    
    if (!article.title || !article.content || !article.author_id) {
      return json({
        error: "Missing required fields: title, content, author_id"
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("articles")
      .insert([{
        workspace_id: workspaceId,
        title: article.title,
        content: article.content,
        status: article.status || "draft",
        tags: article.tags || [],
        author_id: article.author_id
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return json({ article: data });
  } catch (error) {
    console.error("Error creating article:", error);
    return json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
} 