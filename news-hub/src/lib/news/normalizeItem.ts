import { createHash } from "node:crypto";
import type { LottoMindNewsItem, NewsSourceConfig, RawNewsItem } from "../../types/news";
import { categorizeItem, tagsForItem } from "./categorizeItem";
import { estimateReadTime } from "./estimateReadTime";
import { canonicalizeUrl, cleanText, safeHttpsUrl, validDate } from "./sanitize";

const DEFAULT_RETENTION_DAYS = 120;

export function normalizeItem(
  raw: RawNewsItem,
  source: NewsSourceConfig,
  fetchedAt: string,
  retentionDays = DEFAULT_RETENTION_DAYS,
): LottoMindNewsItem | undefined {
  const title = cleanText(raw.title, 180);
  const articleUrl = safeHttpsUrl(raw.link, source.url);
  const canonicalUrl = canonicalizeUrl(raw.link, source.url);
  const published = validDate(raw.publishedAt);
  const publisherName = cleanText(raw.sourceName || source.name, 120);
  const publisherUrl = safeHttpsUrl(raw.sourceUrl, articleUrl) || source.url;

  if (!title || !articleUrl || !canonicalUrl || !published || !publisherName) return undefined;
  if (Date.now() - published.getTime() > retentionDays * 24 * 60 * 60 * 1000) return undefined;

  const category = categorizeItem(raw, source);
  const summary = cleanText(raw.description || `${title}. Open the original publisher for the complete report.`);
  const imageUrl = safeHttpsUrl(raw.imageUrl, source.url);
  const isFreeToRead = source.isFreeToRead !== false;

  return {
    id: createHash("sha256").update(`${canonicalUrl}|${title.toLowerCase()}`).digest("hex").slice(0, 20),
    title,
    source: publisherName,
    sourceUrl: publisherUrl,
    articleUrl,
    canonicalUrl,
    category,
    publishedAt: published.toISOString(),
    displayDate: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(published),
    summary,
    imageUrl,
    estimatedReadMinutes: estimateReadTime(`${title} ${summary}`),
    tags: tagsForItem(raw, category),
    credibilityLabel: source.credibilityLabel,
    isOfficialSource: source.isOfficialSource === true,
    isFreeToRead,
    freeAccessNote: isFreeToRead
      ? "This source is currently available without a known subscription requirement."
      : "Access conditions may have changed. Open the original source to confirm.",
    fetchedAt,
  };
}
