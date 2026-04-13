import type { StructuredPokemonData } from "@/lib/types";

export async function fetchPokemonByName(name: string): Promise<StructuredPokemonData | null> {
  const normalized = name.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${normalized}`);

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();

  return {
    name: payload.name,
    types: payload.types.map((entry: { type: { name: string } }) => entry.type.name),
    abilities: payload.abilities.map(
      (entry: { ability: { name: string } }) => entry.ability.name
    ),
    stats: payload.stats.map(
      (entry: { base_stat: number; stat: { name: string } }) => ({
        name: entry.stat.name,
        value: entry.base_stat
      })
    )
  };
}
