import { HumanMessage, AIMessage } from "@langchain/core/messages";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Citation {
  content_type: string;
  content_id: string;
  excerpt: string;
  url: string;
  title: string;
}

export interface RagResponse {
  content: string;
  citations: Citation[];
}

export function convertToLangChainHistory(messages: { role: string; content: string }[]): Message[] {
  return messages.map(msg => ({
    role: msg.role === "agent" ? "assistant" : "user",
    content: msg.content
  })) as Message[];
} 