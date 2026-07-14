import { useDeferredValue, useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  Signal,
  Sparkles,
} from "lucide-react";
import { useNews } from "../hooks/useNews";
import type { CredibilityLabel, LottoMindNewsItem } from "../types/news";

const CATEGORY_FILTERS = [
  ["All", ""],
  ["Lottery", "lottery"],
  ["Winners", "winners"],
  ["Jackpots", "jackpots"],
  ["Pick 3 / Pick 4", "pick-3-pick-4"],
  ["Ticket Safety", "ticket-safety"],
  ["UFO / UAP", "ufo-uap"],
  ["Official UAP", "official-uap"],
  ["The Unexplained", "unexplained"],
  ["Paranormal", "paranormal"],
  ["Space Mystery", "space-mystery"],
  ["Numerology", "numerology"],
  ["Horoscopes", "horoscopes"],
] as const;

const CREDIBILITY_FILTERS: Array<{ label: string; values: CredibilityLabel[] }> = [
  { label: "Official only", values: ["Official"] },
  { label: "Established reporting", values: ["Established News"] },
  { label: "Scientific sources", values: ["Scientific Source"] },
  { label: "Specialist sources", values: ["Specialist Source", "Unverified Claim"] },
  { label: "Entertainment", values: ["Entertainment"] },
];

const SAVED_KEY = "lottomind-news-saved-v1";

