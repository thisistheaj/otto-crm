import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { supabaseAdmin } from "~/utils/supabase.server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Validate the request has the admin API key
const validateAdminRequest = (request: Request) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    throw new Response("Missing authorization header", { status: 401 });
  }
  
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || token !== process.env.ADMIN_API_KEY) {
    throw new Response("Invalid authorization", { status: 401 });
  }
};

// Get text content from an article
const getArticleContent = (article: any) => {
  return `${article.title}\n\n${article.content}`;
};

// Get text content from a document
const getDocumentContent = (document: any) => {
  return `${document.title}\n\n${document.file_name}`;
};

// Create embedding for text using OpenAI
const createEmbedding = async (text: string) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Validate admin request
  validateAdminRequest(request);

  try {
    // Get all published articles
    const { data: articles, error: articlesError } = await supabaseAdmin
      .from("articles")
      .select("*")
      .eq("status", "published");

    if (articlesError) throw articlesError;

    // Get all published documents
    const { data: documents, error: documentsError } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("status", "published");

    if (documentsError) throw documentsError;

    // Clear existing embeddings
    const { error: deleteError } = await supabaseAdmin
      .from("kb_embeddings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) throw deleteError;

    // Process articles
    for (const article of articles) {
      const content = getArticleContent(article);
      const embedding = await createEmbedding(content);
      
      const { error: insertError } = await supabaseAdmin
        .from("kb_embeddings")
        .insert({
          workspace_id: article.workspace_id,
          content_type: "article",
          content_id: article.id,
          content_title: article.title,
          content_text: content,
          embedding
        });

      if (insertError) throw insertError;
    }

    // Process documents
    for (const document of documents) {
      const content = getDocumentContent(document);
      const embedding = await createEmbedding(content);
      
      const { error: insertError } = await supabaseAdmin
        .from("kb_embeddings")
        .insert({
          workspace_id: document.workspace_id,
          content_type: "document",
          content_id: document.id,
          content_title: document.title,
          content_text: content,
          embedding
        });

      if (insertError) throw insertError;
    }

    return json({ 
      success: true,
      counts: {
        articles: articles.length,
        documents: documents.length
      }
    });

  } catch (error: unknown) {
    console.error("Error building vector database:", error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}; 