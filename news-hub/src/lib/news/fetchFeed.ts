import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
import type { NewsSourceConfig, RawNewsItem } from "../../types/news";
import { cleanText, safeHttpsUrl } from "./sanitize";

const REQUEST_TIMEOUT_MS = 12_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; LottoMindNewsHub/1.0; +https://robjasper2084.github.io/Jungle-Lotto/)";
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  processEntities: true,
});

function arrayOf<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function valueOf(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate = record["#text"] ?? record["@_href"] ?? record["@_url"];
    return candidate === undefined ? undefined : String(candidate);
  }
  return undefined;
}

function imageFrom(record: Record<string, unknown>): string | undefined {
  const enclosure = record.enclosure as Record<string, unknown> | undefined;
  const media = (record["media:content"] ?? record["media:thumbnail"]) as Record<string, unknown> | undefined;
  return valueOf(enclosure?.["@_url"] ?? media?.["@_url"]);
}

function parseXml(xml: string): RawNewsItem[] {
  const data = parser.parse(xml) as Record<string, any>;
  const rssItems = arrayOf<Record<string, unknown>>(data?.rss?.channel?.item);
  if (rssItems.length) {
    return rssItems.map((item) => ({
      title: valueOf(item.title),
      link: valueOf(item.link),
      description: valueOf(item.description ?? item["content:encoded"]),
      publishedAt: valueOf(item.pubDate ?? item.date ?? item["dc:date"]),
      imageUrl: imageFrom(item),
      tags: arrayOf(item.category).map(valueOf).filter((value): value is string => Boolean(value)),
    }));
  }

  const entries = arrayOf<Record<string, unknown>>(data?.feed?.entry);
  return entries.map((entry) => {
    const links = arrayOf<Record<string, unknown>>(entry.link as Record<string, unknown> | Record<string, unknown>[]);
    const alternate = links.find((link) => !link["@_rel"] || link["@_rel"] === "alternate") ?? links[0];
    return {
      title: valueOf(entry.title),
      link: valueOf(alternate?.["@_href"] ?? entry.link),
      description: valueOf(entry.summary ?? entry.content),
      publishedAt: valueOf(entry.published ?? entry.updated),
      imageUrl: imageFrom(entry),
      tags: arrayOf(entry.category).map((category) => valueOf((category as Record<string, unknown>)?.["@_term"] ?? category)).filter((value): value is string => Boolean(value)),
    };
  });
}

function parseDateFromText(text: string): string | undefined {
  const match = text.match(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+20\d{2}|\d{1,2}\/\d{1,2}\/20\d{2}/i);
  return match?.[0];
}

function parseHtml(html: string, source: NewsSourceConfig): RawNewsItem[] {
  const $ = cheerio.load(html);
  $("script, style, iframe, noscript, img[width='1'], img[height='1']").remove();
  const found: RawNewsItem[] = [];
  const seen = new Set<string>();

  $("article, .views-row, .news-item, .news-listing-item, tr, main li").each((_, element) => {
    const node = $(element);
    const anchor = node.find("h1 a[href], h2 a[href], h3 a[href], h4 a[href], a[href]").first();
    const title = cleanText(anchor.text() || node.find("h1, h2, h3, h4, strong").first().text(), 180);
    const link = safeHttpsUrl(anchor.attr("href") || source.url, source.url);
    const body = cleanText(node.text(), 500);
    const publishedAt = node.find("time").attr("datetime") || parseDateFromText(body);
    if (!title || !link || !publishedAt || seen.has(`${title}|${link}`)) return;
    seen.add(`${title}|${link}`);
    found.push({
      title,
      link,
      description: body.replace(title, "").trim(),
      publishedAt,
      imageUrl: safeHttpsUrl(node.find("img").first().attr("src"), source.url),
    });
  });

  if (found.length) return found.slice(0, 60);

  $("h1, h2, h3").each((_, element) => {
    const node = $(element);
    const anchor = node.is("a") ? node : node.find("a[href]").first();
    const title = cleanText(node.text(), 180);
    const link = safeHttpsUrl(anchor.attr("href") || source.url, source.url);
    const context = cleanText(node.parent().text(), 500);
    const publishedAt = parseDateFromText(context);
    if (title && link && publishedAt) found.push({ title, link, description: context, publishedAt });
  });
  return found.slice(0, 60);
}

interface NewsDataResponse {
  results?: Array<Record<string, unknown>>;
}

interface AstrologyDailyResponse {
  status?: boolean;
  sun_sign?: string;
  prediction_date?: string;
  prediction?: Record<string, unknown>;
}

const ZODIAC_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

