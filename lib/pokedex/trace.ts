import type { QueryAnalysis, ReasoningTrace, RouteDecision } from "@/lib/types";

export function buildTrace(input: {
  analysis: QueryAnalysis;
  selectedRoute: RouteDecision;
  sourcesCalled: ReasoningTrace["sourcesCalled"];
  fallbacksUsed: string[];
  statsFound: boolean;
  loreFound: boolean;
  bulbapediaMeta?: {
    questionIntent?: ReasoningTrace["bulbapediaQuestionIntent"];
    topScore?: number | null;
    accepted?: boolean;
  };
}): ReasoningTrace {
  const {
    analysis,
    selectedRoute,
    sourcesCalled,
    fallbacksUsed,
    statsFound,
    loreFound,
    bulbapediaMeta
  } = input;

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
    pokemonName: analysis.pokemonName,
    resolvedPokemonName: analysis.resolvedPokemonName ?? analysis.pokemonName,
    nameResolutionConfidence: analysis.resolutionConfidence ?? analysis.confidence,
    alternativeMatches: analysis.alternativeMatches ?? [],
    requestKind: analysis.requestKind,
    queryMode: analysis.mode,
    reasoningSummary: analysis.reasoningSummary,
    sourcesCalled,
    statsFound,
    loreFound,
    bulbapediaQuestionIntent: bulbapediaMeta?.questionIntent ?? null,
    bulbapediaTopScore: bulbapediaMeta?.topScore ?? null,
    bulbapediaAccepted: bulbapediaMeta?.accepted ?? false,
    confidence:
      selectedRoute === "hybrid"
        ? statsFound && loreFound
          ? 0.9
          : 0.72
        : statsFound || loreFound
          ? 0.85
          : 0.48,
    fallbacksUsed
  };
}
