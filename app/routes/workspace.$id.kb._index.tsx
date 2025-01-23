import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "~/components/ui/dialog";
import { useState } from "react";
import { DocumentUpload } from "~/components/document-upload";
import { PDFViewer } from "~/components/pdf-viewer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";

interface Document {
  id: string;
  title: string;
  file_path: string;
  status: 'draft' | 'published';
  type: 'document';
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Fetch articles and documents for the workspace
  const [articlesResult, documentsResult] = await Promise.all([
    supabase
      .from("articles")
      .select("*")
      .eq("workspace_id", params.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", params.id)
      .order("updated_at", { ascending: false })
  ]);

  // Combine and sort by updated_at
  const items = [
    ...(articlesResult.data || []).map(article => ({ 
      ...article, 
      type: "article" as const 
    })),
    ...(documentsResult.data || []).map(document => ({ 
      ...document, 
      type: "document" as const 
    }))
  ].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return json({ 
    items,
    workspaceId: params.id
  }, {
    headers: response.headers
  });
};

export default function KnowledgeBase() {
  const { items, workspaceId } = useLoaderData<typeof loader>();
  const { supabase } = useOutletContext<{ supabase: SupabaseClient }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<(Document & { url: string }) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.type === "article" && item.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewDocument = async (document: Document) => {
    const { data } = await supabase.storage
      .from('kb-documents')
      .createSignedUrl(document.file_path, 60); // URL expires in 60 seconds

    if (data?.signedUrl) {
      setSelectedDocument({
        ...document,
        url: data.signedUrl,
      });
    }
  };

  const handlePublishDocument = async () => {
    if (!selectedDocument) return;
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: selectedDocument.status === 'published' ? 'draft' : 'published' })
        .eq('id', selectedDocument.id);

      if (error) throw error;

      // Update local state
      setSelectedDocument(prev => prev ? {
        ...prev,
        status: prev.status === 'published' ? 'draft' : 'published'
      } : null);

    } catch (err) {
      console.error('Failed to update document status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;
    setIsDeleting(true);

    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('kb-documents')
        .remove([selectedDocument.file_path]);

      if (storageError) throw storageError;

      // Then delete the record
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', selectedDocument.id);

      if (dbError) throw dbError;

      // Close dialog and refresh page
      setSelectedDocument(null);
      window.location.reload();

    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <a href={`/workspace/${workspaceId}/kb/article/new`}>
              New Article
            </a>
          </Button>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>Upload Document</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <DocumentUpload 
                workspaceId={workspaceId!} 
                onSuccess={() => setIsUploadOpen(false)}
                supabase={supabase}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search knowledge base..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.type === "article" ? "Article" : "Document"}
                </TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    item.status === "published" 
                      ? "bg-green-50 text-green-700" 
                      : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell>
                  {item.tags?.length > 0 
                    ? item.tags.join(", ") 
                    : <span className="text-muted-foreground text-sm">No tags</span>
                  }
                </TableCell>
                <TableCell>
                  {new Date(item.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {item.type === "article" ? (
                    <Button asChild variant="ghost" size="sm">
                      <a href={`/workspace/${workspaceId}/kb/article/${item.id}`}>
                        Edit
                      </a>
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDocument(item as Document)}
                    >
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <PDFViewer url={selectedDocument.url} />
          )}
          <DialogFooter className="flex justify-between items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the document.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteDocument}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button 
              onClick={handlePublishDocument}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : (selectedDocument?.status === 'published' ? "Unpublish" : "Publish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 