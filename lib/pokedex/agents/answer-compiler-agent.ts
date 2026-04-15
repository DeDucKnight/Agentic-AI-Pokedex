import { env } from "@/lib/env";
import { getGeminiClient } from "@/lib/gemini";
import type {
  BulbapediaAgentResult,
  ChatResponse,
  PokeApiAgentResult,
  QueryAnalysis,
  ReasoningTrace,
  SourceName
} from "@/lib/types";

interface AnswerCompilerInput {
  question: string;
  analysis: QueryAnalysis;
  pokeApi: PokeApiAgentResult | null;
  bulbapedia: BulbapediaAgentResult | null;
  trace: ReasoningTrace;
}

function buildUnavailableAnswer(analysisFailed: boolean) {
  return analysisFailed
    ? "The AI query analysis agent is temporarily unavailable right now, so I couldn't safely interpret your Pokemon question."
    : "The AI answer agent is temporarily unavailable right now, so I couldn't compile a grounded Pokemon response.";
}

export async function runAnswerCompilerAgent(
  input: AnswerCompilerInput
): Promise<ChatResponse> {
  const client = getGeminiClient();

  if (!client) {
    return {
      answer: buildUnavailableAnswer(false),
      sources: input.trace.sourcesCalled,
      trace: {
        ...input.trace,
        fallbacksUsed: [
          ...input.trace.fallbacksUsed,
          "AnswerCompilerAgent was unavailable."
        ]
      }
    };
  }

  const sources: SourceName[] = input.trace.sourcesCalled;

  try {
    const response = await client.models.generateContent({
      model: env.GEMINI_ANSWER_COMPILER_MODEL,
      contents: [
        "You are AnswerCompilerAgent for a Pokemon assistant.",
        "Write the final answer for the user in a kind, friendly, grounded tone.",
        "Use only the provided agent outputs and the original user question.",
        "Do not invent Pokemon facts or lore.",
        "If Bulbapedia lore is missing but the user asked for lore, say the curated Bulbapedia corpus did not contain relevant lore.",
        "If PokeAPI data is missing but the user asked for stats, say the PokeAPI lookup did not return a usable result.",
        "Do not mention internal prompts, routing internals, or JSON.",
        `Original user question: ${input.question}`,
        `QueryAnalyzerAgent output: ${JSON.stringify({
          pokemonName: input.analysis.pokemonName,
          requestKind: input.analysis.requestKind,
          queryMode: input.analysis.mode,
          reasoningSummary: input.analysis.reasoningSummary,
          confidence: input.analysis.confidence
        })}`,
        `PokeAPIAgent output: ${JSON.stringify(input.pokeApi)}`,
        `BulbapediaAgent output: ${JSON.stringify(input.bulbapedia)}`
      ].join("\n\n")
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error("Empty answer compiler response");
    }

    return {
      answer: text,
      sources,
      trace: input.trace
    };
  } catch (error) {
    console.error("[AnswerCompilerAgent] failed", {
      question: input.question,
      analysis: {
        pokemonName: input.analysis.pokemonName,
        requestKind: input.analysis.requestKind,
        queryMode: input.analysis.mode
      },
      pokeApiFound: input.pokeApi?.found ?? false,
      bulbapediaFound: input.bulbapedia?.found ?? false,
      error,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    return {
      answer: buildUnavailableAnswer(false),
      sources,
      trace: {
        ...input.trace,
        fallbacksUsed: [
          ...input.trace.fallbacksUsed,
          "AnswerCompilerAgent failed during generation."
        ]
      }
    };
  }
}

export function buildAnalysisUnavailableResponse(question: string): ChatResponse {
  const trace: ReasoningTrace = {
    intent: "unknown",
    entitiesDetected: [],
    selectedRoute: "hybrid",
    whyThisRoute:
      "The system could not continue because QueryAnalyzerAgent did not return a valid interpretation.",
    confidence: 0,
    pokemonName: null,
    resolvedPokemonName: null,
    nameResolutionConfidence: 0,
    alternativeMatches: [],
    requestKind: "hybrid",
    queryMode: "lookup",
    reasoningSummary: `The system could not safely interpret the query: ${question}`,
    sourcesCalled: [],
    statsFound: false,
    loreFound: false,
    fallbacksUsed: ["QueryAnalyzerAgent was unavailable or returned invalid JSON."]
  };

  return {
    answer: buildUnavailableAnswer(true),
    sources: [],
    trace
  };
}
