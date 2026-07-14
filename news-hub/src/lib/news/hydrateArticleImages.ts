import * as cheerio from "cheerio";
import type { LottoMindNewsItem } from "../../types/news";
import { safeHttpsUrl } from "./sanitize";

const REQUEST_TIMEOUT_MS = 6_000;
const MAX_ARTICLE_LOOKUPS = 40;
const CONCURRENCY = 5;
const BLOCKED_IMAGE = /(?:logo|icon|sprite|avatar|social|facebook|instagram|youtube|tracking|pixel|module-|header|footer)/i;

function imageTokens(item: LottoMindNewsItem): string[] {
  const value = `${item.title} ${new URL(item.articleUrl).pathname}`.toLowerCase();
  return [...new Set(value.split(/[^a-z0-9]+/).filter((token) => token.length >= 4 && !["winning", "numbers", "games", "latest"].includes(token)))];
}

export function selectArticleImage(html: string, item: LottoMindNewsItem): string | undefined {
  const $ = cheerio.load(html);
  const tokens = imageTokens(item);
  const candidates: Array<{ url: string; score: number }> = [];
  const seen = new Set<string>();

  const add = (value: string | undefined, baseScore: number) => {
    const url = safeHttpsUrl(value, item.articleUrl);
    if (!url || seen.has(url)) return;
    seen.add(url);
    const path = new URL(url).pathname.toLowerCase();
    let score = baseScore + tokens.reduce((total, token) => total + (path.includes(token) ? 14 : 0), 0);
    if (/\.(?:jpe?g|png|webp)(?:$|\?)/i.test(url)) score += 8;
    if (BLOCKED_IMAGE.test(path) || path.endsWith(".svg")) score -= 220;
    candidates.push({ url, score });
  };

  add($("meta[property='og:image']").attr("content"), 240);
  add($("meta[name='twitter:image']").attr("content"), 220);
  $("main img[src], article img[src], img[src]").each((_, element) => add($(element).attr("src"), 20));

  return candidates.sort((left, right) => right.score - left.score).find((candidate) => candidate.score > 0)?.url;
}

async function fetchArticleImage(item: LottoMindNewsItem): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(item.articleUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 (compatible; LottoMindNewsHub/1.0; +https://robjasper2084.github.io/Jungle-Lotto/)",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) return undefined;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("html")) return undefined;
    const html = await response.text();
    return html.length <= 8_000_000 ? selectArticleImage(html, item) : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

export async function hydrateMissingArticleImages(items: LottoMindNewsItem[]): Promise<LottoMindNewsItem[]> {
  const unique = [...new Map(
    items.filter((item) => !item.imageUrl).map((item) => [item.articleUrl, item]),
  ).values()].slice(0, MAX_ARTICLE_LOOKUPS);
  const images = new Map<string, string>();
  let cursor = 0;

  const workers = Array.from({ length: Math.min(CONCURRENCY, unique.length) }, async () => {
    while (cursor < unique.length) {
      const item = unique[cursor++];
      const imageUrl = await fetchArticleImage(item);
      if (imageUrl) images.set(item.articleUrl, imageUrl);
    }
  });
  await Promise.all(workers);

  return items.map((item) => item.imageUrl || !images.has(item.articleUrl)
    ? item
    : { ...item, imageUrl: images.get(item.articleUrl) });
}
