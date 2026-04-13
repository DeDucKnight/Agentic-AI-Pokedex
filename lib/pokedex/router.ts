import { analyzeQuery } from "@/lib/pokedex/agents/classifier";
import { getLoreContext } from "@/lib/pokedex/agents/lore-agent";
import { getStructuredContext } from "@/lib/pokedex/agents/structured-agent";
import { synthesizeAnswer } from "@/lib/pokedex/agents/synthesizer";
import { fetchPokemonByName } from "@/lib/pokedex/clients/pokeapi";
import { buildTrace } from "@/lib/pokedex/trace";
import type { ChatResponse, QueryAnalysis, RouteDecision } from "@/lib/types";

function decideRoute(analysis: QueryAnalysis): RouteDecision {
  if (analysis.needsStructuredFacts && analysis.needsLore) {
    return "hybrid";
  }

  switch (analysis.intent) {
    case "structured":
      return "pokeapi";
    case "lore":
      return analysis.resolvedPokemonName ? "hybrid" : "bulbapedia";
    case "fuzzy":
      return "bulbapedia";
    case "recommendation":
    case "unknown":
    default:
      return "hybrid";
  }
}

export async function runPokedexPipeline(query: string): Promise<ChatResponse> {
  const analysis = await analyzeQuery(query);
  const selectedRoute = decideRoute(analysis);

  let [structured, lore] = await Promise.all([
    selectedRoute === "pokeapi" || selectedRoute === "hybrid"
      ? getStructuredContext(analysis)
      : Promise.resolve(null),
    selectedRoute === "bulbapedia" || selectedRoute === "hybrid"
      ? getLoreContext(query, analysis)
      : Promise.resolve(null)
  ]);

  const fallbacksUsed: string[] = [];

  if (!structured && analysis.needsStructuredFacts && lore?.matches[0]?.title) {
    const suggestedPokemon = lore.matches[0].title.toLowerCase().split(/\s+/)[0];
    structured = await fetchPokemonByName(suggestedPokemon);

    if (structured) {
      fallbacksUsed.push(
        `Used lore retrieval to infer "${structured.name}" as the best structured match.`
      );
    }
  }

  if (!structured && !lore && analysis.resolvedPokemonName && selectedRoute === "bulbapedia") {
    structured = await fetchPokemonByName(analysis.resolvedPokemonName);

    if (structured) {
      fallbacksUsed.push(
        `Used PokeAPI fallback for "${analysis.resolvedPokemonName}" because lore retrieval returned no match.`
      );
    }
  }

  if (
    analysis.candidatePokemonName &&
    !structured &&
    (analysis.needsStructuredFacts || selectedRoute === "hybrid")
  ) {
    const unresolvedName = analysis.resolvedPokemonName ?? analysis.candidatePokemonName;
    fallbacksUsed.push(`PokeAPI returned no result for "${unresolvedName}".`);
  }

  if (!analysis.resolvedPokemonName && analysis.needsStructuredFacts) {
    fallbacksUsed.push("No confident Pokemon name was resolved for structured lookup.");
  }

  if (
    analysis.resolvedPokemonName &&
    analysis.candidatePokemonName &&
    analysis.resolvedPokemonName !== analysis.candidatePokemonName
  ) {
    fallbacksUsed.push(
      `Resolved "${analysis.candidatePokemonName}" to "${analysis.resolvedPokemonName}" before retrieval.`
    );
  }

  if (!lore && (analysis.needsLore || selectedRoute === "bulbapedia")) {
    fallbacksUsed.push("No Bulbapedia corpus match was found, so lore context is limited.");
  }

  const trace = buildTrace({
    analysis,
    selectedRoute,
    fallbacksUsed,
    structuredFound: Boolean(structured),
    loreFound: Boolean(lore)
  });

  return synthesizeAnswer({
    analysis,
    structured,
    lore,
    trace
  });
}
