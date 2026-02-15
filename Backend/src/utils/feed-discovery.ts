

import { find } from "feedfinder-ts";
import Parser from "rss-parser";
import pLimit from "p-limit";
import { FeedItem, RSSResult } from "./types";


const parser = new Parser<FeedItem>();

const MAX_TOTAL_TIME = 8000;
const MAX_FEEDS_TO_PARSE = 8;
const CONCURRENCY_LIMIT = 8;

// async function isLikelyRSS(url: string): Promise<boolean> {
//   try {
//     const controller = new AbortController();
//     const timeout = setTimeout(() => controller.abort(), 3000);

//     const res = await fetch(url, {
//       signal: controller.signal,
//       redirect: "follow",
//     });

//     clearTimeout(timeout);

//     if (!res.ok) return false;

//     const text = await res.text();

//     return (
//       text.includes("<rss") ||
//       text.includes("<feed") ||
//       text.includes("<channel>")
//     );
//   } catch {
//     return false;
//   }
// }

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export async function resolveWorkingRSSFeed(sourceURL: string): Promise<RSSResult | null>  {
  const startTime = Date.now();
  const normalizedBase = normalizeUrl(sourceURL);
  // -------------------------
  // PHASE 1 — feedfinder-ts
  // -------------------------
  try {
    const feeds = (await find(sourceURL)) as { title: string; link: string }[];

    if (feeds?.length) {
      // optional: limit feeds parsed for speed
      const feedsToTry = feeds.slice(0, MAX_FEEDS_TO_PARSE);

      for (const { link } of feedsToTry) {
        if (!link) continue;

        // Reject false positives: feed URL same as base website
        if (normalizeUrl(link) === normalizedBase) continue;

        try {
          const parsed = await parser.parseURL(link);

          if (parsed?.items?.length) {
            // immediately return first valid feed
            return {
              feedUrl: link,
              sourceName: parsed.title || "",
              sourceItems: parsed.items.map(item => ({
                title: item.title || "Untitled",
                link: item.link || "",
                pubDate: item.pubDate,
                description: item.contentSnippet || item.content,
              })),
            };
          }
        } catch {
          // parsing failed, try next feed
          continue;
        }
      }
    }
  } catch {
    // feedfinder-ts failed, move to Phase 2
  }

  // PHASE 2 — Advanced Discovery 

  const rssPatterns = [
    "/rss/",
    "/rss",
    "/feed/",
    "/feeds/",
    "/rss.html",
    "/rss.cms",
    "",
    "",
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
    //RSS Index not found, fallback to check for podcast
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

  const parsedResults = await Promise.allSettled(parseTasks);

const validFeeds = parsedResults
  .filter(
    (r): r is PromiseFulfilledResult<{ 
      feedUrl: string; 
      itemCount: number; 
      title: string; 
      items: any[]; 
    }> => r.status === "fulfilled" && r.value !== null
  )
  .map(r => r.value);

  
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























// import { find } from "feedfinder-ts";
// import Parser from "rss-parser";
// import pLimit from "p-limit";
// import { FeedItem, RSSResult } from "./types";


// const parser = new Parser<FeedItem>();

// const MAX_TOTAL_TIME = 8000;
// const MAX_FEEDS_TO_PARSE = 8;
// const CONCURRENCY_LIMIT = 8;

// // async function isLikelyRSS(url: string): Promise<boolean> {
// //   try {
// //     const controller = new AbortController();
// //     const timeout = setTimeout(() => controller.abort(), 3000);

// //     const res = await fetch(url, {
// //       signal: controller.signal,
// //       redirect: "follow",
// //     });

// //     clearTimeout(timeout);

// //     if (!res.ok) return false;

// //     const text = await res.text();

// //     return (
// //       text.includes("<rss") ||
// //       text.includes("<feed") ||
// //       text.includes("<channel>")
// //     );
// //   } catch {
// //     return false;
// //   }
// // }

// function normalizeUrl(url: string): string {
//   return url.endsWith("/") ? url.slice(0, -1) : url;
// }

// export async function resolveWorkingRSSFeed(sourceURL: string): Promise<RSSResult | null>  {
//   const startTime = Date.now();
//   const normalizedBase = normalizeUrl(sourceURL);

//   // PHASE 1 — feedfinder-ts
//   try {
//   const feeds = (await find(sourceURL)) as { title: string; link: string }[];

//   for (const { link } of feeds) {
//     if (!link) continue;

//     // Reject false positives
//     if (normalizeUrl(link) === normalizedBase) continue;

//     try {

//       const parseTasks = feeds.map(({ link }) =>
//   limit(async () => {
//     if (!link || normalizeUrl(link) === normalizedBase) return null;
//     try {
//       const parsed = await parser.parseURL(link);
//       if (!parsed?.items?.length) return null;
//       return { link, parsed };
//     } catch {
//       return null;
//     }
//   })
// );

// const parsedFeeds = (await Promise.all(parseTasks)).filter(Boolean);

//       // const parsed = await parser.parseURL(link);

//       // if (parsed?.items?.length) {
//       //   return {
//       //     feedUrl: link,
//       //     sourceName: parsed.title || "",
//       //     sourceItems: parsed.items.map(item => ({
//       //       title: item.title || "Untitled",
//       //       link: item.link || "",
//       //       pubDate: item.pubDate,
//       //       description: item.contentSnippet || item.content,
//       //     })),
//       //   };
//       // }
//     } catch {
//       // Parsing failed, continue with next feed
//       continue;
//     }
//   }
// } catch {
//   // feedfinder failed, move to Phase 2
// }


//   // PHASE 2 — Advanced Discovery 

//   const rssPatterns = [
//     "/rss/",
//     "/rss",
//     "/feed/",
//     "/feeds/",
//     "/rss.html",
//     "/rss.cms",
//     "",
//     "",
//     "/rss-feeds/",
//     "/rss-feeds/listing",
//     "/info/rssfeed",
//   ];

//   const feedSet = new Set<string>();

//   // Step 1 — Index probing
//   for (const pattern of rssPatterns) {
//     if (Date.now() - startTime > MAX_TOTAL_TIME) break;

//     const candidateUrl = `${normalizedBase}${pattern}`;

//     try {
//       const discovered = await find(candidateUrl);

//       for (const feed of (discovered || []) as any[]) {
//         if (feed?.link) {
//           feedSet.add(feed.link.trim());
//         }
//       }

//       if (feedSet.size) break;
//     } catch {
//       continue;
//     }
//   }

//   // Step 2 — Root fallback
//   if (feedSet.size === 0) {
//     //RSS Index not found, fallback to check for podcast
//     return null;
//   }


//   const allFeeds = Array.from(feedSet).slice(0, MAX_FEEDS_TO_PARSE);
//   const limit = pLimit(CONCURRENCY_LIMIT);

//   const parseTasks = allFeeds.map((feedUrl) =>
//     limit(async () => {
//       try {
//         if (Date.now() - startTime > MAX_TOTAL_TIME) return null;

//         if (
//           feedUrl.endsWith(".html") ||
//           feedUrl.endsWith(".htm")
//         ) {
//           return null;
//         }


//         const parsed = await parser.parseURL(feedUrl);

//         if (!parsed?.items?.length) return null;

//         return {
//           feedUrl,
//           itemCount: parsed.items.length,
//           title: parsed.title || "",
//           items: parsed.items,
//         };
//       } catch {
//         return null;
//       }
//     })
//   );

//   const parsedResults = await Promise.allSettled(parseTasks);

// const validFeeds = parsedResults
//   .filter(
//     (r): r is PromiseFulfilledResult<{ 
//       feedUrl: string; 
//       itemCount: number; 
//       title: string; 
//       items: any[]; 
//     }> => r.status === "fulfilled" && r.value !== null
//   )
//   .map(r => r.value);

  
//   if (!validFeeds.length) {
//     return null;
//   }

//   // Sort by largest feed
//   validFeeds.sort((a, b) => b.itemCount - a.itemCount);

//   const best = validFeeds[0];

//   return {
//     feedUrl: best.feedUrl,
//     sourceName: best.title,
//     sourceItems: best.items,
//   };
// }
