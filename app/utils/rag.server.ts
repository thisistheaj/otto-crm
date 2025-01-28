import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import type { Document } from "@langchain/core/documents";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message, Citation } from "~/types/rag";
import { convertToLangChainHistory } from "~/types/rag";

const RESPONSE_TEMPLATE = `You are an AI assistant for an e-commerce support system. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Always include citations when you use information from the context.

Context:
{context}

Chat History:
{chat_history}

Question: {question}

Answer in a helpful, professional manner. Include citations using [content_type:content_id] format when referencing specific information.
End your response with 2-3 relevant follow-up questions the user might have.`;

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

  const prompt = PromptTemplate.fromTemplate(RESPONSE_TEMPLATE);

  const chain = RunnableSequence.from([
    {
      context: async (input: ChainInput) => {
        console.log('Input:');
        console.log(input);
        const docs = await vectorStore.similaritySearch(input.question, 3);
        console.log('Docs:');
        console.log(docs);
        return docs.map((doc: Document) => 
          `[${doc.metadata.content_type}:${doc.metadata.content_id}] ${doc.pageContent}`
        ).join("\n\n");
      },
      question: (input: ChainInput) => input.question,
      chat_history: (input: ChainInput) => 
        input.chat_history.map(msg => `${msg.type}: ${msg.text}`).join("\n")
    },
    prompt,
    model,
    new StringOutputParser()
  ]);

  return {
    async call(input: ChainInput) {
      const docs = await vectorStore.similaritySearch(input.question, 3);
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

  const citations: Citation[] = (response.sourceDocuments || []).map((doc: Document) => ({
    title: doc.metadata.content_title,
    content_type: doc.metadata.content_type,
    content_id: doc.metadata.content_id,
    excerpt: doc.pageContent.slice(0, 150) + "..."
  }));

  return {
    content: response.answer,
    citations
  };
}; 