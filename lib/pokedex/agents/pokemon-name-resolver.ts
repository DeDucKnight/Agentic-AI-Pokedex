import {
  fetchCanonicalPokemonName,
  fetchPokemonNameIndex
} from "@/lib/pokedex/clients/pokeapi";

const explicitPatterns = [
  /\bcalled\s+([a-z0-9.' -]+?)(?:[?!.,]|$)/i,
  /\babout\s+(?:the\s+pokemon\s+)?([a-z0-9.' -]+?)(?:[?!.,]|$)/i,
  /\bwhat\s+(?:is|are)\s+([a-z0-9.' -]+?)['’]s\s+(?:base\s+)?stats?\b/i,
  /\bwhat\s+(?:is|are)\s+([a-z0-9.' -]+?)\s+(?:base\s+)?stats?\b/i,
  /\btell me about\s+([a-z0-9.' -]+?)(?:[?!.,]|$)/i
];

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "associated",
  "base",
  "best",
  "cute",
  "describe",
  "evolution",
  "favorite",
  "find",
  "for",
  "friendly",
  "from",
  "gen",
  "generation",
  "good",
  "grass",
  "hello",
  "how",
  "i",
  "is",
  "its",
  "like",
  "love",
  "me",
  "my",
  "of",
  "pick",
  "pokemon",
  "recommend",
  "starter",
  "stats",
  "tell",
  "the",
  "their",
  "type",
  "what",
  "which",
  "with"
]);

function uniq(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function cleanCandidate(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\b(the|pokemon)\b/g, " ")
    .replace(/[^a-z0-9'\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePokemonCandidate(value: string) {
  let normalized = cleanCandidate(value);

  normalized = normalized.replace(/(?:'s|s')$/i, "");
  normalized = normalized.replace(/\bforme\b/g, "form");
  normalized = normalized.replace(/\s+/g, "-");

  if (normalized.endsWith("s") && !normalized.endsWith("ss") && !normalized.includes("-")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized.replace(/^-+|-+$/g, "");
}

function extractExplicitCandidates(query: string) {
  const matches = explicitPatterns
    .map((pattern) => pattern.exec(query)?.[1] ?? null)
    .filter((value): value is string => Boolean(value))
    .map(normalizePokemonCandidate);

  return uniq(matches);
}

function extractWindowCandidates(query: string) {
  const tokens = cleanCandidate(query)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !stopWords.has(token));

  const windows: string[] = [];

  for (let size = Math.min(3, tokens.length); size >= 1; size -= 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const joined = normalizePokemonCandidate(tokens.slice(index, index + size).join(" "));

      if (joined) {
        windows.push(joined);
      }
    }
  }

  return uniq(windows);
}

function levenshteinDistance(left: string, right: string) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[left.length][right.length];
}

function similarityScore(left: string, right: string) {
  if (left === right) {
    return 1;
  }

  if (left.includes(right) || right.includes(left)) {
    return 0.92;
  }

  const maxLength = Math.max(left.length, right.length);

  if (maxLength === 0) {
    return 0;
  }

  return 1 - levenshteinDistance(left, right) / maxLength;
}

async function findBestFuzzyMatches(candidates: string[]) {
  const index = await fetchPokemonNameIndex();

  if (index.length === 0) {
    return [];
  }

  const scored = index
    .map((name) => {
      const score = candidates.reduce((best, candidate) => {
        return Math.max(best, similarityScore(candidate, name));
      }, 0);

      return { name, score };
    })
    .filter((entry) => entry.score >= 0.72)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  return scored;
}

export interface PokemonNameResolution {
  rawPokemonMention: string | null;
  candidatePokemonName: string | null;
  resolvedPokemonName: string | null;
  resolutionConfidence: number;
  alternativeMatches: string[];
  entitiesDetected: string[];
}

export async function resolvePokemonName(query: string): Promise<PokemonNameResolution> {
  const explicitCandidates = extractExplicitCandidates(query);
  const windowCandidates = extractWindowCandidates(query);
  const candidates = uniq([...explicitCandidates, ...windowCandidates]);

  const rawPokemonMention = explicitCandidates[0] ?? windowCandidates[0] ?? null;

  for (const candidate of candidates) {
    const directMatch = await fetchCanonicalPokemonName(candidate);

    if (directMatch) {
      return {
        rawPokemonMention,
        candidatePokemonName: candidate,
        resolvedPokemonName: directMatch,
        resolutionConfidence: directMatch === candidate ? 0.98 : 0.92,
        alternativeMatches: candidates.filter((value) => value !== directMatch).slice(0, 3),
        entitiesDetected: uniq([directMatch, rawPokemonMention])
      };
    }
  }

  const fuzzyMatches = await findBestFuzzyMatches(candidates);
  const bestMatch = fuzzyMatches[0];

  if (bestMatch) {
    return {
      rawPokemonMention,
      candidatePokemonName: candidates[0] ?? null,
      resolvedPokemonName: bestMatch.name,
      resolutionConfidence: Math.max(0.55, Math.min(0.9, bestMatch.score)),
      alternativeMatches: fuzzyMatches.slice(1).map((entry) => entry.name),
      entitiesDetected: uniq([bestMatch.name, rawPokemonMention])
    };
  }

  return {
    rawPokemonMention,
    candidatePokemonName: candidates[0] ?? null,
    resolvedPokemonName: null,
    resolutionConfidence: 0,
    alternativeMatches: [],
    entitiesDetected: rawPokemonMention ? [rawPokemonMention] : []
  };
}
