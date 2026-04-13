import type { QueryAnalysis, ReasoningTrace, RouteDecision } from "@/lib/types";

export function buildTrace(input: {
  analysis: QueryAnalysis;
  selectedRoute: RouteDecision;
  fallbacksUsed: string[];
  structuredFound: boolean;
  loreFound: boolean;
}): ReasoningTrace {
  const { analysis, selectedRoute, fallbacksUsed, structuredFound, loreFound } = input;

  const whyThisRoute =
    selectedRoute === "pokeapi"
      ? "The query asks for exact structured facts that map cleanly to PokeAPI."
      : selectedRoute === "bulbapedia"
        ? "The query is narrative or descriptive, so semantic lore retrieval is more appropriate."
        : "The query mixes factual lookup with explanation or recommendation, so both sources are needed.";

  return {
    intent: analysis.intent,
    entitiesDetected: analysis.entitiesDetected,
    selectedRoute,
    whyThisRoute,
    confidence:
      selectedRoute === "hybrid"
        ? structuredFound && loreFound
          ? 0.9
          : 0.72
        : structuredFound || loreFound
          ? 0.85
          : 0.48,
    fallbacksUsed
  };
}
