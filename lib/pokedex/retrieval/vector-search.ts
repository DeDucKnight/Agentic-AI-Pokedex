import type { LoreResult } from "@/lib/types";

export async function searchBulbapediaLore(query: string): Promise<LoreResult> {
  return {
    summary: `Semantic Bulbapedia lookup has not been wired yet for: "${query}".`,
    snippets: [
      "Stub result: connect Supabase pgvector search here after ingestion is ready."
    ]
  };
}
