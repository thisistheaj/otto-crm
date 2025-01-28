-- Drop existing function to avoid parameter conflicts
drop function if exists match_kb_embeddings;

-- Recreate with explicit table references
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