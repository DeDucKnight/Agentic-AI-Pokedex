import type { QueryAnalysis, QueryIntent } from "@/lib/types";

const knownPokemon = [
  "bulbasaur",
  "charmander",
  "squirtle",
  "pikachu",
  "gengar",
  "mewtwo",
  "treecko",
  "grovyle",
  "sceptile",
  "torchic",
  "mudkip",
  "gardevoir",
  "luvdisc",
  "yveltal"
];

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

function detectPokemonEntities(query: string) {
  const normalized = query.toLowerCase();
  return knownPokemon.filter((pokemon) => normalized.includes(pokemon));
}

function extractCandidatePokemonName(query: string, entitiesDetected: string[]) {
  if (entitiesDetected.length > 0) {
    return entitiesDetected[0];
  }

  const explicitCalledMatch = query.match(/\bcalled\s+([a-z-]+)\b/i);

  if (explicitCalledMatch) {
    return explicitCalledMatch[1].toLowerCase();
  }

  const aboutMatch = query.match(/\babout\s+(?:the\s+pokemon\s+)?([a-z-]+)\b/i);

  if (aboutMatch && aboutMatch[1].toLowerCase() !== "the") {
    return aboutMatch[1].toLowerCase();
  }

  const forMatch = query.match(/\bfor\s+([a-z-]+)\b/i);
  return forMatch ? forMatch[1].toLowerCase() : null;
}

function extractRawPokemonMention(query: string) {
  const explicitCalledMatch = query.match(/\bcalled\s+([a-z-]+)\b/i);

  if (explicitCalledMatch) {
    return explicitCalledMatch[1].toLowerCase();
  }

  const aboutMatch = query.match(/\babout\s+(?:the\s+pokemon\s+)?([a-z-]+)\b/i);
  return aboutMatch ? aboutMatch[1].toLowerCase() : null;
}

function extractDescriptors(query: string) {
  const normalized = query.toLowerCase();
  return descriptorTerms.filter((term) => normalized.includes(term));
}

export function analyzeQuery(query: string): QueryAnalysis {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  const entitiesDetected = detectPokemonEntities(normalizedQuery);
  const intent = classifyIntent(normalizedQuery);
  const descriptors = extractDescriptors(normalizedQuery);
  const rawPokemonMention = extractRawPokemonMention(normalizedQuery);
  const candidatePokemonName = extractCandidatePokemonName(normalizedQuery, entitiesDetected);

  return {
    originalQuery: query,
    normalizedQuery,
    intent,
    entitiesDetected,
    rawPokemonMention,
    candidatePokemonName,
    descriptors,
    needsStructuredFacts:
      intent === "structured" || intent === "recommendation" || /\bevolution\b/i.test(query),
    needsLore: intent === "lore" || intent === "fuzzy" || intent === "recommendation",
    needsRecommendation: intent === "recommendation"
  };
}
