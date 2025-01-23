import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from "@supabase/supabase-js";
import { PDFViewer } from "~/components/pdf-viewer";
import type { Database } from "~/types/database";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // First get the workspace ID from the slug
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", params.workspaceSlug)
    .single();

  if (workspaceError || !workspace) {
    throw new Response("Workspace not found", { status: 404 });
  }

  // Fetch document metadata
  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.documentId)
    .eq("workspace_id", workspace.id)
    .eq("status", "published")
    .single();

  if (error || !document) {
    throw new Response("Document not found", { status: 404 });
  }

  // Get signed URL for the document
  const { data: signedUrl } = await supabase.storage
    .from('kb-documents')
    .createSignedUrl(document.file_path, 300); // URL valid for 5 minutes

  if (!signedUrl?.signedUrl) {
    throw new Response("Document not accessible", { status: 404 });
  }

  return json({ 
    document,
    signedUrl: signedUrl.signedUrl
  });
};

export default function DocumentViewer() {
  const { document, signedUrl } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{document.title}</h1>
          <div className="flex items-center text-sm text-gray-500">
            <span>Last updated: {new Date(document.updated_at).toLocaleDateString()}</span>
            {document.tags?.length > 0 && (
              <>
                <span className="mx-2">•</span>
                <div className="flex gap-2">
                  {document.tags.map((tag: string) => (
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

        <div className="h-[800px] border rounded-lg">
          <PDFViewer url={signedUrl} />
        </div>
      </div>
    </div>
  );
} 