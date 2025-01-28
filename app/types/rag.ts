import { HumanMessage, AIMessage } from "@langchain/core/messages";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Citation {
  title: string;
  content_type: "article" | "document";
  content_id: string;
  excerpt: string;
}

export interface RAGResponse {
  content: string;
  citations: Citation[];
}

// Convert our message format to LangChain's format
export const convertToLangChainHistory = (messages: Message[]) => {
  return messages.map(msg => 
    msg.role === "user" 
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );
}; 