function readSaved(): Set<string> {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function isSpeculative(item: LottoMindNewsItem): boolean {
  return ["UFO / UAP", "The Unexplained", "Paranormal", "Numerology", "Horoscopes"].includes(item.category) && !item.isOfficialSource;
}

function ArticleCard({ item, saved, onSave }: { item: LottoMindNewsItem; saved: boolean; onSave: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(item.articleUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className={`news-card ${isSpeculative(item) ? "news-card--speculative" : ""}`}>
      {item.imageUrl ? (
        <a className="news-card__media" href={item.articleUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.title} at ${item.source}`}>
          <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
        </a>
      ) : (
        <div className="news-card__signal" aria-hidden="true"><Signal size={24} /></div>
      )}
      <div className="news-card__body">
        <div className="news-card__labels">
          <span className="category-label">{item.category}</span>
          <span className={`credibility-label credibility-label--${item.credibilityLabel.toLowerCase().replace(/\s+/g, "-")}`}>
            {item.isOfficialSource ? <ShieldCheck size={13} /> : <Sparkles size={13} />}
            {item.credibilityLabel}
          </span>
        </div>
        <h2>{item.title}</h2>
        <div className="news-card__meta">
          <strong>{item.source}</strong>
          <span>{item.displayDate}</span>
          <span><Clock3 size={13} /> {item.estimatedReadMinutes ?? 1} min</span>
        </div>
        <p>{item.summary}</p>
        <p className="access-note">{item.freeAccessNote}</p>
        <div className="news-card__actions">
          <a href={item.articleUrl} target="_blank" rel="noopener noreferrer">
            Read Original Source <ExternalLink size={15} />
          </a>
          <button type="button" onClick={() => onSave(item.id)} aria-pressed={saved} title={saved ? "Remove saved story" : "Save story"}>
            {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}<span>{saved ? "Saved" : "Save"}</span>
          </button>
          <button type="button" onClick={copyLink} title="Copy original article link">
            {copied ? <Check size={17} /> : <Copy size={17} />}<span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function FeaturedSignal({ label, item, tone }: { label: string; item?: LottoMindNewsItem; tone: "lottery" | "xfiles" | "number" }) {
  return (
    <article className={`featured-signal featured-signal--${tone}`}>
      <span>{label}</span>
      {item ? (
        <>
          <h2>{item.title}</h2>
          <p>{item.source} / {item.displayDate}</p>
          <a href={item.articleUrl} target="_blank" rel="noopener noreferrer">Open signal <ExternalLink size={14} /></a>
        </>
      ) : (
        <><h2>Signal calibrating</h2><p>Refresh the approved source feed.</p></>
      )}
    </article>
  );
}

export function LottoMindNewsPage() {
  const [headerOpen, setHeaderOpen] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(1);
  const [credibility, setCredibility] = useState<Set<CredibilityLabel>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(() => readSaved());
  const [showSaved, setShowSaved] = useState(false);
  const { data, error, isLoading, isRefreshing, refresh } = useNews({ category, search: deferredSearch, page, limit: 30 });

  const filteredItems = useMemo(() => data.items.filter((item) => {
    if (credibility.size && !credibility.has(item.credibilityLabel)) return false;
    if (showSaved && !savedIds.has(item.id)) return false;
    return true;
  }), [credibility, data.items, savedIds, showSaved]);

  const featured = useMemo(() => ({
    lottery: data.items.find((item) => item.category === "State Lottery") || data.items.find((item) => item.category.includes("Lottery")),
    winners: data.items.find((item) => item.category === "Lottery Winners"),
    jackpots: data.items.find((item) => item.category === "Jackpot Watch") || data.items.find((item) => item.category.includes("Powerball")),
    xfiles: data.items.find((item) => item.category === "Official UAP" || item.category === "UFO / UAP" || item.category === "The Unexplained"),
    number: data.items.find((item) => item.category === "Numerology" || item.category === "Pick 3 / Pick 4") || data.items[2],
  }), [data.items]);

  const orderedSourceStatuses = useMemo(() => {
    const statuses = [...data.sourceStatuses];
    const horoscopeIndex = statuses.findIndex((source) => source.id === "newsdata-horoscopes");

    if (horoscopeIndex >= 0) {
      const [horoscopeSource] = statuses.splice(horoscopeIndex, 1);
      statuses.splice(Math.min(1, statuses.length), 0, horoscopeSource);
    }

    return statuses;
  }, [data.sourceStatuses]);

  const liveSources = data.sourceStatuses.filter((source) => source.ok).length;
  const toggleCredibility = (values: CredibilityLabel[]) => {
    setCredibility((current) => {
      const next = new Set(current);
      const active = values.every((value) => next.has(value));
      values.forEach((value) => active ? next.delete(value) : next.add(value));
      return next;
    });
  };
  const toggleSaved = (id: string) => {
    setSavedIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className="news-page">
      <header className={`site-header home-like-header home-sphere-header global-sphere-header${headerOpen ? "" : " is-collapsed"}`} data-site-header>
        <div className="site-header-main">
          <a className="brand" href="../index.html#top" aria-label="LOTTOMINDED ULTRA home">
            <img src="../assets/brand/lm-orb-mark.webp" alt="" />
            <span>LOTTOMINDED ULTRA</span>
          </a>
          <button
            type="button"
            className="site-header-toggle"
            aria-expanded={headerOpen}
            onClick={() => setHeaderOpen((open) => !open)}
          >
            {headerOpen ? "Close" : "Menu"}
          </button>
        </div>
        <nav aria-label="Home sphere navigation">
          <a href="../index.html#top" data-icon="HM">Home</a>
          <a href="../memberships.html" data-icon="MB">Memberships</a>
          <a href="../features-app.html" data-icon="FX">Features</a>
          <a href="./" data-icon="NW" aria-current="page">News</a>
          <a href="../live-events.html" data-icon="EV">Events</a>
          <a href="../lottery-spheres.html#spheres" data-icon="SP">Spheres</a>
          <a href="../beat2lotto-plus.html#beat2lotto" data-icon="B2">Beat2Lotto+</a>
          <a href="../merch-store.html" data-icon="DR">Merch</a>
          <a href="../how-to-use.html" data-icon="GD">Guide</a>
          <a href="https://robjasper2084.github.io/Jungle-Lotto/lotto%20mind%20refined/" data-icon="LM" data-member-app-public="true" aria-label="Open LottoMind Refined App">LottoMind App</a>
        </nav>
        <div className="direct-launch" aria-label="Direct studio launch">
          <a className="direct-action direct-primary" href="../lottomind-stem-studio/index.html">Launch Studio</a>
        </div>
      </header>

      <main>
        <section className="news-motion-rail" aria-labelledby="news-rail-title">
          <div className="news-motion-rail__label">
            <span>Current News Rail</span>
            <h2 id="news-rail-title">Approved sources, one signal route</h2>
            <strong>{String(liveSources).padStart(2, "0")} / {String(data.sourceStatuses.length || 8).padStart(2, "0")}</strong>
          </div>
          <div className="news-motion-rail__track" role="list" aria-label="Publisher connection status">
            {(orderedSourceStatuses.length ? orderedSourceStatuses : [
              { id: "lottery", name: "Lottery Desk", ok: false, itemCount: 0 },
              { id: "space", name: "Space Desk", ok: false, itemCount: 0 },
              { id: "signals", name: "Signal Desk", ok: false, itemCount: 0 },
            ]).map((source) => (
              <div className={source.ok ? "is-live" : ""} key={source.id} role="listitem">
                <Signal size={18} aria-hidden="true" />
                <span>{source.name}</span>
                <small>{source.ok ? `${source.itemCount} stories` : "checking"}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="news-hero" aria-labelledby="news-title">
          <div>
            <span className="news-eyebrow">News intelligence console</span>
            <h1 id="news-title">LottoMind News Intelligence</h1>
            <p>Current lottery updates, winning stories, UAP reports, unexplained mysteries, numerology, and horoscopes.</p>
          </div>
          <div className="news-hero__status" aria-live="polite">
            <span className={`live-source ${liveSources ? "is-live" : ""}`}><i /> {liveSources} of {data.sourceStatuses.length || 8} sources live</span>
            <span>Last refreshed {data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "waiting"}</span>
            <button type="button" onClick={refresh} disabled={isRefreshing}>
              <RefreshCw size={17} className={isRefreshing ? "is-spinning" : ""} />
              {isRefreshing ? "Updating" : "Refresh"}
            </button>
          </div>
        </section>

        <section className="featured-grid" aria-label="Featured signals">
          <FeaturedSignal label="Lottery Signal" item={featured.lottery} tone="lottery" />
          <FeaturedSignal label="Winner Signal" item={featured.winners} tone="number" />
          <FeaturedSignal label="Jackpot Signal" item={featured.jackpots} tone="lottery" />
          <FeaturedSignal label="X-Files Signal" item={featured.xfiles} tone="xfiles" />
          <FeaturedSignal label="Number Energy" item={featured.number} tone="number" />
        </section>

        <section className="news-controls" aria-label="News filters">
          <div className="news-search">
            <Search size={19} aria-hidden="true" />
            <label htmlFor="news-search">Search current stories</label>
            <input id="news-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search titles, sources, summaries, tags..." />
          </div>

          <div className="category-scroller" aria-label="News categories">
            {CATEGORY_FILTERS.map(([label, value]) => (
              <button key={label} type="button" className={category === value ? "is-active" : ""} aria-pressed={category === value} onClick={() => { setCategory(value); setPage(1); }}>
                {label}
              </button>
            ))}
          </div>

          <div className="credibility-filters" aria-label="Source credibility filters">
            {CREDIBILITY_FILTERS.map((filter) => {
              const active = filter.values.every((value) => credibility.has(value));
              return <button key={filter.label} type="button" aria-pressed={active} className={active ? "is-active" : ""} onClick={() => toggleCredibility(filter.values)}>{filter.label}</button>;
            })}
            <button type="button" className={showSaved ? "is-active" : ""} aria-pressed={showSaved} onClick={() => setShowSaved((value) => !value)}>
              <Bookmark size={14} /> Saved stories ({savedIds.size})
            </button>
          </div>
        </section>

        <div className="content-divider" role="separator">
          <span>Verified reporting</span>
          <span>Speculative content is clearly labeled</span>
        </div>

        {error ? <div className="news-alert" role="alert">{error}. Previous stories remain visible when available.</div> : null}
        {isLoading && !data.items.length ? <div className="news-loading" aria-live="polite"><Signal /> Calibrating approved news sources...</div> : null}

        <section className="article-grid" aria-label="Current articles" aria-busy={isRefreshing}>
          {filteredItems.map((item) => <ArticleCard key={item.id} item={item} saved={savedIds.has(item.id)} onSave={toggleSaved} />)}
        </section>

        {!isLoading && !filteredItems.length ? (
          <div className="empty-state"><Signal size={30} /><p>No current stories match these filters. Try another category or refresh the feed.</p></div>
        ) : null}

        {data.totalPages > 1 ? (
          <nav className="pagination" aria-label="News pages">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <span>Page {data.page} of {data.totalPages}</span>
            <button type="button" disabled={page >= data.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
          </nav>
        ) : null}

        <section className="news-notices" aria-label="Important notices">
          <p>Headlines and summaries are provided for discovery. Read the complete story at the original publisher.</p>
          <p>LottoMind News Intelligence is provided for information, entertainment, and educational purposes. Lottery news, winner stories, numerology, horoscopes, UFO/UAP reporting, paranormal content, and unexplained phenomena do not guarantee lottery wins or establish extraordinary claims as fact. Verify lottery information with official lottery organizations and evaluate extraordinary claims using reliable primary sources.</p>
          <p><strong>Play responsibly.</strong> Set spending limits, sign tickets, scan before discarding, and verify all results and prize claims through official lottery sources.</p>
        </section>
      </main>

      <footer className="news-footer"><span>LOTTOMINDED ULTRA</span><span>Source-attributed news discovery</span><span>{new Date().getFullYear()}</span></footer>
    </div>
  );
}
