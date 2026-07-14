export type NewsCategory =
  | "Lottery News"
  | "Lottery Winners"
  | "Jackpot Watch"
  | "Powerball / Mega Millions"
  | "Pick 3 / Pick 4"
  | "State Lottery"
  | "Ticket Safety"
  | "Lottery Law"
  | "UFO / UAP"
  | "Official UAP"
  | "The Unexplained"
  | "Paranormal"
  | "Space Mystery"
  | "Numerology"
  | "Horoscopes";

export type CredibilityLabel =
  | "Official"
  | "Established News"
  | "Scientific Source"
  | "Specialist Source"
  | "Unverified Claim"
  | "Entertainment";

export interface LottoMindNewsItem {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  articleUrl: string;
  canonicalUrl: string;
  category: NewsCategory;
  publishedAt: string;
  displayDate: string;
  summary: string;
  imageUrl?: string;
  estimatedReadMinutes?: number;
  tags: string[];
  credibilityLabel: CredibilityLabel;
  isOfficialSource: boolean;
  isFreeToRead: boolean;
  freeAccessNote: string;
  fetchedAt: string;
}

export interface NewsSourceConfig {
  id: string;
  name: string;
  url: string;
  type: "rss" | "atom" | "json" | "html";
  categories: NewsCategory[];
  credibilityLabel: CredibilityLabel;
  enabled: boolean;
  priority: number;
  isOfficialSource?: boolean;
  isFreeToRead?: boolean;
}

export interface RawNewsItem {
  title?: string;
  link?: string;
  description?: string;
  publishedAt?: string;
  imageUrl?: string;
  tags?: string[];
  sourceName?: string;
  sourceUrl?: string;
}

export interface NewsSourceStatus {
  id: string;
  name: string;
  ok: boolean;
  itemCount: number;
  message?: string;
}

export interface NewsApiResponse {
  items: LottoMindNewsItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  fetchedAt: string;
  cached: boolean;
  retentionDays: number;
  sourceStatuses: NewsSourceStatus[];
}
