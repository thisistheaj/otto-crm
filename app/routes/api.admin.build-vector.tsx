import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { supabaseAdmin } from "~/utils/supabase.server";
import { OpenAI } from "openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

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

// Get text content from a document by downloading and parsing the PDF
const getDocumentContent = async (document: any) => {
  try {
    // Download the PDF from Supabase storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('kb-documents')
      .download(document.file_path);

    if (downloadError) throw downloadError;
    if (!fileData) throw new Error('No file data received');

    // Create a temporary file
    const tempPath = join(tmpdir(), `${document.id}.pdf`);
    const arrayBuffer = await fileData.arrayBuffer();
    writeFileSync(tempPath, Buffer.from(arrayBuffer));
    
    try {
      // Create a PDFLoader instance
      const loader = new PDFLoader(tempPath);
      
      // Load and parse the PDF
      const docs = await loader.load();
      
      // Combine all pages into one text
      const fullText = docs.map(doc => doc.pageContent).join('\n\n');
      
      return `${document.title}\n\n${fullText}`;
    } finally {
      // Clean up temporary file
      unlinkSync(tempPath);
    }
  } catch (error) {
    console.error(`Error processing PDF ${document.title}:`, error);
    // Return a minimal content if we can't process the PDF
    return `${document.title}\n\nUnable to process PDF content`;
  }
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
      const content = await getDocumentContent(document);
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