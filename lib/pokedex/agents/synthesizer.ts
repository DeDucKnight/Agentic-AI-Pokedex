import { env } from "@/lib/env";
import { getGeminiClient } from "@/lib/gemini";
import type {
  ChatResponse,
  LoreResult,
  QueryAnalysis,
  ReasoningTrace,
  SourceName,
  StructuredPokemonData
} from "@/lib/types";

function titleCase(value: string) {
  return value
    .split(/[-\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderStructuredAnswer(data: StructuredPokemonData) {
  const stats = data.stats.map((stat) => `${stat.name}: ${stat.value}`).join(", ");
  const evolution = data.evolutionLine.map(titleCase).join(" -> ");

  return [
    `${titleCase(data.name)} is a ${data.types.map(titleCase).join("/")} Pokemon.`,
    `Abilities: ${data.abilities.map(titleCase).join(", ")}.`,
    `Base stats: ${stats}.`,
    `Evolution line: ${evolution}.`,
    data.flavorText ? `Pokedex flavor: ${data.flavorText}` : null
  ]
    .filter(Boolean)
    .join(" ");
}

function renderLoreAnswer(lore: LoreResult) {
  const support = lore.matches[1]?.snippet;
  return support ? `${lore.summary} Supporting detail: ${support}` : lore.summary;
}

function renderHybridAnswer(
  analysis: QueryAnalysis,
  structured: StructuredPokemonData | null,
  lore: LoreResult | null
) {
  const sections: string[] = [];

  if (analysis.needsRecommendation && structured) {
    sections.push(
      `${titleCase(structured.name)} is a strong fit here because it matches the requested category and has a clear evolution line of ${structured.evolutionLine
        .map(titleCase)
        .join(" -> ")}.`
    );
  } else if (structured) {
    sections.push(renderStructuredAnswer(structured));
  }

  if (lore) {
    sections.push(`Lore context: ${lore.summary}`);
  }

  return sections.join(" ");
}

async function tryModelSynthesis(input: {
  analysis: QueryAnalysis;
  structured: StructuredPokemonData | null;
  lore: LoreResult | null;
}) {
  const client = getGeminiClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [
        "You are a source-aware Pokemon assistant.",
        "Use only the supplied context.",
        "Do not invent unsupported Pokemon facts.",
        "Keep the answer concise but informative.",
        `Intent: ${input.analysis.intent}`,
        `User query: ${input.analysis.originalQuery}`,
        `Structured context: ${JSON.stringify(input.structured)}`,
        `Lore context: ${JSON.stringify(input.lore)}`
      ].join("\n")
    });

    return response.text?.trim() || null;
  } catch {
    return null;
  }
}

export async function synthesizeAnswer(input: {
  analysis: QueryAnalysis;
  structured: StructuredPokemonData | null;
  lore: LoreResult | null;
  trace: ReasoningTrace;
}): Promise<ChatResponse> {
  const { analysis, structured, lore, trace } = input;
  const sources: SourceName[] = [];

  if (structured) {
    sources.push("PokeAPI");
  }

  if (lore) {
    sources.push("Bulbapedia corpus");
  }

  if (sources.length === 0) {
    return {
      answer: analysis.rawPokemonMention
        ? `I could not verify "${analysis.rawPokemonMention}" as a trustworthy Pokemon result from the available sources. Try the official Pokemon name or ask a broader lore or descriptive question.`
        : "I could not find enough trustworthy Pokemon context for that question yet. Try a specific Pokemon name, a lore question, or a descriptive prompt with more detail.",
      sources: [],
      trace
    };
  }

  const modelAnswer = await tryModelSynthesis({
    analysis,
    structured,
    lore
  });

  if (modelAnswer) {
    return {
      answer: modelAnswer,
      sources,
      trace
    };
  }

  if (trace.selectedRoute === "pokeapi" && structured) {
    return {
      answer: renderStructuredAnswer(structured),
      sources,
      trace
    };
  }

  if (trace.selectedRoute === "bulbapedia" && lore) {
    return {
      answer: renderLoreAnswer(lore),
      sources,
      trace
    };
  }

  return {
    answer: renderHybridAnswer(analysis, structured, lore),
    sources,
    trace
  };
}
