import { searchBulbapediaLore } from "@/lib/pokedex/retrieval/vector-search";
import type { QueryAnalysis } from "@/lib/types";

export async function getLoreContext(query: string, analysis: QueryAnalysis) {
  return searchBulbapediaLore(query, analysis);
}
