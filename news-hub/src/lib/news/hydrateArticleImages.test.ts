import assert from "node:assert/strict";
import test from "node:test";
import type { LottoMindNewsItem } from "../../types/news";
import { selectArticleImage } from "./hydrateArticleImages";

const item = {
  title: "Mega Millions Winning Numbers",
  articleUrl: "https://example.com/Games/Mega_Millions/",
} as LottoMindNewsItem;

test("selectArticleImage prefers an Open Graph article image", () => {
  const image = selectArticleImage('<meta property="og:image" content="/media/jackpot.jpg"><img src="/logo.svg">', item);
  assert.equal(image, "https://example.com/media/jackpot.jpg");
});

test("selectArticleImage chooses the page image matching the article", () => {
  const image = selectArticleImage('<img src="/images/powerball.png"><img src="/images/mega_millions.png">', item);
  assert.equal(image, "https://example.com/images/mega_millions.png");
});
