import { classifyIntent } from "@/lib/pokedex/agents/classifier";
import { getLoreContext } from "@/lib/pokedex/agents/lore-agent";
import { detectPokemonEntities, getStructuredContext } from "@/lib/pokedex/agents/structured-agent";
import { synthesizeAnswer } from "@/lib/pokedex/agents/synthesizer";
import { buildTrace } from "@/lib/pokedex/trace";
import type { ChatResponse, QueryIntent, RouteDecision } from "@/lib/types";

function decideRoute(intent: QueryIntent): RouteDecision {
  switch (intent) {
    case "structured":
      return "pokeapi";
    case "lore":
    case "fuzzy":
      return "bulbapedia";
    case "recommendation":
    case "unknown":
    default:
      return "hybrid";
  }
}

export async function runPokedexPipeline(query: string): Promise<ChatResponse> {
  const intent = classifyIntent(query);
  const entitiesDetected = detectPokemonEntities(query);
  const selectedRoute = decideRoute(intent);

  const [structured, lore] = await Promise.all([
    selectedRoute === "pokeapi" || selectedRoute === "hybrid"
      ? getStructuredContext(query)
      : Promise.resolve(null),
    selectedRoute === "bulbapedia" || selectedRoute === "hybrid"
      ? getLoreContext(query)
      : Promise.resolve(null)
  ]);

  const trace = buildTrace({
    intent,
    entitiesDetected,
    selectedRoute
  });

  return synthesizeAnswer({
    structured,
    lore,
    trace
  });
}
