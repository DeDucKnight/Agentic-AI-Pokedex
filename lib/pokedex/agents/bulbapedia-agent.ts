import { z } from "zod";
import { env } from "@/lib/env";
import { getGeminiClient } from "@/lib/gemini";
import { searchBulbapediaLore } from "@/lib/pokedex/retrieval/vector-search";
import type { BulbapediaAgentResult, BulbapediaRetrievalPlan } from "@/lib/types";

const bulbapediaPlanSchema = z.object({
  searchQuery: z.string().trim().min(1),
  entityHints: z.array(z.string().trim().min(1)).max(6).default([]),
  attributeHints: z.array(z.string().trim().min(1)).max(10).default([]),
  questionIntent: z.enum(["entity_lore", "descriptive_search", "broad_lore"]),
  confidence: z.number().min(0).max(1).optional()
});

function extractJsonObject(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  return match?.[0] ?? null;
}

export async function runBulbapediaAgent(query: string): Promise<BulbapediaAgentResult | null> {
  const client = getGeminiClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.models.generateContent({
      model: env.GEMINI_BULBAPEDIA_MODEL,
      contents: [
        "You are BulbapediaAgent for a Pokemon assistant.",
        "Your task is to understand the user's question and produce a retrieval plan for the Bulbapedia corpus.",
        "Return strict JSON only with the fields searchQuery, entityHints, attributeHints, questionIntent, and optional confidence.",
        "searchQuery should be a concise semantic search phrase for the corpus.",
        "entityHints should list anchor Pokemon names or named concepts mentioned in the question.",
        "attributeHints should list descriptive attributes, themes, or qualifiers such as cute, pink, love, controversial, cloning.",
        'questionIntent must be one of "entity_lore", "descriptive_search", or "broad_lore".',
        "Do not answer the user. Only plan the corpus search.",
        `User query: ${query}`
      ].join("\n")
    });

    const raw = response.text?.trim();
    console.log("[BulbapediaAgent] raw response", { query, raw });

    if (!raw) {
      return null;
    }

    const json = extractJsonObject(raw);

    if (!json) {
      return null;
    }

    const plan = bulbapediaPlanSchema.parse(JSON.parse(json)) as BulbapediaRetrievalPlan;
    console.log("[BulbapediaAgent] retrieval plan", { query, plan });
    const lore = await searchBulbapediaLore(plan);

    if (!lore) {
      return {
        found: false,
        matches: [],
        summary: null,
        retrievalPlan: plan,
        topScore: null,
        accepted: false,
        error: "Bulbapedia corpus returned no matching lore."
      };
    }

    return {
      found: true,
      matches: lore.matches,
      summary: lore.summary,
      retrievalPlan: plan,
      topScore: lore.matches[0]?.score ?? null,
      accepted: true,
      error: null
    };
  } catch (error) {
    console.error("[BulbapediaAgent] failed", {
      query,
      error,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    return null;
  }
}
