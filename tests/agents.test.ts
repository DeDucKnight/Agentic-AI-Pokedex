import test from "node:test";
import assert from "node:assert/strict";

test("PokeAPIAgent returns not found when no pokemon name is provided", async () => {
  const { runPokeApiAgent } = await import("@/lib/pokedex/agents/pokeapi-agent");

  const result = await runPokeApiAgent(null);

  assert.equal(result.found, false);
  assert.equal(result.pokemonName, null);
  assert.equal(result.data, null);
  assert.ok(result.error);
});

test("PokeAPIAgent returns structured data when PokeAPI lookup succeeds", async () => {
  const originalFetch = global.fetch;

  global.fetch = (async (input: string | URL | Request) => {
    const url = String(input);

    if (url.includes("/pokemon/gengar")) {
      return new Response(
        JSON.stringify({
          id: 94,
          name: "gengar",
          height: 15,
          weight: 405,
          types: [{ type: { name: "ghost" } }, { type: { name: "poison" } }],
          abilities: [{ ability: { name: "cursed-body" } }],
          stats: [{ base_stat: 60, stat: { name: "hp" } }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.includes("/pokemon-species/gengar")) {
      return new Response(
        JSON.stringify({
          color: { name: "purple" },
          habitat: { name: "urban" },
          shape: { name: "upright" },
          generation: { name: "generation-i" },
          flavor_text_entries: [
            { flavor_text: "A spooky Pokemon.", language: { name: "en" } }
          ],
          evolution_chain: { url: "https://pokeapi.co/api/v2/evolution-chain/42/" }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.includes("/evolution-chain/42/")) {
      return new Response(
        JSON.stringify({
          chain: {
            species: { name: "gastly" },
            evolves_to: [
              {
                species: { name: "haunter" },
                evolves_to: [{ species: { name: "gengar" }, evolves_to: [] }]
              }
            ]
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("Not found", { status: 404 });
  }) as typeof fetch;

  try {
    const { runPokeApiAgent } = await import("@/lib/pokedex/agents/pokeapi-agent");
    const result = await runPokeApiAgent("gengar");

    assert.equal(result.found, true);
    assert.equal(result.pokemonName, "gengar");
    assert.ok(result.data);
    assert.deepEqual(result.data?.types, ["ghost", "poison"]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("Trace reflects four-agent runtime state", async () => {
  const { buildTrace } = await import("@/lib/pokedex/trace");

  const trace = buildTrace({
    analysis: {
      originalQuery: "Tell me about Pikachu and its stats",
      normalizedQuery: "Tell me about Pikachu and its stats",
      intent: "hybrid",
      mode: "lookup",
      requestKind: "hybrid",
      pokemonName: "pikachu",
      reasoningSummary: "The user wants both lore and structured facts for Pikachu.",
      confidence: 0.91,
      entitiesDetected: ["pikachu"],
      needsStructuredFacts: true,
      needsLore: true
    },
    selectedRoute: "hybrid",
    sourcesCalled: ["PokeAPI", "Bulbapedia corpus"],
    fallbacksUsed: [],
    statsFound: true,
    loreFound: true
  });

  assert.equal(trace.pokemonName, "pikachu");
  assert.equal(trace.requestKind, "hybrid");
  assert.deepEqual(trace.sourcesCalled, ["PokeAPI", "Bulbapedia corpus"]);
  assert.equal(trace.statsFound, true);
  assert.equal(trace.loreFound, true);
});

test("Local Bulbapedia retrieval returns Luvdisc for cute pink love prompt", async () => {
  const { searchBulbapediaLore } = await import("@/lib/pokedex/retrieval/vector-search");

  const result = await searchBulbapediaLore({
    searchQuery: "cute pink pokemon associated with love",
    entityHints: [],
    attributeHints: ["cute", "pink", "love"],
    questionIntent: "descriptive_search",
    confidence: 0.92
  }, { preferLocal: true });

  assert.ok(result, "Expected a lore result.");
  assert.equal(result?.matches[0]?.title, "Luvdisc");
});

test("Local Bulbapedia retrieval returns Mewtwo for controversial lore prompt", async () => {
  const { searchBulbapediaLore } = await import("@/lib/pokedex/retrieval/vector-search");

  const result = await searchBulbapediaLore({
    searchQuery: "why was mewtwo controversial",
    entityHints: ["mewtwo"],
    attributeHints: ["controversial"],
    questionIntent: "entity_lore",
    confidence: 0.95
  }, { preferLocal: true });

  assert.ok(result, "Expected a lore result.");
  assert.equal(result?.matches[0]?.title, "Mewtwo");
});

test("Local Bulbapedia retrieval rejects weak irrelevant prompts", async () => {
  const { searchBulbapediaLore } = await import("@/lib/pokedex/retrieval/vector-search");

  const result = await searchBulbapediaLore({
    searchQuery: "industrial steel manufacturing process in modern cities",
    entityHints: [],
    attributeHints: ["industrial", "manufacturing"],
    questionIntent: "broad_lore",
    confidence: 0.4
  }, { preferLocal: true });

  assert.equal(result, null);
});
