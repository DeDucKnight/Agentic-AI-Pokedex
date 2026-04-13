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
