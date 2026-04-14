import { fetchPokemonByName } from "@/lib/pokedex/clients/pokeapi";
import type { PokeApiAgentResult } from "@/lib/types";

export async function runPokeApiAgent(pokemonName: string | null): Promise<PokeApiAgentResult> {
  if (!pokemonName) {
    return {
      found: false,
      pokemonName: null,
      data: null,
      error: "No Pokemon name was provided to the PokeAPI agent."
    };
  }

  const data = await fetchPokemonByName(pokemonName);

  if (!data) {
    return {
      found: false,
      pokemonName,
      data: null,
      error: `PokeAPI could not find "${pokemonName}".`
    };
  }

  return {
    found: true,
    pokemonName: data.name,
    data,
    error: null
  };
}
