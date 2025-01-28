# RAG Query API Implementation Plan

## Tech Stack
- Supabase with pgvector for embedding storage and similarity search
- LangChain for RAG pipeline orchestration
- LangSmith for observability and debugging
- OpenAI for embeddings (text-embedding-ada-002) and chat completion (gpt-4)

## 1. Setup and Infrastructure
- [ ] Create new API route `api.admin.ask.tsx`
- [ ] Set up TypeScript interfaces for request/response types
- [ ] Add necessary LangChain imports and chain components
- [ ] Configure LangSmith tracing for the new route

## 2. Query Rewriting Chain
- [ ] Create a LangChain chain for query rewriting
  - [ ] Design system prompt for query rewriting
  - [ ] Implement message history truncation (last 5 messages)
  - [ ] Create prompt template for query synthesis
  - [ ] Add output parser for structured query
- [ ] Add tracing and metrics for query rewriting
  - [ ] Track token usage
  - [ ] Track latency
  - [ ] Log original vs rewritten queries

## 3. Vector Search Implementation
- [ ] Create Supabase vector search utility
  - [ ] Implement similarity search function
  - [ ] Add configurable top-k parameter
  - [ ] Add metadata filtering (by workspace)
- [ ] Format search results
  - [ ] Extract relevant snippets
  - [ ] Include source metadata
  - [ ] Structure citations

## 4. Response Generation Chain
- [ ] Create main RAG chain
  - [ ] Design system prompt for e-commerce support context
  - [ ] Create prompt template incorporating:
    - [ ] Message history
    - [ ] Retrieved context
    - [ ] Rewritten query
  - [ ] Implement structured output parser
    - [ ] Response content
    - [ ] Citations
    - [ ] Confidence score
    - [ ] Follow-up suggestions

## 5. API Integration
- [ ] Implement request validation
  - [ ] Admin API key check
  - [ ] Message history format validation
  - [ ] Input sanitization
- [ ] Create response formatter
  - [ ] Implement full response structure
  - [ ] Add timing metrics
  - [ ] Include token usage stats
  - [ ] Format error responses

## 6. Testing and Debugging
- [ ] Create test cases
  - [ ] Basic query tests
  - [ ] Complex conversation scenarios
  - [ ] Error handling cases
- [ ] Set up LangSmith datasets
  - [ ] Example conversations
  - [ ] Expected outputs
  - [ ] Edge cases
- [ ] Add logging and monitoring
  - [ ] Query rewriting performance
  - [ ] Vector search metrics
  - [ ] Response quality metrics

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
- Similarity threshold: 0.8
- Context window: 1000 tokens per document

### Response Structure
```typescript
interface AskResponse {
  response: {
    content: string;
    citations: Citation[];
    confidence: number;
    suggested_followups: string[];
  };
  query_info: QueryInfo;
  metadata: ResponseMetadata;
}
```

## 6. Testing and Debugging
- [ ] Create test cases with sample conversations
- [ ] Add LangSmith traces for:
  - [ ] Query rewriting performance
  - [ ] Vector search accuracy
  - [ ] Response quality
  - [ ] Token usage optimization

## 7. Prompt Engineering
### Query Rewriter Prompt
- [ ] Design prompt that:
  - [ ] Extracts key topics from conversation
  - [ ] Handles pronoun resolution
  - [ ] Maintains e-commerce context
  - [ ] Optimizes for vector search

### Response Generator Prompt
- [ ] Design prompt that:
  - [ ] Uses retrieved context effectively
  - [ ] Maintains conversation flow
  - [ ] Formats citations consistently
  - [ ] Generates helpful follow-ups

## 8. Configuration
- [ ] Add environment variables:
  - [ ] OPENAI_API_KEY (existing)
  - [ ] VECTOR_SEARCH_TOP_K
  - [ ] MAX_HISTORY_MESSAGES
  - [ ] CONFIDENCE_THRESHOLD

## Implementation Order
1. Set up basic route and type definitions
2. Implement query rewriting chain
3. Add vector search functionality
4. Create response generation chain
5. Add LangSmith tracing
6. Test and optimize prompts
7. Add configuration options

## Notes
- Start with higher temperatures for testing query rewriting
- Use LangSmith to compare different prompt versions
- Consider caching frequent queries
- Monitor token usage and adjust as needed
- Test with various conversation scenarios
