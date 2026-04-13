import seedPages from "@/data/bulbapedia/seed-pages.json";
import { env } from "@/lib/env";
import { embedText } from "@/lib/pokedex/embeddings";
import {
  chunkParagraphs,
  extractBulbapediaParagraphs,
  type SeedPage
} from "@/lib/pokedex/ingestion";
import { getSupabaseAdminClient } from "@/lib/supabase";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitFlagIndex = args.findIndex((arg) => arg === "--limit");
const limit =
  limitFlagIndex >= 0 && args[limitFlagIndex + 1]
    ? Number.parseInt(args[limitFlagIndex + 1], 10)
    : null;

function getSelectedPages() {
  const pages = seedPages as SeedPage[];
  return Number.isFinite(limit) && limit ? pages.slice(0, limit) : pages;
}

async function fetchBulbapediaPage(page: SeedPage) {
  const url = `https://bulbapedia.bulbagarden.net/wiki/${page.path}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Agentic-AI-Pokedex/1.0 (educational project ingestion)"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${page.title}: ${response.status}`);
  }

  return response.text();
}

async function upsertChunkDocuments(
  rows: Array<{
    slug: string;
    title: string;
    content: string;
    embedding: number[];
  }>
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for upsert.");
  }

  const { error } = await supabase.from("bulbapedia_documents").upsert(rows, {
    onConflict: "slug"
  });

  if (error) {
    throw error;
  }
}

async function main() {
  const pages = getSelectedPages();
  let processedPages = 0;
  let writtenChunks = 0;
  const failures: string[] = [];

  console.log(
    `Starting Bulbapedia ingestion for ${pages.length} page(s)${dryRun ? " in dry-run mode" : ""}.`
  );

  for (const page of pages) {
    try {
      const html = await fetchBulbapediaPage(page);
      const paragraphs = extractBulbapediaParagraphs(html);
      const chunks = chunkParagraphs(paragraphs, page.slug, page.title);

      if (chunks.length === 0) {
        failures.push(`${page.title}: no usable narrative chunks extracted`);
        continue;
      }

      const embeddedRows = [];

      for (const chunk of chunks) {
        const embedding = await embedText(chunk.content);

        if (!embedding || embedding.length !== env.GEMINI_EMBEDDING_DIMENSION) {
          throw new Error(`Embedding failed for ${chunk.slug}`);
        }

        embeddedRows.push({
          ...chunk,
          embedding
        });
      }

      if (!dryRun) {
        await upsertChunkDocuments(embeddedRows);
      }

      processedPages += 1;
      writtenChunks += embeddedRows.length;
      console.log(`${page.title}: ${embeddedRows.length} chunk(s) ready`);
    } catch (error) {
      failures.push(
        `${page.title}: ${error instanceof Error ? error.message : "Unknown ingestion error"}`
      );
    }
  }

  console.log("");
  console.log("Ingestion summary");
  console.log(`Processed pages: ${processedPages}/${pages.length}`);
  console.log(`Chunk documents: ${writtenChunks}`);
  console.log(`Failures: ${failures.length}`);

  if (failures.length > 0) {
    console.log("");
    for (const failure of failures) {
      console.log(`- ${failure}`);
    }
  }

  if (dryRun) {
    console.log("");
    console.log("Dry run complete. No rows were written to Supabase.");
  }
}

void main();
