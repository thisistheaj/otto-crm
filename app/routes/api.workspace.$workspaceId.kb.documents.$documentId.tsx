import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// Get a single document
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { workspaceId, documentId } = params;

  try {
    const { data: document, error } = await supabase
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
      .eq("id", documentId)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) {
      console.error("Error fetching document:", error);
      throw error;
    }
    if (!document) {
      return json({ error: "Document not found" }, { status: 404 });
    }

    return json({ document });
  } catch (error) {
    console.error("Error fetching document:", error);
    return json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// Delete document
export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { workspaceId, documentId } = params;

  try {
    // First get the document to get the file path
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("file_path")
      .eq("id", documentId)
      .eq("workspace_id", workspaceId)
      .single();

    if (fetchError) {
      console.error("Error fetching document:", fetchError);
      throw fetchError;
    }
    if (!document) {
      return json({ error: "Document not found" }, { status: 404 });
    }

    // Delete the file from storage
    const { error: storageError } = await supabase
      .storage
      .from("kb-documents")
      .remove([document.file_path]);

    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
    }

    // Delete the document record
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      console.error("Error deleting document:", deleteError);
      throw deleteError;
    }

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
} 