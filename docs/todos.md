# RAG Query API Implementation Plan

## Tech Stack
- [x] Supabase with pgvector for embedding storage and similarity search
- [x] LangChain for RAG pipeline orchestration
- [x] LangSmith for observability and debugging
- [x] OpenAI for embeddings (text-embedding-ada-002) and chat completion (gpt-4)

## 1. Setup and Infrastructure
- [x] Create new API route `api.admin.ask.tsx`
- [x] Set up TypeScript interfaces for request/response types
- [x] Add necessary LangChain imports and chain components
- [x] Configure LangSmith tracing for the new route

## 2. Query Rewriting Chain
- [x] Create a LangChain chain for query rewriting
  - [x] Design system prompt for query rewriting
  - [x] Implement message history truncation
  - [x] Create prompt template for query synthesis
  - [x] Add output parser for structured query
- [x] Add tracing and metrics for query rewriting
  - [x] Track token usage (via LangSmith)
  - [x] Track latency (via LangSmith)
  - [x] Log original vs rewritten queries

## 3. Vector Search Implementation
- [x] Create Supabase vector search utility
  - [x] Implement similarity search function
  - [x] Add configurable top-k parameter
  - [x] Add metadata filtering (by workspace)
- [x] Format search results
  - [x] Extract relevant snippets
  - [x] Include source metadata
  - [x] Structure citations

## 4. Response Generation Chain
- [x] Create main RAG chain
  - [x] Design system prompt for e-commerce support context
  - [x] Create prompt template incorporating:
    - [x] Message history
    - [x] Retrieved context
    - [x] Rewritten query
  - [x] Implement structured output parser
    - [x] Response content
    - [x] Citations
    - [x] Follow-up suggestions

## 5. API Integration
- [x] Implement request validation
  - [x] Admin API key check
  - [x] Message history format validation
  - [x] Input sanitization
- [x] Create response formatter
  - [x] Implement full response structure
  - [x] Format error responses

## Implementation Notes

### Query Rewriting Prompt Design
```typescript
const queryRewritingPrompt = `
Given the following conversation history, rewrite the last query to be more specific and include relevant context from previous messages.
Focus on:
- Key topics and entities mentioned
- Implicit context from previous messages
- Specific details about products or services
- Customer intent and background

Conversation History:
{messages}

Rewrite the last query to be more comprehensive and specific.
`
```

### Vector Search Parameters
- Initial top-k: 3 documents
- Context window: 1000 tokens per document

### Response Structure
```typescript
interface AskResponse {
  response: {
    content: string;
    citations: Citation[];
    suggested_followups: string[];
  };
  metadata: ResponseMetadata;
}
```

## Configuration
- [x] Add environment variables:
  - [x] OPENAI_API_KEY (existing)
  - [x] ADMIN_API_KEY
  - [x] LANGSMITH_API_KEY
  - [x] LANGSMITH_PROJECT
