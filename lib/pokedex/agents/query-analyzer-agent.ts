import { z } from "zod";
import { env } from "@/lib/env";
import { getGeminiClient } from "@/lib/gemini";
import type { QueryAnalysis, QueryAnalyzerAgentOutput, QueryIntent } from "@/lib/types";

const queryAnalyzerSchema = z.object({
  pokemonName: z.string().trim().min(1).nullable(),
  requestKind: z.enum(["stats", "lore", "hybrid"]),
  queryMode: z.enum(["lookup", "search"]),
  reasoningSummary: z.string().trim().min(1),
  confidence: z.number().min(0).max(1).optional()
});

function extractJsonObject(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  return match?.[0] ?? null;
}

function mapIntent(requestKind: QueryAnalyzerAgentOutput["requestKind"]): QueryIntent {
  if (requestKind === "stats") {
    return "structured";
  }

  if (requestKind === "lore") {
    return "lore";
  }

  return "hybrid";
}

export async function runQueryAnalyzerAgent(query: string): Promise<QueryAnalysis | null> {
  const client = getGeminiClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.models.generateContent({
      model: env.GEMINI_QUERY_ANALYZER_MODEL,
      contents: [
        "You are QueryAnalyzerAgent for a Pokemon assistant.",
        "Your task is to understand the user's Pokemon question and return strict JSON only.",
        "The assistant helps users get information regarding Pokemon.",
        "Use only these fields: pokemonName, requestKind, queryMode, reasoningSummary, confidence.",
        'pokemonName must be the most likely Pokemon name or null if no single Pokemon is clearly targeted.',
        'requestKind must be one of: "stats", "lore", "hybrid".',
        'Use "stats" when the user wants structured facts such as stats, typing, abilities, evolution, generation, height, weight, or moves.',
        'Use "lore" when the user wants background, story, design notes, trivia, inspiration, culture, or corpus-based descriptive information.',
        'Use "hybrid" when the user asks for both facts and lore or a broad "tell me about" style overview that should combine sources.',
        'queryMode must be "lookup" when the user refers to one Pokemon and "search" when the user is exploring or filtering more broadly.',
        "reasoningSummary should be one short sentence explaining the decision.",
        "Return JSON only. No markdown. No explanation outside JSON.",
        `User query: ${query}`
      ].join("\n")
    });

    const raw = response.text?.trim();

    if (!raw) {
      return null;
    }

    const json = extractJsonObject(raw);

    if (!json) {
      return null;
    }

    const parsed = queryAnalyzerSchema.parse(JSON.parse(json));
    const normalizedQuery = query.trim().replace(/\s+/g, " ");

    return {
      originalQuery: query,
      normalizedQuery,
      intent: mapIntent(parsed.requestKind),
      mode: parsed.queryMode,
      requestKind: parsed.requestKind,
      pokemonName: parsed.pokemonName ? parsed.pokemonName.trim().toLowerCase() : null,
      reasoningSummary: parsed.reasoningSummary,
      confidence: parsed.confidence ?? 0.8,
      entitiesDetected: parsed.pokemonName ? [parsed.pokemonName.trim().toLowerCase()] : [],
      needsStructuredFacts: parsed.requestKind === "stats" || parsed.requestKind === "hybrid",
      needsLore: parsed.requestKind === "lore" || parsed.requestKind === "hybrid"
    };
  } catch (error) {
    console.error("[QueryAnalyzerAgent] failed", {
      query,
      error,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    return null;
  }
}
