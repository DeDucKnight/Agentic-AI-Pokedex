interface LoreDocument {
  slug: string;
  title: string;
  content: string;
  tags: string[];
}

export const localLoreCorpus: LoreDocument[] = [
  {
    slug: "mewtwo-lore",
    title: "Mewtwo",
    tags: ["mewtwo", "controversial", "lore", "history", "gen1"],
    content:
      "Mewtwo was presented as a man-made Pokemon created through genetic manipulation of Mew. Its backstory was darker and more science-fiction driven than many early Pokemon stories, which made it feel controversial and intense when first introduced. The first movie reinforced that image with themes of cloning, identity, and existential conflict."
  },
  {
    slug: "luvdisc-love",
    title: "Luvdisc",
    tags: ["luvdisc", "pink", "love", "cute", "heart"],
    content:
      "Luvdisc is a small pink heart-shaped Pokemon strongly associated with romance and affection. Its design and Pokedex themes make it one of the clearest matches for questions about a cute pink Pokemon connected to love."
  },
  {
    slug: "gardevoir-empathy",
    title: "Gardevoir",
    tags: ["gardevoir", "elegant", "protective", "love", "psychic", "fairy"],
    content:
      "Gardevoir is often described as elegant, loyal, and deeply protective of its trainer. In lore-focused or recommendation-style prompts, it can fit emotional or noble descriptions better than purely stat-based picks."
  },
  {
    slug: "gengar-trickster",
    title: "Gengar",
    tags: ["gengar", "ghost", "trickster", "shadow", "lore"],
    content:
      "Gengar is known for its mischievous personality and shadowy behavior. It hides in darkness, laughs at frightened victims, and is commonly framed as a spooky trickster in Pokemon media."
  },
  {
    slug: "treecko-beginner-grass",
    title: "Treecko Line",
    tags: ["treecko", "grovyle", "sceptile", "grass", "starter", "gen3", "beginner"],
    content:
      "Treecko is the Grass-type starter from Hoenn, the third generation. It evolves into Grovyle and then Sceptile. For beginner-friendly recommendations, Treecko is often framed as a straightforward pick for players who want speed and a clean evolution line."
  },
  {
    slug: "bulbapedia-corpus-note",
    title: "Bulbapedia Corpus",
    tags: ["corpus", "semantic", "lore", "trivia"],
    content:
      "This local fallback corpus stands in for a scraped Bulbapedia dataset during development. In production for the assessment, these entries should be replaced or supplemented with embedded Bulbapedia pages stored in pgvector."
  }
];
