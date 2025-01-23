import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { createServerSupabase } from "~/utils/supabase.server";
import type { Database } from "~/types/database";

// Get a single document
export async function loader({ request, params }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId, documentId } = params;

  try {
    const { data: document, error } = await supabase
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
      .eq("id", documentId)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) throw error;
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

  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { workspaceId, documentId } = params;

  try {
    // First get the document to get the file_url
    const { data: document, error: fetchError } = await supabase
      .from("kb_documents")
      .select("file_url")
      .eq("id", documentId)
      .eq("workspace_id", workspaceId)
      .single();

    if (fetchError) throw fetchError;
    if (!document) {
      return json({ error: "Document not found" }, { status: 404 });
    }

    // Delete the file from storage
    const fileUrl = document.file_url;
    const filePath = fileUrl.split("/").pop(); // Get the filename from the URL
    if (filePath) {
      const { error: storageError } = await supabase
        .storage
        .from("kb_documents")
        .remove([filePath]);

      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
      }
    }

    // Delete the document record
    const { error: deleteError } = await supabase
      .from("kb_documents")
      .delete()
      .eq("id", documentId)
      .eq("workspace_id", workspaceId);

    if (deleteError) throw deleteError;

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
} 