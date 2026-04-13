import { searchBulbapediaLore } from "@/lib/pokedex/retrieval/vector-search";

export async function getLoreContext(query: string) {
  return searchBulbapediaLore(query);
}
