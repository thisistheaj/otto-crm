import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { Form } from "@remix-run/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { SupabaseClient } from "@supabase/supabase-js";

interface DocumentUploadProps {
  workspaceId: string;
  onSuccess?: () => void;
  supabase: SupabaseClient;
}

export function DocumentUpload({ workspaceId, onSuccess, supabase }: DocumentUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title") as string;
    const file = fileRef.current?.files?.[0];

    if (!file) {
      setError("Please select a file");
      return;
    }

    if (!title) {
      setError("Please enter a title");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Upload file to Supabase Storage
      const filePath = `${workspaceId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("kb-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          workspace_id: workspaceId,
          title,
          file_name: file.name,
          file_path: filePath,
          status: "draft",
          tags: [],
          uploader_id: user.id
        });

      if (insertError) throw insertError;

      form.reset();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="Document title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File</Label>
        <Input
          ref={fileRef}
          id="file"
          name="file"
          type="file"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button 
        type="submit" 
        className="w-full"
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Upload Document"}
      </Button>
    </Form>
  );
} 