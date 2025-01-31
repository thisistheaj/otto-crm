import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import type { Document } from "@langchain/core/documents";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message, Citation, RagResponse } from "~/types/rag";
import { convertToLangChainHistory } from "~/types/rag";
import { createServerClient } from "@supabase/auth-helpers-remix";

// Templates
const QUERY_TEMPLATE = `Rewrite this question for semantic search.
Chat History: {chat_history}
Question: {question}
Return only the rewritten query.`;

const QUERY_REWRITE_TEMPLATE = `You are an AI assistant optimizing search queries for semantic vector search.
Given the user's question and chat history, rewrite the question to be more effective for semantic search.

Focus on:
- Key concepts and terminology
- Removing conversational elements
- Including relevant context from chat history
- Using synonyms and related terms
- Keeping the query concise but complete

Chat History:
{chat_history}

Original Question: {question}

Rewrite the question for semantic search. Return ONLY the rewritten query with no explanation or additional text.`;

const RESPONSE_TEMPLATE = `You are an AI assistant for an e-commerce support system. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Always include citations when you use information from the context.

Context:
{context}

Chat History:
{chat_history}

Question: {question}

Analyze the situation and determine if this response should set the ticket status to 'pending'.
Set status to 'pending' if:
1. You're providing a complete solution that needs customer verification
2. You're suggesting specific steps for the customer to try
3. You're answering their question fully and waiting for confirmation

Return your response in the following JSON format (replace the values with your actual response):
{{
  "setStatus": "pending" or false,
  "response": "Your helpful response here, including citations using [Document Title] format"
}}

Your response should:
- Be helpful and professional
- Include citations by referencing document titles in square brackets, e.g. [Solar Panel Installation Guide]
- Be properly escaped for JSON

Format the response as valid JSON.`;

interface ChainInput {
  question: string;
  chat_history: any[];
}

export const createRAGChain = (supabase: SupabaseClient) => {
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: "kb_embeddings",
    queryName: "match_kb_embeddings"
  });

  const model = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7
  });

  // Use a lower temperature for query rewriting
  const queryRewriteModel = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.0
  });

  const queryRewritePrompt = PromptTemplate.fromTemplate(QUERY_REWRITE_TEMPLATE);
  const responsePrompt = PromptTemplate.fromTemplate(RESPONSE_TEMPLATE);

  // Create query rewriting chain
  const queryRewriter = RunnableSequence.from([
    {
      question: (input: ChainInput) => input.question,
      chat_history: (input: ChainInput) => 
        input.chat_history.map(msg => `${msg.type}: ${msg.text}`).join("\n")
    },
    queryRewritePrompt,
    queryRewriteModel,
    new StringOutputParser()
  ]).withConfig({ runName: "Query_Rewriter" });

  // Create retriever chain that uses the rewritten query
  const retriever = RunnableSequence.from([
    async (input: ChainInput) => {
      const rewrittenQuery = await queryRewriter.invoke(input);
      const docs = await vectorStore.similaritySearch(rewrittenQuery, 3);
      return docs;
    },
    (docs: Document[]) => docs.map((doc: Document) => 
      `[${doc.metadata.content_type}:${doc.metadata.content_id}] ${doc.pageContent}`
    ).join("\n\n")
  ]).withConfig({ runName: "RAG_Retriever" });

  // Main chain uses original question but enhanced retrieval
  const chain = RunnableSequence.from([
    {
      context: retriever,
      question: (input: ChainInput) => input.question,
      chat_history: (input: ChainInput) => 
        input.chat_history.map(msg => `${msg.type}: ${msg.text}`).join("\n")
    },
    responsePrompt,
    model,
    new StringOutputParser()
  ]).withConfig({ runName: "RAG_Chain" });

  return {
    async call(input: ChainInput) {
      const rewrittenQuery = await queryRewriter.invoke(input);
      const docs = await vectorStore.similaritySearch(rewrittenQuery, 3);
      const answer = await chain.invoke(input);

      return {
        answer,
        sourceDocuments: docs
      };
    }
  };
};

