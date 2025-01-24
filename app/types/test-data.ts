import type { Database } from "./database";

// Reuse types from database where possible
type DBTicket = Database["public"]["Tables"]["tickets"]["Insert"];
type DBMessage = Database["public"]["Tables"]["messages"]["Insert"];
type DBArticle = Database["public"]["Tables"]["articles"]["Insert"];
type DBDocument = Database["public"]["Tables"]["documents"]["Insert"];

// Message with required fields for test data
export type TestMessage = Required<Pick<DBMessage,
  | "content"
  | "sender_type"
>> & {
  created_at?: string;
};

// Ticket with required fields for test data and messages array
export type TestTicket = Required<Pick<DBTicket, 
  | "subject" 
  | "description" 
  | "email" 
  | "status" 
  | "priority"
>> & {
  messages: TestMessage[];
};

// Article with required fields for test data
export type TestArticle = Required<Pick<DBArticle,
  | "title"
  | "content"
  | "workspace_id"
>> & {
  status: "published";
  author_id: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
};

// Document with required fields for test data
export type TestDocument = Required<Pick<DBDocument,
  | "title"
  | "file_name"
  | "file_path"
  | "status"
  | "uploader_id"
  | "workspace_id"
>> & {
  tags: string[];
  created_at?: string;
  updated_at?: string;
};

// The full test data structure
export type TestData = {
  tickets: TestTicket[];
  articles: TestArticle[];
  documents: TestDocument[];
};

// Constants for test data generation
export const TEST_DATA_CONSTANTS = {
  ticketStatus: ["new", "open", "closed"] as const,
  ticketPriority: ["low", "normal", "high"] as const,
  senderType: ["agent", "customer"] as const,
  documentStatus: ["draft", "published"] as const,
} as const; 