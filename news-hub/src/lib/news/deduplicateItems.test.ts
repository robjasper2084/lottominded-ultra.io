import assert from "node:assert/strict";
import test from "node:test";
import type { LottoMindNewsItem } from "../../types/news";
import { deduplicateItems, normalizeTitle } from "./deduplicateItems";

function item(overrides: Partial<LottoMindNewsItem>): LottoMindNewsItem {
  return {
    id: "1",
    title: "Powerball jackpot winner announced",
    source: "Example",
    sourceUrl: "https://example.com",
    articleUrl: "https://example.com/story",
    canonicalUrl: "https://example.com/story",
    category: "Lottery Winners",
    publishedAt: "2026-07-01T12:00:00.000Z",
    displayDate: "Jul 1, 2026",
    summary: "Summary",
    tags: [],
    credibilityLabel: "Established News",
    isOfficialSource: false,
    isFreeToRead: true,
    freeAccessNote: "Free",
    fetchedAt: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

test("normalizes punctuation and publisher suffixes", () => {
  assert.equal(normalizeTitle("Powerball Winner — News Desk"), "powerball winner");
});

test("prefers an official duplicate", () => {
  const result = deduplicateItems([
    item({ id: "secondary" }),
    item({ id: "official", canonicalUrl: "https://official.example/story", articleUrl: "https://official.example/story", credibilityLabel: "Official", isOfficialSource: true }),
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "official");
});
