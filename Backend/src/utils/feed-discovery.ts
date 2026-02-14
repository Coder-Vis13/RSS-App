import { find } from "feedfinder-ts";
import Parser from "rss-parser";
import pLimit from "p-limit";

const parser = new Parser();

const MAX_TOTAL_TIME = 8000;
const MAX_FEEDS_TO_PARSE = 10;
const CONCURRENCY_LIMIT = 4;

async function isLikelyRSS(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) return false;

    const text = await res.text();

    return (
      text.includes("<rss") ||
      text.includes("<feed") ||
      text.includes("<channel>")
    );
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export async function resolveWorkingRSSFeed(sourceURL: string) {
  const startTime = Date.now();
  const normalizedBase = normalizeUrl(sourceURL);

  // =========================
  // PHASE 1 — feedfinder-ts
  // =========================
  try {
    const feeds = (await find(sourceURL)) as { title: string; link: string }[];

    for (const { link } of feeds) {
      if (!link) continue;

      // Reject false positives where feedfinder returns input URL
      if (normalizeUrl(link) === normalizedBase) continue;

      try {
        const parsed = await parser.parseURL(link);

        if (parsed?.items?.length) {
          return {
            feedUrl: link,
            sourceName: parsed.title || "",
            sourceItems: parsed.items,
          };
        }
      } catch {
        continue;
      }
    }
  } catch {
    // Ignore and move to Phase 2
  }

  // =========================
  // PHASE 2 — Advanced Discovery 
  // =========================

  const rssPatterns = [
    "/rss/",
    "/rss",
    "/rss.html",
    "/rss.cms",
    "/feeds/",
    "/feed/",
    "/rss-feeds/",
    "/rss-feeds/listing",
    "/info/rssfeed",
  ];

  const feedSet = new Set<string>();

  // Step 1 — Index probing
  for (const pattern of rssPatterns) {
    if (Date.now() - startTime > MAX_TOTAL_TIME) break;

    const candidateUrl = `${normalizedBase}${pattern}`;

    try {
      const discovered = await find(candidateUrl);

      for (const feed of (discovered || []) as any[]) {
        if (feed?.link) {
          feedSet.add(feed.link.trim());
        }
      }

      if (feedSet.size) break;
    } catch {
      continue;
    }
  }

  // Step 2 — Root fallback
  if (feedSet.size === 0) {
    try {
      const rootFeeds = await find(normalizedBase);

      for (const feed of (rootFeeds || []) as any[]) {
        if (feed?.link) {
          feedSet.add(feed.link.trim());
        }
      }
    } catch {}
  }

  if (feedSet.size === 0) {
    return null;
  }

  const allFeeds = Array.from(feedSet).slice(0, MAX_FEEDS_TO_PARSE);
  const limit = pLimit(CONCURRENCY_LIMIT);

  const parseTasks = allFeeds.map((feedUrl) =>
    limit(async () => {
      try {
        if (Date.now() - startTime > MAX_TOTAL_TIME) return null;

        if (
          feedUrl.endsWith(".html") ||
          feedUrl.endsWith(".htm")
        ) {
          return null;
        }

        const validXML = await isLikelyRSS(feedUrl);
        if (!validXML) return null;

        const parsed = await parser.parseURL(feedUrl);

        if (!parsed?.items?.length) return null;

        return {
          feedUrl,
          itemCount: parsed.items.length,
          title: parsed.title || "",
          items: parsed.items,
        };
      } catch {
        return null;
      }
    })
  );

  const parsedResults = await Promise.all(parseTasks);

  const validFeeds = parsedResults.filter(
    (r): r is {
      feedUrl: string;
      itemCount: number;
      title: string;
      items: any[];
    } => r !== null
  );

  if (!validFeeds.length) {
    return null;
  }

  // Sort by largest feed
  validFeeds.sort((a, b) => b.itemCount - a.itemCount);

  const best = validFeeds[0];

  return {
    feedUrl: best.feedUrl,
    sourceName: best.title,
    sourceItems: best.items,
  };
}
