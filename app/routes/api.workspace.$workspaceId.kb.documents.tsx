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

type Document = Database["public"]["Tables"]["documents"]["Insert"];

// Get all documents
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { workspaceId } = params;

  // Get query parameters for filtering
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");

  try {
    let query = supabase
      .from("documents")
      .select(`
        id,
        title,
        file_name,
        file_path,
        tags,
        status,
        created_at,
        updated_at,
        uploader_id,
        workspace_id
      `)
      .eq("workspace_id", workspaceId);

    // Apply filters
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    if (status) {
      query = query.eq("status", status);
    }

    // Always sort by updated_at desc
    query = query.order("updated_at", { ascending: false });

    const { data: documents, error } = await query;

    if (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }

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

  const { workspaceId } = params;

  try {
    const document = (await request.json()) as Partial<Document>;
    
    if (!document.title || !document.file_name || !document.file_path || !document.uploader_id) {
      return json({
        error: "Missing required fields: title, file_name, file_path, uploader_id"
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("documents")
      .insert([{
        workspace_id: workspaceId,
        title: document.title,
        file_name: document.file_name,
        file_path: document.file_path,
        status: document.status || "draft",
        tags: document.tags || [],
        uploader_id: document.uploader_id
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return json({ document: data });
  } catch (error) {
    console.error("Error creating document:", error);
    return json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
} 