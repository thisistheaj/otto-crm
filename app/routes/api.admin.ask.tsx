import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { supabaseAdmin } from "~/utils/supabase.server";
import { createRAGChain, processQuery } from "~/utils/rag.server";
import type { Message } from "~/types/rag";

// Utility functions
const validateAdminRequest = (request: Request) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    throw new Response("Missing authorization header", { 
      status: 401,
      statusText: "Unauthorized"
    });
  }
  
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || token !== process.env.ADMIN_API_KEY) {
    console.log("Auth failed:", { scheme, providedToken: token?.slice(0, 4) + "..." });
    throw new Response("Invalid authorization", { 
      status: 401,
      statusText: "Unauthorized"
    });
  }
};

// Route handler
export const action = async ({ request }: ActionFunctionArgs) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    validateAdminRequest(request);
    
    const { messages } = await request.json() as { messages: Message[] };
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "Invalid or empty messages array" }, { status: 400 });
    }

    const chain = createRAGChain(supabaseAdmin);
    const response = await processQuery(chain, messages);

    return json(response);
  } catch (error: unknown) {
    console.error("Error processing RAG request:", error);
    
    // Handle Response errors (like 401) directly
    if (error instanceof Response) {
      return json({ 
        success: false, 
        error: error.statusText || "Unauthorized"
      }, { status: error.status });
    }
    
    if (error instanceof Error) {
      console.error('Detailed error information:', {
        name: error.name,
        message: error.message,
        status: (error as any).status,
        stack: error.stack,
        cause: error.cause
      });
    }

    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}; 