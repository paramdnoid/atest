export const tradeOptions = [
  { slug: "kaminfeger", name: "Kaminfeger" },
  { slug: "maler", name: "Maler & Tapezierer" },
  { slug: "shk", name: "Sanitär, Heizung, Klima" },
] as Array<{ slug: string; name: string }>;

export const tradeSlugs = tradeOptions.map((trade) => trade.slug);
