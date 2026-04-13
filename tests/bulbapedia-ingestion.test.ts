import test from "node:test";
import assert from "node:assert/strict";
import seedPages from "@/data/bulbapedia/seed-pages.json";
import {
  buildChunkSlug,
  chunkParagraphs,
  extractBulbapediaParagraphs
} from "@/lib/pokedex/ingestion";

test("seed page list contains a curated corpus-sized set", () => {
  assert.ok(seedPages.length >= 50, "Seed list should contain at least 50 pages.");
  assert.ok(seedPages.length <= 100, "Seed list should contain at most 100 pages.");
});

test("chunk slug generation is deterministic", () => {
  assert.equal(buildChunkSlug("gengar", 1), "gengar::chunk-001");
  assert.equal(buildChunkSlug("gengar", 12), "gengar::chunk-012");
});

test("chunking produces deterministic chunk documents", () => {
  const paragraph =
    "Gengar is a mischievous Ghost-type Pokemon that delights in fear and shadows. ".repeat(12);
  const chunks = chunkParagraphs([paragraph, paragraph], "gengar", "Gengar");

  assert.ok(chunks.length > 0, "Chunking should produce at least one chunk.");
  assert.equal(chunks[0]?.slug, "gengar::chunk-001");
  assert.ok(chunks.every((chunk) => chunk.content.length >= 250));
});

test("Bulbapedia HTML extraction keeps narrative paragraphs", () => {
  const html = `
    <div id="mw-content-text">
      <div class="mw-parser-output">
        <p>Bulbasaur is a small quadrupedal Pokemon with a large plant bulb on its back that stores nutrients over time.</p>
        <h2>Biology</h2>
        <p>It can be seen napping in bright sunlight and relies on photosynthesis to power its growth.</p>
        <h2>Game data</h2>
        <p>This paragraph should be ignored because it is mechanical.</p>
      </div>
    </div>
  `;

  const paragraphs = extractBulbapediaParagraphs(html);

  assert.equal(paragraphs.length, 2);
  assert.match(paragraphs[0] ?? "", /Bulbasaur is a small quadrupedal Pokemon/i);
  assert.match(paragraphs[1] ?? "", /photosynthesis/i);
});
