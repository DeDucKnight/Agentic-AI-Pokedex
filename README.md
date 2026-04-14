# Agentic AI Pokedex

Source-aware Pokemon assistant built for the Leverate take-home challenge.

## Stack

- Next.js 15 + TypeScript
- Gemini for answer synthesis and embeddings
- Supabase + pgvector for Bulbapedia embeddings
- PokeAPI for structured Pokemon facts

## Planned flow

1. User asks a natural-language question.
2. Query understanding agent classifies the request.
3. Routing agent chooses `pokeapi`, `bulbapedia`, or `hybrid`.
4. Retrieval agents fetch structured and/or semantic context.
5. Synthesis agent returns an answer plus a structured reasoning trace.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Env vars

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_EMBEDDING_MODEL`
- `GEMINI_EMBEDDING_DIMENSION`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notes

- `scripts/ingest-bulbapedia.ts` is the curated Bulbapedia ingestion entrypoint for scraped pages.
- `data/bulbapedia/seed-pages.json` defines the hand-picked corpus for ingestion and retrieval coverage.
- `supabase/migrations/001_create_documents.sql` contains the base vector schema.
