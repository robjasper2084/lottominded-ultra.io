import sanitizeHtml from "sanitize-html";

const SUMMARY_LIMIT = 240;

export function cleanText(value: unknown, maxLength = SUMMARY_LIMIT): string {
  const plain = sanitizeHtml(String(value ?? ""), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function safeHttpsUrl(value: unknown, baseUrl?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(String(value), baseUrl);
    if (url.protocol !== "https:") return undefined;
    url.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((key) =>
      url.searchParams.delete(key),
    );
    return url.toString();
  } catch {
    return undefined;
  }
}

export function canonicalizeUrl(value: unknown, baseUrl?: string): string | undefined {
  const safe = safeHttpsUrl(value, baseUrl);
  if (!safe) return undefined;
  const url = new URL(safe);
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  url.searchParams.sort();
  return url.toString();
}

export function validDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  const now = Date.now();
  if (date.getTime() > now + 24 * 60 * 60 * 1000) return undefined;
  return date;
}
