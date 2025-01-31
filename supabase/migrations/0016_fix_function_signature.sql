-- Drop existing function to avoid parameter conflicts
drop function if exists match_kb_embeddings;

-- Recreate with exact LangChain expected signature
create function match_kb_embeddings (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5
) returns table (
  id uuid,
  content_type text,
  content_id uuid,
  content_title text,
  content_text text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select
    kb_embeddings.id,
    kb_embeddings.content_type,
    kb_embeddings.content_id,
    kb_embeddings.content_title,
    kb_embeddings.content_text,
    kb_embeddings.metadata,
    1 - (kb_embeddings.embedding <=> query_embedding) as similarity
  from kb_embeddings
  where 1 - (kb_embeddings.embedding <=> query_embedding) > match_threshold
  order by kb_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$; 