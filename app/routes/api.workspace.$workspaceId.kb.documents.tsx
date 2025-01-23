import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { createServerSupabase } from "~/utils/supabase.server";
import type { Database } from "~/types/database";

type Document = Database["public"]["Tables"]["kb_documents"]["Insert"];

// Get all documents
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
      .from("kb_documents")
      .select(`
        id,
        title,
        file_url,
        file_type,
        published,
        created_at,
        updated_at,
        author_id,
        workspace_id
      `)
      .eq("workspace_id", workspaceId);

    // Apply filters
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    if (published !== null) {
      query = query.eq("published", published === "true");
    }

    // Always sort by updated_at desc
    query = query.order("updated_at", { ascending: false });

    const { data: documents, error } = await query;

    if (error) throw error;

    return json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// Create new document
export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId } = params;

  try {
    const document = (await request.json()) as Partial<Document>;
    
    if (!document.title || !document.file_url || !document.file_type) {
      return json({
        error: "Missing required fields: title, file_url, file_type"
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("kb_documents")
      .insert([{
        workspace_id: workspaceId,
        title: document.title,
        file_url: document.file_url,
        file_type: document.file_type,
        published: document.published ?? false,
        author_id: document.author_id
      }])
      .select()
      .single();

    if (error) throw error;

    return json({ document: data });
  } catch (error) {
    console.error("Error creating document:", error);
    return json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
} 