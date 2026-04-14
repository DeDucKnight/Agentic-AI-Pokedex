# Agentic AI Pokedex

Source-aware Pokemon assistant built for the Leverate take-home challenge.

## Stack

- Next.js 15 + TypeScript
- Gemini for query analysis, answer synthesis, and optional embeddings
- Local curated Bulbapedia-style corpus for lore retrieval
- PokeAPI for structured Pokemon facts

## Architecture

1. User asks a natural-language question.
2. Query understanding agent classifies the request.
3. Routing agent chooses `pokeapi`, `bulbapedia`, or `hybrid`.
4. Retrieval agents fetch structured facts from PokeAPI and lore from the local corpus.
5. Synthesis agent returns an answer plus a structured reasoning trace.

## Getting started

```bash
npm install
npm run dev
```

Create a `.env.local` file based on `.env.example` and add your Gemini API key.

## Env vars

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_EMBEDDING_MODEL`
- `GEMINI_EMBEDDING_DIMENSION`

Optional:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If Supabase is not configured, lore retrieval falls back to the local corpus automatically.

## Deploying on Vercel

1. Import the GitHub repository into Vercel.
2. Add `GEMINI_API_KEY` in the Vercel project environment variables.
3. Optionally add the Gemini model vars if you want to override the defaults.
4. Deploy.

For the current take-home version, Supabase is not required. The app can run entirely on Vercel using the local lore corpus plus live PokeAPI lookups.

## Notes

- `data/bulbapedia/seed-pages.json` defines the hand-picked lore coverage.
- `lib/pokedex/knowledge/local-corpus.ts` contains the local fallback lore corpus used by default in the Vercel-only setup.
- `scripts/ingest-bulbapedia.ts` and `supabase/migrations/001_create_documents.sql` are only needed if you later re-enable vector storage in Supabase.
