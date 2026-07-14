import type { LottoMindNewsItem } from "../../types/news";

const CREDIBILITY_WEIGHT: Record<LottoMindNewsItem["credibilityLabel"], number> = {
  Official: 6,
  "Established News": 5,
  "Scientific Source": 4,
  "Specialist Source": 3,
  "Unverified Claim": 2,
  Entertainment: 1,
};

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+[|–—-]\s+[^|–—-]{2,40}$/, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(left: string, right: string): number {
  if (left === right) return 1;
  if (!left.length || !right.length) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = saved;
    }
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

function preferred(left: LottoMindNewsItem, right: LottoMindNewsItem): LottoMindNewsItem {
  const weightDifference = CREDIBILITY_WEIGHT[left.credibilityLabel] - CREDIBILITY_WEIGHT[right.credibilityLabel];
  if (weightDifference !== 0) return weightDifference > 0 ? left : right;
  return Date.parse(left.publishedAt) <= Date.parse(right.publishedAt) ? left : right;
}

export function deduplicateItems(items: LottoMindNewsItem[]): LottoMindNewsItem[] {
  const kept: LottoMindNewsItem[] = [];
  for (const item of items) {
    const normalized = normalizeTitle(item.title);
    const matchIndex = kept.findIndex((candidate) => {
      if (candidate.canonicalUrl === item.canonicalUrl) return true;
      const candidateTitle = normalizeTitle(candidate.title);
      if (candidateTitle === normalized) return true;
      const daysApart = Math.abs(Date.parse(candidate.publishedAt) - Date.parse(item.publishedAt)) / 86_400_000;
      return daysApart <= 3 && similarity(candidateTitle, normalized) > 0.88;
    });
    if (matchIndex < 0) kept.push(item);
    else kept[matchIndex] = preferred(kept[matchIndex], item);
  }
  return kept.sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
}
