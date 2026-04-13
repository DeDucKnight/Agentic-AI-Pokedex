import { fetchPokemonByName } from "@/lib/pokedex/clients/pokeapi";
import type { StructuredPokemonData } from "@/lib/types";

const knownPokemon = ["pikachu", "gengar", "mewtwo", "treecko", "gardevoir", "luvdisc"];

export function detectPokemonEntities(query: string): string[] {
  const normalized = query.toLowerCase();
  return knownPokemon.filter((pokemon) => normalized.includes(pokemon));
}

export async function getStructuredContext(query: string): Promise<StructuredPokemonData | null> {
  const [firstEntity] = detectPokemonEntities(query);

  if (!firstEntity) {
    return null;
  }

  return fetchPokemonByName(firstEntity);
}