export const processQuery = async (
  chain: ReturnType<typeof createRAGChain>,
  messages: Message[]
) => {
  const question = messages[messages.length - 1].content;
  const history = convertToLangChainHistory(messages.slice(0, -1));

  const response = await chain.call({
    question,
    chat_history: history
  });

  const citations: Citation[] = (response.sourceDocuments || []).map((doc: Document) => {
    const isArticle = doc.metadata.content_type === "article";
    const workspaceId = doc.metadata.workspace_id;

    // Build URL based on content type
    const url = isArticle
      ? `/support/${workspaceId}/kb/articles/${doc.metadata.content_id}`
      : `${process.env.SUPABASE_URL}/storage/v1/object/public/kb-documents/${workspaceId}/${doc.metadata.content_id}`;

    return {
      content_type: doc.metadata.content_type,
      content_id: doc.metadata.content_id,
      excerpt: doc.pageContent.slice(0, 150) + "...",
      url,
      title: doc.metadata.title || (isArticle 
        ? `Article ${doc.metadata.content_id}`
        : doc.metadata.content_id.split('/').pop()?.replace('.pdf', '') || doc.metadata.content_id
      )
    };
  });

  return {
    content: response.answer,
    citations
  };
};

export async function getRagSuggestion(
  messages: { role: string; content: string }[],
  workspace: { workspaceId: string; workspaceSlug: string }
): Promise<RagResponse> {
  // Initialize models
  const embeddings = new OpenAIEmbeddings();
  const chatModel = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
  });
  const queryModel = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  // Initialize vector store
  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { 
      request: new Request("http://dummy"), // Dummy request for type safety
      response: new Response() 
    }
  );

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "kb_embeddings",
    queryName: "match_kb_embeddings",
  });

  // Format history and get last message as question
  console.log('messages (getRagSuggestion)');
  console.log(messages);
  const question = messages[messages.length - 1].content;
  const history = messages.slice(0, -1);
  const chatHistory = history
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  // Build query chain
  const queryChain = RunnableSequence.from([
    PromptTemplate.fromTemplate(QUERY_TEMPLATE),
    queryModel,
    new StringOutputParser(),
  ]);

  // Get rewritten query
  const rewrittenQuery = await queryChain.invoke({
    question,
    chat_history: chatHistory,
  });

  // Get relevant documents
  const docs = await vectorStore.similaritySearch(rewrittenQuery, 3);

  // Format context
  const context = docs
    .map(
      (doc: Document) =>
        `[${doc.metadata.content_title || "Untitled Document"}] ${doc.pageContent}`
    )
    .join("\n\n");

  // Build response chain
  const responseChain = RunnableSequence.from([
    PromptTemplate.fromTemplate(RESPONSE_TEMPLATE),
    chatModel,
    new StringOutputParser(),
  ]);

  // Get final response
  console.log('Getting response from LLM...');
  const rawResponse = await responseChain.invoke({
    context,
    question,
    chat_history: chatHistory,
  });

  console.log('Raw LLM response:', rawResponse);

  // Parse the JSON response
  let parsedResponse;
  try {
    parsedResponse = JSON.parse(rawResponse);
    console.log('Parsed response:', parsedResponse);
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    // Fallback to original format if parsing fails
    parsedResponse = {
      setStatus: false,
      response: rawResponse
    };
  }

  // Format citations with URLs and titles
  const citations = docs.map((doc: Document) => {
    const isArticle = doc.metadata.content_type === "article";

    // Build URL based on content type - both now use workspace slug
    const url = isArticle
      ? `/support/${workspace.workspaceSlug}/kb/articles/${doc.metadata.content_id}`
      : `/support/${workspace.workspaceSlug}/kb/documents/${doc.metadata.content_id}`;

    return {
      content_type: doc.metadata.content_type,
      content_id: doc.metadata.content_id,
      excerpt: doc.pageContent.slice(0, 150) + "...",
      url,
      title: doc.metadata.content_title || (isArticle 
        ? "Untitled Article"
        : "Untitled Document"
      )
    };
  });

  return {
    content: parsedResponse.response,
    citations,
    setStatus: parsedResponse.setStatus
  };
} 