import express, { type Request, type Response } from "express";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { ENABLED_NEWS_SOURCES } from "../src/config/newsSources";
import { NewsCache, type NewsCacheValue } from "../src/lib/news/cache";
import { deduplicateItems } from "../src/lib/news/deduplicateItems";
import { fetchFeed } from "../src/lib/news/fetchFeed";
import { hydrateMissingArticleImages } from "../src/lib/news/hydrateArticleImages";
import { normalizeItem } from "../src/lib/news/normalizeItem";
import type { LottoMindNewsItem, NewsCategory, NewsSourceStatus } from "../src/types/news";
import { createAccountRouter } from "./account/routes";
import { AccountLedgerStore } from "./account/store";
import { createGameRewardsRouter } from "./game-rewards/routes";
import { createBillingRoutes } from "./billing/routes";

const here = dirname(fileURLToPath(import.meta.url));
const newsRoot = resolve(here, "..");
const siteRoot = resolve(newsRoot, "..");
const cache = new NewsCache(resolve(newsRoot, ".cache", "news.json"), 20 * 60 * 1000);
const app = express();
const port = Number(process.env.PORT || 8142);
const retentionDays = Math.min(365, Math.max(7, Number(process.env.NEWS_RETENTION_DAYS || 120)));
const isProduction = process.env.NODE_ENV === "production";
const collectorFeatureEnabled = process.env.LOTTOMIND_COLLECTIBLE_ACCESS !== "false";
const configuredPepper = process.env.LOTTOMIND_REDEMPTION_PEPPER?.trim();
const accountStore = new AccountLedgerStore(
  process.env.LOTTOMIND_ACCOUNT_DATA_FILE || resolve(newsRoot, ".data", "account-ledger.json"),
  configuredPepper || (isProduction ? "" : "local-development-only-change-me"),
  collectorFeatureEnabled && (!isProduction || Boolean(configuredPepper)),
);
const allowedOrigins = new Set([
  "http://127.0.0.1:8143",
  "http://127.0.0.1:8170",
  "http://localhost:8170",
  "https://robjasper2084.github.io",
  ...String(process.env.LOTTOMIND_ALLOWED_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
]);

const CATEGORY_ALIASES: Record<string, NewsCategory> = {
  lottery: "Lottery News",
  winners: "Lottery Winners",
  jackpots: "Jackpot Watch",
  "powerball-mega-millions": "Powerball / Mega Millions",
  "pick-3-pick-4": "Pick 3 / Pick 4",
  "state-lottery": "State Lottery",
  "ticket-safety": "Ticket Safety",
  "lottery-law": "Lottery Law",
  "ufo-uap": "UFO / UAP",
  "official-uap": "Official UAP",
  unexplained: "The Unexplained",
  paranormal: "Paranormal",
  "space-mystery": "Space Mystery",
  numerology: "Numerology",
  horoscopes: "Horoscopes",
};

app.disable("x-powered-by");
const billing = createBillingRoutes(accountStore);
app.post("/api/billing/webhook", express.raw({ type: "application/json", limit: "256kb" }), billing.webhook);
app.use(express.json({ limit: "32kb" }));
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (request.headers.origin && allowedOrigins.has(request.headers.origin)) {
    response.setHeader("Access-Control-Allow-Origin", request.headers.origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Vary", "Origin");
  }
  if (request.method === "OPTIONS") return response.status(204).end();
  next();
});

app.use("/api", createAccountRouter(accountStore, isProduction));
app.use("/api/v1", createGameRewardsRouter(accountStore));
app.use("/api/billing", billing.router);

function textParam(value: unknown, maxLength = 120): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function integerParam(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

async function aggregateNews(): Promise<NewsCacheValue> {
  const fetchedAt = new Date().toISOString();
  const results = await Promise.allSettled(
    ENABLED_NEWS_SOURCES.map(async (source) => {
      const rawItems = await fetchFeed(source);
      const items = rawItems
        .map((item) => normalizeItem(item, source, fetchedAt, retentionDays))
        .filter((item): item is LottoMindNewsItem => Boolean(item));
      return { source, items };
    }),
  );

  const items: LottoMindNewsItem[] = [];
  const sourceStatuses: NewsSourceStatus[] = results.map((result, index) => {
    const source = ENABLED_NEWS_SOURCES[index];
    if (result.status === "fulfilled") {
      items.push(...result.value.items);
      return { id: source.id, name: source.name, ok: true, itemCount: result.value.items.length };
    }
    return {
      id: source.id,
      name: source.name,
      ok: false,
      itemCount: 0,
      message: result.reason instanceof Error ? result.reason.message.slice(0, 120) : "Source unavailable",
    };
  });

  if (!items.length) throw new Error("No approved news sources returned current items");
  const deduplicatedItems = deduplicateItems(items);
  return { items: await hydrateMissingArticleImages(deduplicatedItems), fetchedAt, sourceStatuses };
}

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "lottomind-site",
    sources: ENABLED_NEWS_SOURCES.length,
    collectorAccess: collectorFeatureEnabled && (!isProduction || Boolean(configuredPepper)),
  });
});

