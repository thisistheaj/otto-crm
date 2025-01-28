-- Add metadata column for filtering
alter table kb_embeddings add column if not exists metadata jsonb default '{}'::jsonb;

-- Update the search function to use metadata filtering
create or replace function match_kb_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
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
  where metadata @> filter
  order by kb_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$; 