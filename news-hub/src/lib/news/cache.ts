import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { LottoMindNewsItem, NewsSourceStatus } from "../../types/news";

export interface NewsCacheValue {
  items: LottoMindNewsItem[];
  fetchedAt: string;
  sourceStatuses: NewsSourceStatus[];
}

export class NewsCache {
  private value: NewsCacheValue | undefined;

  private pending: Promise<NewsCacheValue> | undefined;

  constructor(
    private readonly filePath: string,
    private readonly ttlMs = 20 * 60 * 1000,
  ) {}

  isFresh(value = this.value): boolean {
    return Boolean(value && Date.now() - Date.parse(value.fetchedAt) < this.ttlMs);
  }

  async get(): Promise<NewsCacheValue | undefined> {
    if (this.value) return this.value;
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8")) as NewsCacheValue;
      if (Array.isArray(parsed.items) && parsed.fetchedAt) this.value = parsed;
    } catch {
      this.value = undefined;
    }
    return this.value;
  }

  async set(value: NewsCacheValue): Promise<void> {
    this.value = value;
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(value, null, 2), "utf8");
  }

  async resolve(loader: () => Promise<NewsCacheValue>, force = false): Promise<{ value: NewsCacheValue; cached: boolean }> {
    const current = await this.get();
    if (!force && this.isFresh(current)) return { value: current!, cached: true };
    if (!this.pending) {
      this.pending = loader().finally(() => {
        this.pending = undefined;
      });
    }
    try {
      const value = await this.pending;
      await this.set(value);
      return { value, cached: false };
    } catch (error) {
      if (current) return { value: current, cached: true };
      throw error;
    }
  }
}
