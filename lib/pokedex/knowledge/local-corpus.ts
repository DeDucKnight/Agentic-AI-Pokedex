import seedPages from "@/data/bulbapedia/seed-pages.json";

interface LoreDocument {
  slug: string;
  title: string;
  content: string;
  tags: string[];
  isPlaceholder?: boolean;
}

interface SeedPage {
  slug: string;
  title: string;
  path: string;
}

const generationHints: Array<{ match: RegExp; generation: string }> = [
  { match: /^(bulbasaur|mew|mewtwo|dragonite|eevee|pikachu|gengar|snorlax|articuno|zapdos|moltres)$/i, generation: "gen1" },
  { match: /^(chikorita|typhlosion|feraligatr|togepi|ampharos|espeon|umbreon|lugia|ho-oh|mareep|wooper|sudowoodo)$/i, generation: "gen2" },
  { match: /^(treecko|grovyle|sceptile|torchic|mudkip|gardevoir|absol|luvdisc|bagon|salamence|rayquaza)$/i, generation: "gen3" }
];

const handcraftedLore: Record<string, Omit<LoreDocument, "slug" | "title">> = {
  mewtwo: {
    tags: ["mewtwo", "controversial", "lore", "history", "gen1"],
    content:
      "Mewtwo was presented as a man-made Pokemon created through genetic manipulation of Mew. Its backstory was darker and more science-fiction driven than many early Pokemon stories, which made it feel controversial and intense when first introduced. The first movie reinforced that image with themes of cloning, identity, and existential conflict."
  },
  luvdisc: {
    tags: ["luvdisc", "pink", "love", "cute", "heart"],
    content:
      "Luvdisc is a small pink heart-shaped Pokemon strongly associated with romance and affection. Its design and Pokedex themes make it one of the clearest matches for questions about a cute pink Pokemon connected to love."
  },
  gardevoir: {
    tags: ["gardevoir", "elegant", "protective", "love", "psychic", "fairy"],
    content:
      "Gardevoir is often described as elegant, loyal, and deeply protective of its trainer. In lore-focused or recommendation-style prompts, it can fit emotional or noble descriptions better than purely stat-based picks."
  },
  gengar: {
    tags: ["gengar", "ghost", "trickster", "shadow", "lore"],
    content:
      "Gengar is known for its mischievous personality and shadowy behavior. It hides in darkness, laughs at frightened victims, and is commonly framed as a spooky trickster in Pokemon media."
  },
  treecko: {
    tags: ["treecko", "grass", "starter", "gen3", "beginner", "recommended"],
    content:
      "Treecko is the Grass-type starter from Hoenn, the third generation. It is often framed as a clean, beginner-friendly choice for players who want speed, style, and a clear evolution path into Grovyle and Sceptile."
  },
  dragapult: {
    tags: ["dragapult", "dragon", "ghost", "stealth", "speed"],
    content:
      "Dragapult is a stealthy Dragon- and Ghost-type Pokemon known for its eerie design, extreme speed, and strange habit of carrying Dreepy in the launch ports on its head. It fits queries about fast, spectral, or intimidating Pokemon with a modern pseudo-legendary feel."
  },
  pikachu: {
    tags: ["pikachu", "iconic", "electric", "mascot", "cute"],
    content:
      "Pikachu is the franchise mascot and one of the most recognizable Pokemon in the series. Its cute design, electric theme, and constant anime presence make it a natural match for beginner-facing searches and iconic-character prompts."
  },
  charizard: {
    tags: ["charizard", "dragon-like", "fire", "iconic", "popular"],
    content:
      "Charizard is one of the most popular fully evolved starters, known for its dragon-like silhouette, fiery temperament, and strong presence across games, anime, and promotional material."
  },
  bulbasaur: {
    tags: ["bulbasaur", "grass", "starter", "calm", "beginner"],
    content:
      "Bulbasaur is often treated as a gentle and reliable starter choice, combining plant-based biology with a calm, approachable design. It is a good fit for beginner recommendation prompts and classic Kanto nostalgia."
  },
  eevee: {
    tags: ["eevee", "cute", "evolution", "versatile", "popular"],
    content:
      "Eevee is famous for its flexible evolution concept, which makes it a common answer for recommendation prompts and discovery-style questions about adaptability, cuteness, and branching possibilities."
  }
};

function inferGeneration(slug: string) {
  return generationHints.find((entry) => entry.match.test(slug))?.generation ?? "pokemon";
}

function buildDefaultTags(page: SeedPage) {
  return Array.from(
    new Set([
      page.slug,
      ...page.slug.split("-"),
      inferGeneration(page.slug),
      "lore",
      "bulbapedia"
    ])
  );
}

function buildDefaultContent(page: SeedPage) {
  return `${page.title} appears in the curated Bulbapedia fallback corpus for lore and descriptive retrieval. This entry stands in for scraped narrative text during local development so the assistant can still surface ${page.title} for source-aware Pokemon questions when the remote Bulbapedia corpus is unavailable.`;
}

const seedLoreDocuments = (seedPages as SeedPage[]).map((page) => {
  const override = handcraftedLore[page.slug];

  return {
    slug: `${page.slug}-lore`,
    title: page.title,
    tags: override?.tags ?? buildDefaultTags(page),
    content: override?.content ?? buildDefaultContent(page),
    isPlaceholder: !override
  };
});

export const localLoreCorpus: LoreDocument[] = seedLoreDocuments;
