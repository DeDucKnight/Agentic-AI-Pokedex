export type RouteDecision = "pokeapi" | "bulbapedia" | "hybrid";

export type QueryIntent =
  | "structured"
  | "lore"
  | "fuzzy"
  | "recommendation"
  | "unknown";

export interface ReasoningTrace {
  intent: QueryIntent;
  entitiesDetected: string[];
  selectedRoute: RouteDecision;
  whyThisRoute: string;
  confidence: number;
  fallbacksUsed: string[];
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  trace: ReasoningTrace;
}

export interface StructuredPokemonData {
  name: string;
  types: string[];
  abilities: string[];
  stats: Array<{
    name: string;
    value: number;
  }>;
}

export interface LoreResult {
  summary: string;
  snippets: string[];
}