function astrologyDate(value: unknown): string | undefined {
  const raw = valueOf(value);
  const match = raw?.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return raw;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00.000Z`;
}

function sentence(value: unknown, maxLength = 100): string {
  return cleanText(value, maxLength).replace(/[.!?]?$/, ".");
}

export function parseAstrologyDailyJson(body: string, fallbackSign: string): RawNewsItem[] {
  const payload = JSON.parse(body) as AstrologyDailyResponse;
  if (payload.status === false || !payload.prediction || typeof payload.prediction !== "object") return [];

  const sign = cleanText(payload.sun_sign || fallbackSign, 24).toLowerCase();
  const displaySign = sign ? `${sign.charAt(0).toUpperCase()}${sign.slice(1)}` : "Daily";
  const publishedAt = astrologyDate(payload.prediction_date) || new Date().toISOString();
  const prediction = payload.prediction;
  const summary = [
    sentence(prediction.emotions),
    sentence(prediction.luck),
    sentence(prediction.personal_life),
  ].filter((part) => part !== ".").join(" ");

  if (!summary) return [];
  const dateKey = publishedAt.slice(0, 10);
  return [{
    title: `${displaySign} Daily Horoscope`,
    link: `https://astrologyapi.com/horoscope-api?sign=${encodeURIComponent(sign)}&date=${dateKey}`,
    description: summary,
    publishedAt,
    tags: ["horoscope", "zodiac", "daily astrology", sign].filter(Boolean),
    sourceName: "AstrologyAPI",
    sourceUrl: "https://astrologyapi.com/horoscope-api",
  }];
}

async function fetchAstrologyDailyHoroscopes(signal: AbortSignal): Promise<RawNewsItem[]> {
  const token = process.env.ASTROLOGYAPI_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("ASTROLOGYAPI_ACCESS_TOKEN is not configured");

  const timezone = Number(process.env.ASTROLOGYAPI_TIMEZONE ?? "-4");
  const results = await Promise.allSettled(ZODIAC_SIGNS.map(async (sign) => {
    const response = await fetch(`https://json.astrologyapi.com/v1/sun_sign_prediction/daily/${sign}`, {
      method: "POST",
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/json",
        "content-type": "application/json",
        "x-astrologyapi-key": token,
      },
      body: JSON.stringify({ timezone: Number.isFinite(timezone) ? timezone : -4 }),
      signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.text();
    if (body.length > 1_000_000) throw new Error("Astrology response exceeded 1 MB limit");
    return parseAstrologyDailyJson(body, sign);
  }));

  const items = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (!items.length) throw new Error("AstrologyAPI returned no current horoscope summaries");
  return items;
}

const NEWSDATA_SOURCE_MATCHERS: Record<string, RegExp> = {
  "newsdata-latest": /lottery|lotto|jackpot|powerball|mega millions|winning numbers/i,
  "newsdata-horoscopes": /horoscope|zodiac|astrology|retrograde|birth chart|star sign|full moon|new moon/i,
};

export function parseNewsDataJson(body: string, sourceId = "newsdata-latest"): RawNewsItem[] {
  const payload = JSON.parse(body) as NewsDataResponse;
  if (!Array.isArray(payload.results)) return [];

  const matcher = NEWSDATA_SOURCE_MATCHERS[sourceId];
  return payload.results.flatMap((item) => {
    const tags = [
      ...arrayOf(item.keywords as string | string[] | undefined),
      ...arrayOf(item.category as string | string[] | undefined),
    ].map(valueOf).filter((value): value is string => Boolean(value));
    const title = valueOf(item.title);
    const description = valueOf(item.description ?? item.content);
    const searchable = [title, description, ...tags].filter(Boolean).join(" ");
    if (matcher && !matcher.test(searchable)) return [];

    return [{
      title,
      link: valueOf(item.link),
      description,
      publishedAt: valueOf(item.pubDate ?? item.pubDateTZ),
      imageUrl: valueOf(item.image_url),
      tags,
      sourceName: valueOf(item.source_name ?? item.source_id),
      sourceUrl: valueOf(item.source_url),
    }];
  }).slice(0, 50);
}

export async function fetchFeed(source: NewsSourceConfig): Promise<RawNewsItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    if (source.id === "astrologyapi-daily") {
      return await fetchAstrologyDailyHoroscopes(controller.signal);
    }

    const requestUrl = new URL(source.url);
    if (source.id.startsWith("newsdata-")) {
      const apiKey = process.env.NEWSDATA_API_KEY?.trim();
      if (!apiKey) throw new Error("NEWSDATA_API_KEY is not configured");
      requestUrl.searchParams.set("apikey", apiKey);
    }

    const accept = source.type === "html"
      ? "text/html"
      : source.type === "json"
        ? "application/json"
        : "application/rss+xml, application/atom+xml, application/xml, text/xml";
    const response = await fetch(requestUrl, {
      headers: { "user-agent": USER_AGENT, accept },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.text();
    if (body.length > 8_000_000) throw new Error("Source response exceeded 8 MB limit");
    if (source.type === "html") return parseHtml(body, source);
    if (source.type === "json") return parseNewsDataJson(body, source.id);
    return parseXml(body);
  } finally {
    clearTimeout(timer);
  }
}
