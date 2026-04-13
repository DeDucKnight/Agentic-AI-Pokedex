import { env } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";
import { localLoreCorpus } from "@/lib/pokedex/knowledge/local-corpus";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { LoreResult, QueryAnalysis } from "@/lib/types";

function scoreDocument(text: string, query: string, descriptors: string[]) {
  const haystack = text.toLowerCase();
  const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);

  const tokenScore = tokens.reduce((score, token) => {
    return score + (haystack.includes(token) ? 1 : 0);
  }, 0);

  const descriptorScore = descriptors.reduce((score, descriptor) => {
    return score + (haystack.includes(descriptor) ? 2 : 0);
  }, 0);

  return tokenScore + descriptorScore;
}

async function embedQuery(query: string) {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
      input: query
    });

    return response.data[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

async function searchSupabaseLore(query: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const embedding = await embedQuery(query);

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

  return data.map((match) => ({
    title: String(match.title ?? "Bulbapedia entry"),
    snippet: String(match.content ?? "").slice(0, 260),
    score: Number(match.similarity ?? 0)
  }));
}

function searchLocalLore(query: string, analysis: QueryAnalysis) {
  const constrainedEntity =
    analysis.rawPokemonMention ?? analysis.candidatePokemonName ?? analysis.entitiesDetected[0] ?? null;

  return localLoreCorpus
    .map((doc) => ({
      title: doc.title,
      snippet: doc.content,
      score: scoreDocument(
        `${doc.title} ${doc.content} ${doc.tags.join(" ")}`,
        query,
        analysis.descriptors
      )
    }))
    .filter((doc) => {
      if (doc.score <= 0) {
        return false;
      }

      if (!constrainedEntity) {
        return true;
      }

      const normalized = `${doc.title} ${doc.snippet}`.toLowerCase();
      if (normalized.includes(constrainedEntity)) {
        return true;
      }

      return analysis.candidatePokemonName
        ? normalized.includes(analysis.candidatePokemonName)
        : false;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

export async function searchBulbapediaLore(
  query: string,
  analysis: QueryAnalysis
): Promise<LoreResult | null> {
  const remoteMatches = await searchSupabaseLore(query);
  const matches = remoteMatches ?? searchLocalLore(query, analysis);

  if (matches.length === 0) {
    return null;
  }

  return {
    summary: matches[0].snippet,
    snippets: matches.map((match) => match.snippet),
    matches
  };
}
