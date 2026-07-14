import { useCallback, useEffect, useRef, useState } from "react";
import type { CredibilityLabel, LottoMindNewsItem, NewsApiResponse, NewsCategory, NewsSourceStatus } from "../types/news";

interface NewsQuery {
  category?: string;
  search?: string;
  page: number;
  limit: number;
}

const EMPTY_RESPONSE: NewsApiResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 24,
  totalPages: 1,
  fetchedAt: "",
  cached: false,
  retentionDays: 120,
  sourceStatuses: [],
};

interface StaticArticle {
  id?: string;
  title?: string;
  url?: string;
  canonicalUrl?: string;
  sourceName?: string;
  sourceHomepage?: string;
  sourceUrl?: string;
  sourceTrustLevel?: string;
  categories?: string[];
  publishedAt?: string;
  snippet?: string;
  brief?: string;
  generatedAt?: string;
  imageUrl?: string;
}

const CATEGORY_QUERIES: Record<string, NewsCategory[]> = {
  lottery: ["Lottery News", "Lottery Winners", "Jackpot Watch", "Powerball / Mega Millions", "Pick 3 / Pick 4", "State Lottery", "Ticket Safety", "Lottery Law"],
  winners: ["Lottery Winners"],
  jackpots: ["Jackpot Watch", "Powerball / Mega Millions"],
  "pick-3-pick-4": ["Pick 3 / Pick 4"],
  "ticket-safety": ["Ticket Safety"],
  "ufo-uap": ["UFO / UAP", "Official UAP"],
  "official-uap": ["Official UAP"],
  unexplained: ["The Unexplained", "Paranormal"],
  paranormal: ["Paranormal"],
  "space-mystery": ["Space Mystery"],
  numerology: ["Numerology"],
  horoscopes: ["Horoscopes"],
};

function staticCategory(article: StaticArticle): NewsCategory {
  const supplied = article.categories?.[0]?.toLowerCase() || "";
  const text = `${article.title || ""} ${article.snippet || ""} ${article.brief || ""}`.toLowerCase();
  if (supplied.includes("paranormal")) return "Paranormal";
  if (/pick\s*[34]/.test(text)) return "Pick 3 / Pick 4";
  if (/winner|wins?\b|claim(?:ed|s)?\b/.test(text)) return "Lottery Winners";
  if (/jackpot|powerball|mega millions/.test(text)) return "Jackpot Watch";
  if (/ticket|scam|fraud|sign your/.test(text)) return "Ticket Safety";
  return article.sourceTrustLevel === "official-lottery" ? "State Lottery" : "Lottery News";
}

function staticCredibility(article: StaticArticle): CredibilityLabel {
  if (article.sourceTrustLevel === "official-lottery") return "Official";
  if (article.sourceTrustLevel === "media-report") return "Established News";
  if (article.sourceTrustLevel === "paranormal-blog") return "Specialist Source";
  return "Established News";
}

function displayDate(value?: string): string {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) return "Current";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function toStaticNewsItem(article: StaticArticle, index: number): LottoMindNewsItem {
  const articleUrl = article.url || article.canonicalUrl || article.sourceHomepage || article.sourceUrl || "#";
  const sourceUrl = article.sourceHomepage || article.sourceUrl || articleUrl;
  const publishedAt = article.publishedAt || article.generatedAt || new Date().toISOString();
  const summary = article.brief || article.snippet || "Open the original publisher for the complete report.";
  const credibilityLabel = staticCredibility(article);
  return {
    id: article.id || `static-news-${index}`,
    title: article.title || "Current source update",
    source: article.sourceName || "LottoMind approved source",
    sourceUrl,
    articleUrl,
    canonicalUrl: article.canonicalUrl || articleUrl,
    category: staticCategory(article),
    publishedAt,
    displayDate: displayDate(publishedAt),
    summary,
    imageUrl: article.imageUrl,
    estimatedReadMinutes: Math.max(1, Math.round(summary.split(/\s+/).length / 200)),
    tags: [...(article.categories || []), article.sourceTrustLevel || "source"],
    credibilityLabel,
    isOfficialSource: article.sourceTrustLevel === "official-lottery",
    isFreeToRead: true,
    freeAccessNote: "This source is currently available without a known subscription requirement.",
    fetchedAt: article.generatedAt || new Date().toISOString(),
  };
}

function sourceStatusesFor(items: LottoMindNewsItem[]): NewsSourceStatus[] {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item.source, (counts.get(item.source) || 0) + 1));
  return [...counts.entries()].map(([name, itemCount]) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name,
    ok: true,
    itemCount,
  }));
}

async function loadStaticNews(query: NewsQuery, signal: AbortSignal): Promise<NewsApiResponse> {
  const response = await fetch(new URL("../articles.json", window.location.href), {
    signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Static news request failed (${response.status})`);
  const payload = (await response.json()) as StaticArticle[];
  const allItems = (Array.isArray(payload) ? payload : [])
    .map(toStaticNewsItem)
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
  const allowedCategories = query.category ? CATEGORY_QUERIES[query.category] : undefined;
  const search = query.search?.trim().toLowerCase();
  const filtered = allItems.filter((item) => {
    if (allowedCategories && !allowedCategories.includes(item.category)) return false;
    if (search && !`${item.title} ${item.source} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(search)) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / query.limit));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * query.limit;
  return {
    items: filtered.slice(start, start + query.limit),
    total: filtered.length,
    page,
    limit: query.limit,
    totalPages,
    fetchedAt: allItems[0]?.fetchedAt || new Date().toISOString(),
    cached: true,
    retentionDays: 120,
    sourceStatuses: sourceStatusesFor(allItems),
  };
}

export function useNews(query: NewsQuery) {
  const [data, setData] = useState<NewsApiResponse>(EMPTY_RESPONSE);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const hasDataRef = useRef(false);

  const load = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setError("");
    setIsRefreshing(hasDataRef.current);

    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    if (query.category) params.set("category", query.category);
    if (query.search) params.set("search", query.search);
    if (force) params.set("refresh", "1");

    try {
      const response = await fetch(`../api/news?${params}`, { signal: controller.signal, headers: { accept: "application/json" } });
      const payload = (await response.json()) as NewsApiResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || `News request failed (${response.status})`);
      if (requestId === requestIdRef.current) {
        hasDataRef.current = payload.items.length > 0;
        setData(payload);
      }
    } catch (reason) {
      if (controller.signal.aborted) return;
      try {
        const fallback = await loadStaticNews(query, controller.signal);
        if (requestId === requestIdRef.current) {
          hasDataRef.current = fallback.items.length > 0;
          setData(fallback);
          setError("");
        }
      } catch {
        if (controller.signal.aborted) return;
        if (requestId === requestIdRef.current) setError(reason instanceof Error ? reason.message : "News request failed");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [query.category, query.limit, query.page, query.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(false), query.search ? 280 : 0);
    return () => {
      window.clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [load, query.search]);

  useEffect(() => {
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(false);
    }, 30 * 60 * 1000);
    return () => window.clearInterval(poll);
  }, [load]);

  return { data, error, isLoading, isRefreshing, refresh: () => load(true) };
}
