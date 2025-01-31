-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table for storing document embeddings
create table if not exists kb_embeddings (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    content_type text not null check (content_type in ('article', 'document')),
    content_id uuid not null,
    content_title text not null,
    content_text text not null,
    embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for better query performance
create index if not exists kb_embeddings_workspace_id_idx on kb_embeddings(workspace_id);
create index if not exists kb_embeddings_content_type_idx on kb_embeddings(content_type);

-- Add a GiST index for the embedding vector to enable similarity search
create index if not exists kb_embeddings_embedding_idx on kb_embeddings using ivfflat (embedding vector_cosine_ops); 