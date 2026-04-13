export type RouteDecision = "pokeapi" | "bulbapedia" | "hybrid";
export type SourceName = "PokeAPI" | "Bulbapedia corpus";

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
  sources: SourceName[];
  trace: ReasoningTrace;
}

export interface QueryAnalysis {
  originalQuery: string;
  normalizedQuery: string;
  intent: QueryIntent;
  entitiesDetected: string[];
  rawPokemonMention: string | null;
  candidatePokemonName: string | null;
  descriptors: string[];
  needsStructuredFacts: boolean;
  needsLore: boolean;
  needsRecommendation: boolean;
}

export interface StructuredPokemonData {
  id: number;
  name: string;
  types: string[];
  abilities: string[];
  generation?: string | null;
  color?: string | null;
  habitat?: string | null;
  shape?: string | null;
  flavorText?: string | null;
  evolutionLine: string[];
  height: number;
  weight: number;
  stats: Array<{
    name: string;
    value: number;
  }>;
}

export interface LoreResult {
  summary: string;
  snippets: string[];
  matches: Array<{
    title: string;
    snippet: string;
    score: number;
  }>;
}
