import { env } from "@/lib/env";
import { embedText } from "@/lib/pokedex/embeddings";
import { localLoreCorpus } from "@/lib/pokedex/knowledge/local-corpus";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { BulbapediaRetrievalPlan, LoreResult } from "@/lib/types";

type LoreMatch = LoreResult["matches"][number];
const MIN_RELEVANCE_SCORE = 6;

function tokenize(value: string) {
  return value.toLowerCase().split(/\W+/).filter(Boolean);
}

function scoreDocument(
  doc: { title: string; content: string; tags: string[] },
  plan: BulbapediaRetrievalPlan
) {
  const haystack = `${doc.title} ${doc.content} ${doc.tags.join(" ")}`.toLowerCase();
  const title = doc.title.toLowerCase();
  const tagSet = new Set(doc.tags.map((tag) => tag.toLowerCase()));
  const queryTokens = tokenize(plan.searchQuery);
  const entityHints = plan.entityHints.map((hint) => hint.toLowerCase());
  const attributeHints = plan.attributeHints.map((hint) => hint.toLowerCase());

  const tokenScore = queryTokens.reduce((score, token) => {
    return score + (haystack.includes(token) ? 1 : 0);
  }, 0);

  const entityScore = entityHints.reduce((score, hint) => {
    let next = score;

    if (title === hint) {
      next += 14;
    } else if (title.includes(hint)) {
      next += 10;
    }

    if (tagSet.has(hint)) {
      next += 6;
    } else if (haystack.includes(hint)) {
      next += 4;
    }

    return next;
  }, 0);

  const attributeScore = attributeHints.reduce((score, hint) => {
    if (tagSet.has(hint)) {
      return score + 5;
    }

    if (haystack.includes(hint)) {
      return score + 3;
    }

    return score;
  }, 0);

  const matchedAttributeCount = attributeHints.reduce((count, hint) => {
    return count + (tagSet.has(hint) || haystack.includes(hint) ? 1 : 0);
  }, 0);

  if (
    plan.questionIntent === "descriptive_search" &&
    attributeHints.length >= 2 &&
    matchedAttributeCount < Math.ceil(attributeHints.length / 2)
  ) {
    return 0;
  }

  const intentBoost =
    plan.questionIntent === "entity_lore"
      ? entityScore * 1.2
      : plan.questionIntent === "descriptive_search"
        ? attributeScore * 1.1 +
          matchedAttributeCount * matchedAttributeCount * 3 -
          (matchedAttributeCount === 0 ? 10 : 0)
        : tokenScore * 0.3;

  return tokenScore + entityScore + attributeScore + intentBoost;
}

async function embedQuery(plan: BulbapediaRetrievalPlan) {
  const entityPart = plan.entityHints.length > 0 ? ` | entities: ${plan.entityHints.join(", ")}` : "";
  const attributePart =
    plan.attributeHints.length > 0 ? ` | attributes: ${plan.attributeHints.join(", ")}` : "";
  return embedText(
    `task: search result | intent: ${plan.questionIntent} | query: ${plan.searchQuery}${entityPart}${attributePart}`
  );
}

function applyRelevanceThreshold(matches: LoreMatch[]) {
  if (matches.length === 0) {
    return null;
  }

  if ((matches[0]?.score ?? 0) < MIN_RELEVANCE_SCORE) {
    return null;
  }

  return matches;
}

async function searchSupabaseLore(plan: BulbapediaRetrievalPlan) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const embedding = await embedQuery(plan);

  if (!embedding) {
    return null;
  }

  const { data, error } = await supabase.rpc("match_bulbapedia_documents", {
    query_embedding: embedding,
    match_count: 3
  });

  if (error || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  return data.map((match): LoreMatch => ({
    title: String(match.title ?? "Bulbapedia entry"),
    snippet: String(match.content ?? "").slice(0, 260),
    score: Number(match.similarity ?? 0)
  }));
}

function searchLocalLore(plan: BulbapediaRetrievalPlan) {
  return localLoreCorpus
    .map((doc): LoreMatch => ({
      title: doc.title,
      snippet: doc.content,
      isPlaceholder: Boolean(doc.isPlaceholder),
      score: scoreDocument(doc, plan)
    }))
    .filter((doc) => doc.score > 0 && !doc.isPlaceholder)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

export async function searchBulbapediaLore(
  plan: BulbapediaRetrievalPlan,
  options?: { preferLocal?: boolean }
): Promise<LoreResult | null> {
  const remoteMatches = options?.preferLocal ? null : await searchSupabaseLore(plan);
  const rankedMatches = remoteMatches ?? searchLocalLore(plan);
  const matches = applyRelevanceThreshold(rankedMatches);

  if (!matches || matches.length === 0) {
    return null;
  }

  return {
    summary: matches[0].snippet,
    snippets: matches.map((match) => match.snippet),
    isPlaceholder: matches.every((match) => Boolean(match.isPlaceholder)),
    matches
  };
}
