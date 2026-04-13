import type { QueryIntent } from "@/lib/types";

const structuredPatterns = [
  /\bbase stats?\b/i,
  /\btype\b/i,
  /\babilities?\b/i,
  /\bevolution\b/i
];

const lorePatterns = [/\blore\b/i, /\btrivia\b/i, /\bcontroversial\b/i, /\bhistory\b/i];
const recommendationPatterns = [/recommend/i, /\bbeginner-friendly\b/i, /\bbest\b/i];
const fuzzyPatterns = [/\bcute\b/i, /\bpink\b/i, /\bvibe\b/i, /\blooks like\b/i];

export function classifyIntent(query: string): QueryIntent {
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
