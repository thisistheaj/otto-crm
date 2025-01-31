-- Add metadata column for filtering
alter table kb_embeddings add column if not exists metadata jsonb default '{}'::jsonb;

-- Create a function to search for similar documents
create or replace function match_kb_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 3
)
returns table (
  id uuid,
  content_type text,
  content_id uuid,
  content_title text,
  content_text text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kb_embeddings.id,
    kb_embeddings.content_type,
    kb_embeddings.content_id,
    kb_embeddings.content_title,
    kb_embeddings.content_text,
    1 - (kb_embeddings.embedding <=> query_embedding) as similarity
  from kb_embeddings
  where 1 - (kb_embeddings.embedding <=> query_embedding) > match_threshold
  order by kb_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$; 