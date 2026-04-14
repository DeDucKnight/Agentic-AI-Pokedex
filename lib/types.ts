export type RouteDecision = "pokeapi" | "bulbapedia" | "hybrid";
export type SourceName = "PokeAPI" | "Bulbapedia corpus";

export type QueryIntent =
  | "structured"
  | "lore"
  | "fuzzy"
  | "recommendation"
  | "hybrid"
  | "unknown";

export type QueryMode = "lookup" | "search";
export type QueryRequestKind = "stats" | "lore" | "hybrid";
export type BulbapediaQuestionIntent =
  | "entity_lore"
  | "descriptive_search"
  | "broad_lore";

export interface QueryConstraints {
  mode: QueryMode;
  pokemonName: string | null;
  generation?: number | null;
  type?: string | null;
  color?: string | null;
}

export interface ReasoningTrace {
  intent: QueryIntent;
  entitiesDetected: string[];
  selectedRoute: RouteDecision;
  whyThisRoute: string;
  confidence: number;
  pokemonName: string | null;
  resolvedPokemonName: string | null;
  nameResolutionConfidence: number;
  alternativeMatches: string[];
  requestKind: QueryRequestKind;
  queryMode: QueryMode;
  reasoningSummary: string;
  sourcesCalled: SourceName[];
  statsFound: boolean;
  loreFound: boolean;
  bulbapediaQuestionIntent?: BulbapediaQuestionIntent | null;
  bulbapediaTopScore?: number | null;
  bulbapediaAccepted?: boolean;
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
  mode: QueryMode;
  requestKind: QueryRequestKind;
  pokemonName: string | null;
  constraints?: QueryConstraints;
  rawPokemonMention?: string | null;
  candidatePokemonName?: string | null;
  resolvedPokemonName?: string | null;
  resolutionConfidence?: number;
  alternativeMatches?: string[];
  reasoningSummary: string;
  confidence: number;
  entitiesDetected: string[];
  descriptors?: string[];
  needsStructuredFacts: boolean;
  needsLore: boolean;
  needsRecommendation?: boolean;
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
  isPlaceholder?: boolean;
  matches: Array<{
    title: string;
    snippet: string;
    score: number;
    isPlaceholder?: boolean;
  }>;
}

export interface QueryAnalyzerAgentOutput {
  pokemonName: string | null;
  requestKind: QueryRequestKind;
  queryMode: QueryMode;
  reasoningSummary: string;
  confidence?: number;
}

export interface PokeApiAgentResult {
  found: boolean;
  pokemonName: string | null;
  data: StructuredPokemonData | null;
  error: string | null;
}

export interface BulbapediaAgentResult {
  found: boolean;
  matches: LoreResult["matches"];
  summary: string | null;
  retrievalPlan?: BulbapediaRetrievalPlan;
  topScore?: number | null;
  accepted?: boolean;
  error: string | null;
}

export interface BulbapediaRetrievalPlan {
  searchQuery: string;
  entityHints: string[];
  attributeHints: string[];
  questionIntent: BulbapediaQuestionIntent;
  confidence?: number;
}
