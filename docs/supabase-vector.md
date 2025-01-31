# Supabase Vector Store Setup for LangChain

This document outlines how to set up a Supabase vector store for use with LangChain in a Remix application.

## Database Schema

First, create a table for storing embeddings:

```sql
-- Enable the pgvector extension
create extension if not exists vector;

-- Create the embeddings table
create table if not exists kb_embeddings (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    content_type text not null check (content_type in ('article', 'document')),
    content_id uuid not null,
    content_title text not null,
    content_text text not null,
    embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for better query performance
create index if not exists kb_embeddings_workspace_id_idx on kb_embeddings(workspace_id);
create index if not exists kb_embeddings_content_type_idx on kb_embeddings(content_type);

-- Add a GiST index for the embedding vector to enable similarity search
create index if not exists kb_embeddings_embedding_idx on kb_embeddings using ivfflat (embedding vector_cosine_ops);
```

## Similarity Search Function

Create a PostgreSQL function that matches LangChain's expected interface:

```sql
create function match_kb_embeddings(
  query_embedding vector(1536),
  filter jsonb default '{}'::jsonb,
  match_count int default 5
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kb_embeddings.id,
    kb_embeddings.content_text as content,
    jsonb_build_object(
      'content_type', kb_embeddings.content_type,
      'content_id', kb_embeddings.content_id,
      'content_title', kb_embeddings.content_title
    ) as metadata,
    1 - (kb_embeddings.embedding <=> query_embedding) as similarity
  from kb_embeddings
  where kb_embeddings.metadata @> filter
  order by kb_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

Key points about the function:
1. Parameter order matters: `query_embedding`, `filter`, `match_count`
2. Return columns must match exactly: `id`, `content`, `metadata`, `similarity`
3. No similarity threshold - let LangChain/LLM handle relevance
4. Use explicit table references to avoid ambiguity
5. Metadata is returned as a JSONB object

## LangChain Integration

Configure the vector store in your application:

```typescript
const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: "kb_embeddings",
  queryName: "match_kb_embeddings"
});
```

## Common Issues

1. **Parameter Order**: LangChain expects parameters in exact order: `query_embedding`, `filter`, `match_count`
2. **Named Parameters**: The function must support being called with named parameters
3. **Return Types**: Must match LangChain's expected format exactly
4. **Metadata Handling**: Use JSONB for flexible metadata storage and filtering
5. **Column References**: Use explicit table references to avoid ambiguity

## Testing

Test the setup with a simple query:

```bash
curl -X POST http://localhost:3000/api/rag -H "Content-Type: application/json" -H "Authorization: Bearer YOUR-KEY" -d '{"messages": [{"role": "user", "content": "test query"}]}'
```

The response should include:
- Generated content from the LLM
- Citations referencing the source documents
- Relevant follow-up questions 