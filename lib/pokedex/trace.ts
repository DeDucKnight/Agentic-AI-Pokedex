import type { QueryIntent, ReasoningTrace, RouteDecision } from "@/lib/types";

export function buildTrace(input: {
  intent: QueryIntent;
  entitiesDetected: string[];
  selectedRoute: RouteDecision;
}): ReasoningTrace {
  const { intent, entitiesDetected, selectedRoute } = input;

  const whyThisRoute =
    selectedRoute === "pokeapi"
      ? "The query asks for exact structured facts that map cleanly to PokeAPI."
      : selectedRoute === "bulbapedia"
        ? "The query is narrative or descriptive, so semantic lore retrieval is more appropriate."
        : "The query mixes factual lookup with explanation or recommendation, so both sources are needed.";

  return {
    intent,
    entitiesDetected,
    selectedRoute,
    whyThisRoute,
    confidence: selectedRoute === "hybrid" ? 0.78 : 0.86,
    fallbacksUsed: entitiesDetected.length === 0 ? ["No direct Pokemon entity detected."] : []
  };
}
