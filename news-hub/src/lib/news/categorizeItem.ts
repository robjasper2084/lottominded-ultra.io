import type { NewsCategory, NewsSourceConfig, RawNewsItem } from "../../types/news";

const CATEGORY_RULES: Array<[NewsCategory, string[]]> = [
  ["Official UAP", ["aaro", "all-domain anomaly resolution", "case resolution", "uap report documents"]],
  ["Lottery Winners", ["winner", "wins", " won ", "claims", "claimed", "winning ticket", "top prize"]],
  ["Pick 3 / Pick 4", ["pick 3", "pick 4", "daily 3", "daily 4", "midday drawing", "evening drawing"]],
  ["Ticket Safety", ["scam", "fraud", "ticket safety", "sign your ticket", "player protection", "stolen ticket"]],
  ["Lottery Law", ["lottery law", "legislation", "regulation", "court", "legal", "commission rule"]],
  ["Jackpot Watch", ["jackpot", "cash option", "drawing tonight", "estimated prize"]],
  ["Powerball / Mega Millions", ["powerball", "mega millions"]],
  ["UFO / UAP", [" ufo", " uap", "unidentified anomalous phenomena", "unidentified object", "aerial phenomenon"]],
  ["Paranormal", ["haunting", "ghost", "cryptid", "paranormal", "supernatural"]],
  ["Numerology", ["numerology", "life path", "birth number", "root number", "lucky number"]],
  ["Horoscopes", ["horoscope", "zodiac", "astrology", "retrograde", "full moon", "new moon"]],
  ["The Unexplained", ["mysterious", "unexplained", "anomaly", "strange discovery", "unknown origin"]],
  ["Space Mystery", ["asteroid", "comet", "exoplanet", "spacecraft", "galaxy", "cosmic", "mars", "moon", "space"]],
  ["State Lottery", ["state lottery", "michigan lottery", "texas lottery", "pennsylvania lottery", "ohio lottery", "wisconsin lottery"]],
];

export function categorizeItem(item: RawNewsItem, source: NewsSourceConfig): NewsCategory {
  const haystack = ` ${item.title ?? ""} ${item.description ?? ""} ${(item.tags ?? []).join(" ")} ${source.name} `.toLowerCase();
  for (const [category, keywords] of CATEGORY_RULES) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return category;
  }
  return source.categories[0] ?? "Lottery News";
}

export function tagsForItem(item: RawNewsItem, category: NewsCategory): string[] {
  const text = `${item.title ?? ""} ${item.description ?? ""}`.toLowerCase();
  const candidates = ["powerball", "mega millions", "jackpot", "winner", "pick 3", "pick 4", "uap", "ufo", "nasa", "aaro", "space", "safety"];
  return Array.from(new Set([category, ...(item.tags ?? []), ...candidates.filter((tag) => text.includes(tag))])).slice(0, 8);
}
