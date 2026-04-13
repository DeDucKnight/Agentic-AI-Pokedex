create extension if not exists vector;

create table if not exists bulbapedia_documents (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists bulbapedia_documents_embedding_idx
  on bulbapedia_documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function match_bulbapedia_documents(
  query_embedding vector(1536),
  match_count int default 3
)
returns table (
  id bigint,
  slug text,
  title text,
  content text,
  similarity float
)
language sql
as $$
  select
    bulbapedia_documents.id,
    bulbapedia_documents.slug,
    bulbapedia_documents.title,
    bulbapedia_documents.content,
    1 - (bulbapedia_documents.embedding <=> query_embedding) as similarity
  from bulbapedia_documents
  order by bulbapedia_documents.embedding <=> query_embedding
  limit match_count;
$$;
