import { resolvePokemonName } from "@/lib/pokedex/agents/pokemon-name-resolver-v2";
import type { QueryAnalysis, QueryIntent } from "@/lib/types";

const structuredPatterns = [
  /\bbase stats?\b/i,
  /\bstats?\b/i,
  /\btype\b/i,
  /\babilities?\b/i,
  /\bheight\b/i,
  /\bweight\b/i,
  /\bevolution(?:s| line| chain)?\b/i
];

const lorePatterns = [
  /\blore\b/i,
  /\btrivia\b/i,
  /\bcontroversial\b/i,
  /\bhistory\b/i,
  /\borigin\b/i,
  /\bintroduced\b/i,
  /\btell me about\b/i
];

const recommendationPatterns = [
  /\brecommend/i,
  /\bbeginner-friendly\b/i,
  /\bbest\b/i,
  /\bshould i pick\b/i
];

const fuzzyPatterns = [
  /\bcute\b/i,
  /\bpink\b/i,
  /\bvibe\b/i,
  /\blooks like\b/i,
  /\bassociated with\b/i,
  /\bfind me\b/i
];

const descriptorTerms = [
  "cute",
  "pink",
  "love",
  "beginner-friendly",
  "grass",
  "starter",
  "shadow",
  "ghost",
  "elegant",
  "protective"
];

function classifyIntent(query: string): QueryIntent {
  if (structuredPatterns.some((pattern) => pattern.test(query))) {
    return "structured";
  }

  if (recommendationPatterns.some((pattern) => pattern.test(query))) {
    return "recommendation";
  }

  if (lorePatterns.some((pattern) => pattern.test(query))) {
    return "lore";
  }

  if (fuzzyPatterns.some((pattern) => pattern.test(query))) {
    return "fuzzy";
  }

  return "unknown";
}

function extractDescriptors(query: string) {
  const normalized = query.toLowerCase();
  return descriptorTerms.filter((term) => normalized.includes(term));
}

export async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  const intent = classifyIntent(normalizedQuery);
  const descriptors = extractDescriptors(normalizedQuery);
  const resolution = await resolvePokemonName(normalizedQuery);

  return {
    originalQuery: query,
    normalizedQuery,
    intent,
    entitiesDetected: resolution.entitiesDetected,
    rawPokemonMention: resolution.rawPokemonMention,
    candidatePokemonName: resolution.candidatePokemonName,
    resolvedPokemonName: resolution.resolvedPokemonName,
    resolutionConfidence: resolution.resolutionConfidence,
    alternativeMatches: resolution.alternativeMatches,
    descriptors,
    needsStructuredFacts:
      intent === "structured" || intent === "recommendation" || /\bevolution\b/i.test(query),
    needsLore: intent === "lore" || intent === "fuzzy" || intent === "recommendation",
    needsRecommendation: intent === "recommendation"
  };
}
