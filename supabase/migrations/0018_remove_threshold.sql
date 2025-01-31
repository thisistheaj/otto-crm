-- Drop existing function to avoid parameter conflicts
drop function if exists match_kb_embeddings;

-- Recreate without similarity threshold
create function match_kb_embeddings (
  filter jsonb DEFAULT '{}',
  match_count int DEFAULT 5,
  query_embedding vector(1536) DEFAULT '[0]'::vector(1536)
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
  where metadata @> filter
  order by kb_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$; 