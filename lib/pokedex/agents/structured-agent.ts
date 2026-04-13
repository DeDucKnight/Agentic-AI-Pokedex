import { fetchPokemonByName } from "@/lib/pokedex/clients/pokeapi";
import type { QueryAnalysis, StructuredPokemonData } from "@/lib/types";

export async function getStructuredContext(
  analysis: QueryAnalysis
): Promise<StructuredPokemonData | null> {
  if (!analysis.candidatePokemonName) {
    return null;
  }

  return fetchPokemonByName(analysis.candidatePokemonName);
}
