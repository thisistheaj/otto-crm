import { json, redirect, unstable_parseMultipartFormData } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";
import { useState } from "react";

export const loader = async ({ request }: { request: Request }) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return redirect("/login", { headers: response.headers });
  }

  // Fetch user's notes
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch user's files
  const { data: files } = await supabase
    .storage
    .from('user-files')
    .list(session.user.id);

  return json({ 
    email: session.user.email,
    notes: notes || [],
    files: files || [],
  }, { 
    headers: response.headers 
  });
};

export const action = async ({ request }: { request: Request }) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return redirect("/login", { headers: response.headers });
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "create_note") {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    const { error } = await supabase
      .from('notes')
      .insert([
        { 
          title, 
          content,
          user_id: session.user.id 
        }
      ]);

    if (error) {
      return json({ error: error.message }, { headers: response.headers });
    }
  }

  if (action === "delete_note") {
    const noteId = formData.get("noteId") as string;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', session.user.id);

    if (error) {
      return json({ error: error.message }, { headers: response.headers });
    }
  }

  if (action === "upload_file") {
    const file = formData.get("file") as File;
    
    const { error } = await supabase
      .storage
      .from('user-files')
      .upload(`${session.user.id}/${file.name}`, file);

    if (error) {
      return json({ error: error.message }, { headers: response.headers });
    }
  }

  if (action === "delete_file") {
    const filePath = formData.get("filePath") as string;

    const { error } = await supabase
      .storage
      .from('user-files')
      .remove([`${session.user.id}/${filePath}`]);

    if (error) {
      return json({ error: error.message }, { headers: response.headers });
    }
  }

  return json({ success: true }, { headers: response.headers });
};

export default function Protected() {
  const { email, notes, files } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="container py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome Back!</CardTitle>
          <CardDescription>
            You are logged in as {email}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Form action="/logout" method="post">
            <Button variant="destructive" type="submit">Sign Out</Button>
          </Form>
        </CardFooter>
      </Card>

      {actionData?.error && (
        <Alert variant="destructive">
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Notes Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Notes</CardTitle>
              <Dialog open={isNewNoteOpen} onOpenChange={setIsNewNoteOpen}>
                <DialogTrigger asChild>
                  <Button>New Note</Button>
                </DialogTrigger>
                <DialogContent>
                  <Form method="post" onSubmit={() => setIsNewNoteOpen(false)}>
                    <input type="hidden" name="_action" value="create_note" />
                    <DialogHeader>
                      <DialogTitle>Create New Note</DialogTitle>
                      <DialogDescription>
                        Add a new note to your collection
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" placeholder="Note title" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea id="content" name="content" placeholder="Note content" required />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Note"}
                      </Button>
                    </DialogFooter>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notes yet. Create your first note!
              </p>
            ) : (
              notes.map((note: any) => (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <Form method="post" className="inline">
                        <input type="hidden" name="_action" value="delete_note" />
                        <input type="hidden" name="noteId" value={note.id} />
                        <Button variant="ghost" size="sm" type="submit">
                          Delete
                        </Button>
                      </Form>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Files Section */}
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form method="post" encType="multipart/form-data">
              <input type="hidden" name="_action" value="upload_file" />
              <div className="flex gap-2">
                <Input
                  type="file"
                  name="file"
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </Form>
            <Separator />
            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No files uploaded yet
              </p>
            ) : (
              <div className="space-y-2">
                {files.map((file: any) => (
                  <div key={file.name} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Form method="post" className="inline">
                      <input type="hidden" name="_action" value="delete_file" />
                      <input type="hidden" name="filePath" value={file.name} />
                      <Button variant="ghost" size="sm" type="submit">
                        Delete
                      </Button>
                    </Form>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 