app.get("/api/eightball", async (request: Request, response: Response) => {
  const question = textParam(request.query.question, 160);
  if (!question) {
    return response.status(400).json({ error: "A yes-or-no question is required." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const endpoint = new URL("https://eightballapi.com/api/biased");
    endpoint.searchParams.set("question", question);
    endpoint.searchParams.set("lucky", "false");
    endpoint.searchParams.set("locale", "en");

    const upstream = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!upstream.ok) throw new Error(`Eight Ball API returned ${upstream.status}`);

    const payload = await upstream.json() as {
      reading?: unknown;
      sentiment?: { score?: unknown };
    };
    const reading = typeof payload.reading === "string" ? payload.reading.trim().slice(0, 240) : "";
    const score = Number(payload.sentiment?.score);
    if (!reading) throw new Error("Eight Ball API returned no reading");

    response.setHeader("Cache-Control", "no-store");
    return response.json({
      reading,
      question,
      sentiment: { score: Number.isFinite(score) ? score : 0 },
      source: "eightballapi.com",
    });
  } catch (error) {
    return response.status(502).json({
      error: "The Eight Ball signal is temporarily unavailable.",
      detail: error instanceof Error ? error.message : "Unknown upstream error",
    });
  } finally {
    clearTimeout(timeout);
  }
});

app.get("/api/news", async (request: Request, response: Response) => {
  try {
    const forceRefresh = request.query.refresh === "1" || request.query.refresh === "true";
    const { value, cached } = await cache.resolve(aggregateNews, forceRefresh);
    const categoryInput = textParam(request.query.category, 80).toLowerCase();
    const category = CATEGORY_ALIASES[categoryInput] || (value.items.find((item) => item.category.toLowerCase() === categoryInput)?.category);
    const search = textParam(request.query.search).toLowerCase();
    const source = textParam(request.query.source, 80).toLowerCase();
    const fromDateInput = textParam(request.query.fromDate, 40);
    const fromDate = fromDateInput ? Date.parse(fromDateInput) : Number.NaN;
    const page = integerParam(request.query.page, 1, 1, 10_000);
    const limit = integerParam(request.query.limit, 24, 1, 50);

    const filtered = value.items.filter((item) => {
      if (category && item.category !== category) return false;
      if (source && !`${item.source} ${item.sourceUrl}`.toLowerCase().includes(source)) return false;
      if (Number.isFinite(fromDate) && Date.parse(item.publishedAt) < fromDate) return false;
      if (search) {
        const searchable = `${item.title} ${item.source} ${item.summary} ${item.tags.join(" ")} ${item.category}`.toLowerCase();
        if (!searchable.includes(search)) return false;
      }
      return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * limit;
    response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=1200");
    response.json({
      items: filtered.slice(offset, offset + limit),
      total: filtered.length,
      page: safePage,
      limit,
      totalPages,
      fetchedAt: value.fetchedAt,
      cached,
      retentionDays,
      sourceStatuses: value.sourceStatuses,
    });
  } catch (error) {
    response.status(503).json({
      error: "News sources are temporarily unavailable.",
      detail: error instanceof Error ? error.message : "Unknown aggregation error",
    });
  }
});

app.use("/news", express.static(resolve(siteRoot, "news"), { maxAge: "1h", index: false }));
app.get(["/news", "/news/", "/news/*path"], (_request, response) => {
  response.sendFile(resolve(siteRoot, "news", "index.html"));
});
app.use(["/news-hub/.data", "/news-hub/.data/*path"], (_request, response) => {
  response.status(404).end();
});
app.use(express.static(siteRoot, { extensions: ["html"], maxAge: "5m" }));

app.listen(port, "127.0.0.1", () => {
  if (isProduction && collectorFeatureEnabled && !configuredPepper) {
    console.warn("Collector Access is disabled: set LOTTOMIND_REDEMPTION_PEPPER in production.");
  }
  console.log(`LottoMind site and news API listening at http://127.0.0.1:${port}`);
});
