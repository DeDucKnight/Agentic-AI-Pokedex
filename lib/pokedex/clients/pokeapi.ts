import type { StructuredPokemonData } from "@/lib/types";

interface PokemonPayload {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{ type: { name: string } }>;
  abilities: Array<{ ability: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
}

interface SpeciesPayload {
  color: { name: string } | null;
  habitat: { name: string } | null;
  shape: { name: string } | null;
  generation: { name: string } | null;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
  evolution_chain: {
    url: string;
  };
}

interface EvolutionChainNode {
  species: { name: string };
  evolves_to: EvolutionChainNode[];
}

interface EvolutionChainPayload {
  chain: EvolutionChainNode;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    next: {
      revalidate: 3600
    }
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

function extractFlavorText(species: SpeciesPayload) {
  const englishEntry = species.flavor_text_entries.find(
    (entry) => entry.language.name === "en"
  );

  return englishEntry?.flavor_text.replace(/\s+/g, " ").trim() ?? null;
}

function flattenEvolutionLine(node: EvolutionChainNode): string[] {
  const items = [node.species.name];

  for (const child of node.evolves_to) {
    items.push(...flattenEvolutionLine(child));
  }

  return Array.from(new Set(items));
}

export async function fetchPokemonByName(name: string): Promise<StructuredPokemonData | null> {
  const normalized = name.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const pokemon = await fetchJson<PokemonPayload>(
    `https://pokeapi.co/api/v2/pokemon/${normalized}`
  );

  if (!pokemon) {
    return null;
  }

  const species = await fetchJson<SpeciesPayload>(
    `https://pokeapi.co/api/v2/pokemon-species/${normalized}`
  );
  const evolutionChain = species
    ? await fetchJson<EvolutionChainPayload>(species.evolution_chain.url)
    : null;

  return {
    id: pokemon.id,
    name: pokemon.name,
    types: pokemon.types.map((entry) => entry.type.name),
    abilities: pokemon.abilities.map((entry) => entry.ability.name),
    generation: species?.generation?.name ?? null,
    color: species?.color?.name ?? null,
    habitat: species?.habitat?.name ?? null,
    shape: species?.shape?.name ?? null,
    flavorText: species ? extractFlavorText(species) : null,
    evolutionLine: evolutionChain ? flattenEvolutionLine(evolutionChain.chain) : [pokemon.name],
    height: pokemon.height,
    weight: pokemon.weight,
    stats: pokemon.stats.map((entry) => ({
      name: entry.stat.name,
      value: entry.base_stat
    }))
  };
}
