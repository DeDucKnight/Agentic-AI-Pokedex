import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envLocalPath = resolve(process.cwd(), ".env.local");

if (existsSync(envLocalPath)) {
  const contents = readFileSync(envLocalPath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

test("Gemini client can generate a simple response", async () => {
  const [{ env }, { getGeminiClient }] = await Promise.all([
    import("@/lib/env"),
    import("@/lib/gemini")
  ]);

  assert.ok(
    env.GEMINI_API_KEY,
    "GEMINI_API_KEY must be set in .env.local to run this test."
  );

  const client = getGeminiClient();
  assert.ok(client, "Gemini client should initialize when GEMINI_API_KEY is present.");

  const response = await client.models.generateContent({
    model: env.GEMINI_MODEL,
    contents:
      "Reply with exactly this token and nothing else: POKEDEX_GEMINI_OK"
  });

  const text = response.text?.trim();

  assert.ok(text, "Gemini should return text.");
  assert.match(
    text,
    /POKEDEX_GEMINI_OK/,
    `Unexpected Gemini response text: ${text}`
  );
});

test('Pipeline returns an answer for "What are Gengar\'s base stats?"', async () => {
  const [{ runPokedexPipeline }] = await Promise.all([
    import("@/lib/pokedex/router")
  ]);

  const result = await runPokedexPipeline("What are Gengar's base stats?");

  assert.ok(result.answer.trim().length > 0, "Pipeline should return a non-empty answer.");
  assert.ok(Array.isArray(result.sources), "Pipeline should return a sources array.");
  assert.ok(result.trace, "Pipeline should return a reasoning trace.");
  assert.equal(result.trace.selectedRoute, "pokeapi");
});
