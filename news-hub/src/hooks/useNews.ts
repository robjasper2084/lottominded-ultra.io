import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsApiResponse } from "../types/news";

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
      if (requestId === requestIdRef.current) setError(reason instanceof Error ? reason.message : "News request failed");
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
