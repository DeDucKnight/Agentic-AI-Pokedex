import { load } from "cheerio";

export interface SeedPage {
  slug: string;
  title: string;
  path: string;
}

export interface ChunkDocument {
  slug: string;
  title: string;
  content: string;
}

const INCLUDED_SECTION_PATTERNS = [
  /biology/i,
  /appearance/i,
  /behavior/i,
  /diet/i,
  /habitat/i,
  /trivia/i,
  /origin/i,
  /name origin/i,
  /etymology/i,
  /design/i,
  /history/i,
  /in the core series/i,
  /evolution/i
];

const EXCLUDED_SECTION_PATTERNS = [
  /game data/i,
  /stats/i,
  /type effectiveness/i,
  /learnset/i,
  /in the tcg/i,
  /side game/i,
  /spin-off/i,
  /sprites/i,
  /merchandise/i,
  /in the manga/i,
  /in the anime/i
];

function cleanText(value: string) {
  return value
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/ ?\((?:Japanese|From Bulbapedia).*?\)/gi, " ")
    .trim();
}

export function buildChunkSlug(pageSlug: string, index: number) {
  return `${pageSlug}::chunk-${String(index).padStart(3, "0")}`;
}

export function chunkParagraphs(paragraphs: string[], pageSlug: string, title: string) {
  const minChars = 500;
  const maxChars = 900;
  const chunks: ChunkDocument[] = [];
  let current: string[] = [];
  let currentLength = 0;

  const flush = () => {
    if (current.length === 0) {
      return;
    }

    chunks.push({
      slug: buildChunkSlug(pageSlug, chunks.length + 1),
      title,
      content: current.join(" ")
    });

    current = current.slice(-1);
    currentLength = current.join(" ").length;
  };

  for (const paragraph of paragraphs) {
    const normalized = cleanText(paragraph);

    if (normalized.length < 80) {
      continue;
    }

    if (currentLength > 0 && currentLength + normalized.length + 1 > maxChars) {
      flush();
    }

    current.push(normalized);
    currentLength = current.join(" ").length;

    if (currentLength >= minChars) {
      flush();
    }
  }

  if (current.length > 0) {
    chunks.push({
      slug: buildChunkSlug(pageSlug, chunks.length + 1),
      title,
      content: current.join(" ")
    });
  }

  return chunks.filter((chunk) => chunk.content.length >= 250);
}

export function extractBulbapediaParagraphs(html: string) {
  const $ = load(html);
  const root = $("#mw-content-text .mw-parser-output").first();

  root.find("table, .toc, .navbox, .metadata, .mw-editsection, script, style, sup.reference, .thumb, ol.references").remove();

  const paragraphs: string[] = [];
  let currentHeading = "lead";

  root.children().each((_, element) => {
    const node = $(element);
    const tag = (element.tagName || "").toLowerCase();

    if (tag === "h2" || tag === "h3") {
      currentHeading = cleanText(node.text()).toLowerCase();
      return;
    }

    const includeSection =
      currentHeading === "lead" ||
      INCLUDED_SECTION_PATTERNS.some((pattern) => pattern.test(currentHeading));

    const excludeSection = EXCLUDED_SECTION_PATTERNS.some((pattern) =>
      pattern.test(currentHeading)
    );

    if (!includeSection || excludeSection) {
      return;
    }

    if (tag === "p") {
      const text = cleanText(node.text());

      if (text.length >= 80) {
        paragraphs.push(text);
      }
    }

    if (tag === "ul") {
      node.find("li").each((__, item) => {
        const text = cleanText($(item).text());

        if (text.length >= 80) {
          paragraphs.push(text);
        }
      });
    }
  });

  if (paragraphs.length > 0) {
    return paragraphs;
  }

  return root
    .find("p")
    .toArray()
    .map((paragraph) => cleanText($(paragraph).text()))
    .filter((text) => text.length >= 80);
}
