import type { ChatResponse, LoreResult, ReasoningTrace, StructuredPokemonData } from "@/lib/types";

function renderStructuredAnswer(data: StructuredPokemonData) {
  const stats = data.stats.map((stat) => `${stat.name}: ${stat.value}`).join(", ");
  return `${data.name} is a ${data.types.join("/")} Pokemon with abilities ${data.abilities.join(
    ", "
  )}. Base stats: ${stats}.`;
}

function renderHybridAnswer(
  structured: StructuredPokemonData | null,
  lore: LoreResult | null
) {
  const sections = [];

  if (structured) {
    sections.push(renderStructuredAnswer(structured));
  }

  if (lore) {
    sections.push(lore.summary);
  }

  return sections.join(" ");
}

export function synthesizeAnswer(input: {
  structured: StructuredPokemonData | null;
  lore: LoreResult | null;
  trace: ReasoningTrace;
}): ChatResponse {
  const { structured, lore, trace } = input;

  if (trace.selectedRoute === "pokeapi" && structured) {
    return {
      answer: renderStructuredAnswer(structured),
      sources: ["PokeAPI"],
      trace
    };
  }

  if (trace.selectedRoute === "bulbapedia" && lore) {
    return {
      answer: lore.summary,
      sources: ["Bulbapedia corpus"],
      trace
    };
  }

  return {
    answer: renderHybridAnswer(structured, lore),
    sources: ["PokeAPI", "Bulbapedia corpus"],
    trace
  };
}
