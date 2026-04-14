import {
  buildAnalysisUnavailableResponse,
  runAnswerCompilerAgent
} from "@/lib/pokedex/agents/answer-compiler-agent";
import { runBulbapediaAgent } from "@/lib/pokedex/agents/bulbapedia-agent";
import { runPokeApiAgent } from "@/lib/pokedex/agents/pokeapi-agent";
import { runQueryAnalyzerAgent } from "@/lib/pokedex/agents/query-analyzer-agent";
import { buildTrace } from "@/lib/pokedex/trace";
import type {
  QueryAnalysis,
  RouteDecision,
  SourceName
} from "@/lib/types";

function decideRoute(analysis: QueryAnalysis): RouteDecision {
  if (analysis.requestKind === "stats") {
    return "pokeapi";
  }

  return analysis.requestKind === "lore" ? "bulbapedia" : "hybrid";
}

export async function runPokedexPipeline(query: string) {
  const analysis = await runQueryAnalyzerAgent(query);

  if (!analysis) {
    return buildAnalysisUnavailableResponse(query);
  }

  const selectedRoute = decideRoute(analysis);
  const sourcesCalled: SourceName[] = [];
  const fallbacksUsed: string[] = [];

  const pokeApi =
    selectedRoute === "pokeapi" || selectedRoute === "hybrid"
      ? await runPokeApiAgent(analysis.pokemonName)
      : null;
  if (pokeApi) {
    sourcesCalled.push("PokeAPI");
  }

  const bulbapedia =
    selectedRoute === "bulbapedia" || selectedRoute === "hybrid"
      ? await runBulbapediaAgent(query)
      : null;
  if (bulbapedia) {
    sourcesCalled.push("Bulbapedia corpus");
  }

  if (pokeApi && !pokeApi.found && pokeApi.error) {
    fallbacksUsed.push(pokeApi.error);
  }

  if (bulbapedia && !bulbapedia.found && bulbapedia.error) {
    fallbacksUsed.push(bulbapedia.error);
  }

  if (selectedRoute !== "pokeapi" && !bulbapedia) {
    fallbacksUsed.push("BulbapediaAgent was unavailable.");
  }

  if (selectedRoute !== "bulbapedia" && !pokeApi) {
    fallbacksUsed.push("PokeAPIAgent was unavailable.");
  }

  const trace = buildTrace({
    analysis,
    selectedRoute,
    sourcesCalled,
    fallbacksUsed,
    statsFound: Boolean(pokeApi?.found),
    loreFound: Boolean(bulbapedia?.found),
    bulbapediaMeta: {
      questionIntent: bulbapedia?.retrievalPlan?.questionIntent ?? null,
      topScore: bulbapedia?.topScore ?? null,
      accepted: bulbapedia?.accepted ?? false
    }
  });

  return runAnswerCompilerAgent({
    question: query,
    analysis,
    pokeApi,
    bulbapedia,
    trace
  });
}
