import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RichTextEditor } from "~/components/rich-text-editor";
import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // If we're editing an existing article
  if (params.articleId !== "new") {
    const { data: article } = await supabase
      .from("articles")
      .select("*")
      .eq("id", params.articleId)
      .single();

    if (!article) {
      throw new Error("Article not found");
    }

    return json({ 
      article,
      workspaceId: params.id
    });
  }

  // For new articles
  return json({ 
    article: {
      title: "",
      content: "",
      tags: [],
      status: "draft"
    },
    workspaceId: params.id
  });
};

export default function ArticleEditor() {
  const { article, workspaceId } = useLoaderData<typeof loader>();
  const { supabase } = useOutletContext<{ supabase: SupabaseClient }>();
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (status: 'draft' | 'published' = article.status) => {
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const articleData = {
        title,
        content,
        status,
        workspace_id: workspaceId,
        author_id: user.id,
        tags: [],
      };

      if (article.id) {
        // Update existing article
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', article.id);

        if (error) throw error;
      } else {
        // Create new article
        const { error } = await supabase
          .from('articles')
          .insert([articleData]);

        if (error) throw error;
      }

      // Redirect to knowledge base
      window.location.href = `/workspace/${workspaceId}/kb`;
    } catch (err) {
      console.error('Failed to save article:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {article.id ? "Edit Article" : "New Article"}
        </h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={() => handleSave('published')}
            disabled={isSaving}
          >
            {isSaving ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor
            content={content}
            onChange={setContent}
          />
        </div>
      </div>
    </div>
  );
} 