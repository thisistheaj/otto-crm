import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { OpenAI } from "openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { traceable } from "langsmith/traceable";
import { supabaseAdmin } from "~/utils/supabase.server";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Utility functions
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

const getArticleContent = (article: any) => {
  return `${article.title}\n\n${article.content}`;
};

// Traced functions for LangSmith observability
const getDocumentContent = traceable(
  async (document: any) => {
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
        const loader = new PDFLoader(tempPath);
        const docs = await loader.load();
        const fullText = docs.map(doc => doc.pageContent).join('\n\n');
        return `${document.title}\n\n${fullText}`;
      } finally {
        unlinkSync(tempPath);
      }
    } catch (error) {
      console.error(`Error processing PDF ${document.title}:`, error);
      return `${document.title}\n\nUnable to process PDF content`;
    }
  },
  { name: "PDF Processing", run_type: "tool" }
);

const createEmbedding = traceable(
  async (text: string) => {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  },
  { name: "Create Embedding", run_type: "tool" }
);

const buildVectorDatabase = traceable(
  async (request: Request) => {
    validateAdminRequest(request);

    // Get all published content
    const [articles, documents] = await Promise.all([
      supabaseAdmin.from("articles").select("*").eq("status", "published"),
      supabaseAdmin.from("documents").select("*").eq("status", "published")
    ]);

    if (articles.error) throw articles.error;
    if (documents.error) throw documents.error;

    // Clear existing embeddings
    const { error: deleteError } = await supabaseAdmin
      .from("kb_embeddings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) throw deleteError;

    // Process articles
    for (const article of articles.data) {
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
    for (const document of documents.data) {
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

    return { 
      success: true,
      counts: {
        articles: articles.data.length,
        documents: documents.data.length
      }
    };
  },
  { name: "Build Vector Database", run_type: "chain" }
);

// Route handler
export const action = async ({ request }: ActionFunctionArgs) => {
  console.log('LangSmith Environment:', {
    LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY?.slice(0, 4) + '...' || '[MISSING]',
    LANGSMITH_ENDPOINT: process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
    LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT || 'otto-crm',
    NODE_ENV: process.env.NODE_ENV
  });

  try {
    const result = await buildVectorDatabase(request);
    return json(result);
  } catch (error: unknown) {
    console.error("Error building vector database:", error);
    
    if (error instanceof Error) {
      console.error('Detailed error information:', {
        name: error.name,
        message: error.message,
        status: (error as any).status,
        response: (error as any).response?.data || (error as any).response,
        stack: error.stack,
        cause: error.cause,
        config: {
          apiKey: process.env.LANGSMITH_API_KEY ? '[PRESENT]' : '[MISSING]',
          endpoint: process.env.LANGSMITH_ENDPOINT,
          projectName: process.env.LANGSMITH_PROJECT
        }
      });
    }

    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}; 