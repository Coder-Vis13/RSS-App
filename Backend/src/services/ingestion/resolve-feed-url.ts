// find feed url 


import { FeedResolutionError } from "../../utils/types";
import { IngestionUrlType } from "./url-classifier";
// @ts-ignore
const { discoverFeeds } = require("feedscout");

export type FeedTypeHint = "rss" | "podcast";

export interface ResolvedFeedUrl {
  feedUrl: string;
  feedType: FeedTypeHint;
}

export type FeedScoutResult = {
  url?: string;
  title?: string;
  isValid?: boolean;
};

const FETCH_TIMEOUT_MS = 5_000;

const COMMON_FEED_PATHS = [
  "/feed",
  "/feeds",
  "/rss",
  "/feed.xml",
  "/feed.rss",
  "/index.xml",
  "/atom.xml",
  "/atom",
  "/rssfeed",
  "/rss.cms",
  "/rss-feeds",
  "/rss/home",
  "/rss/india/rssfeed.xml",
  "/rss/india.xml",
  "/blog/feed",
];

const FEED_CONTENT_TYPES = [
  "application/rss+xml",
  "application/atom+xml",
  "application/xml",
  "text/xml",
  "application/feed+json",
];

function parseUserUrl(input: string): URL {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return new URL(withProtocol);
}

function probeBase(url: URL): string {
  return `${url.origin}${url.pathname}`.replace(/\/$/, "") || url.origin;
}

async function fetchWithTimeout(url: string, method: "GET" | "HEAD" = "GET"): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS); // abort after 10 seconds

  try {
    return await fetch(url, {
      method,
      signal: controller.signal,
      headers: { "User-Agent": "RSS-App/1.0" },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timeout);
  }
}

// checks if the http response looks like an rss feed
function checkFeedResponse(response: Response, bodyPreview?: string): boolean {
  if (!response.ok) {
    return false;
  }

  //checks content-type header to classify as rss/atom feed or not
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (FEED_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    return true;
  }

  if (!bodyPreview) {
    return false;
  }

  //xml body inspection to check for correct snippets to classify as rss/atom feed or not
  const snippet = bodyPreview.trim().slice(0, 500).toLowerCase();
  return (
    snippet.startsWith("<?xml") ||
    snippet.includes("<rss") ||
    snippet.includes("<feed") ||
    snippet.includes("<rdf:rdf")
  );
}

// check if the url is an rss/atom feed url
async function isFeedUrl(candidate: string): Promise<boolean> {
  try {
    const getResponse = await fetchWithTimeout(candidate, "GET");
    const body = await getResponse.text();

    return checkFeedResponse(getResponse, body);
  } catch {
    return false;
  }
}

// checks all common feed paths to find a correct rss/atom feed url
async function checkCommonFeedPaths(baseUrl: string): Promise<string | null> {
  const checks = COMMON_FEED_PATHS.map(async (path) => {
    const candidate = `${baseUrl}${path}`;

    return (await isFeedUrl(candidate))
      ? candidate
      : null;
  });

  const results = await Promise.all(checks);

  return results.find(Boolean) ?? null;
}

// if user provides a feed url, return the same
function resolveDirectFeed(userUrl: string): ResolvedFeedUrl {
  return { feedUrl: parseUserUrl(userUrl).toString(), feedType: "rss" };
}

function resolveRedditFeed(userUrl: string): ResolvedFeedUrl {
  const url = parseUserUrl(userUrl);

  if (url.pathname.toLowerCase().endsWith(".rss")) {
    return { feedUrl: url.toString(), feedType: "rss" };
  }

  url.pathname = `${url.pathname.replace(/\/$/, "")}.rss`;
  return { feedUrl: url.toString(), feedType: "rss" };
}


async function resolveYoutubeHandle(
  url: URL
): Promise<ResolvedFeedUrl | null> {
  const response = await fetch(url.toString());

  if (!response.ok) {
    return null;
  }

  const html = await response.text();

  const match = html.match(/"channelId":"(UC[\w-]+)"/);

  if (!match?.[1]) {
    return null;
  }

  return {
    feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${match[1]}`,
    feedType: "rss",
  };
}

async function resolveYoutubeFeed(
  userUrl: string
): Promise<ResolvedFeedUrl | null> {
  const url = parseUserUrl(userUrl);

  if (url.pathname.includes("/feeds/videos.xml")) {
    return { feedUrl: url.toString(), feedType: "rss" };
  }

  const channelMatch = url.pathname.match(/\/channel\/(UC[\w-]+)/i);
  if (channelMatch?.[1]) {
    return {
      feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`,
      feedType: "rss",
    };
  }

  const playlistId = url.searchParams.get("list");
  if (playlistId) {
    return {
      feedUrl: `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`,
      feedType: "rss",
    };
  }
  if (url.pathname.startsWith("/@")) {
  return resolveYoutubeHandle(url);
}
  return null;
}

// run a promise, but fail if it takes too long.
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), ms)
    ),
  ]);
}

function pickFeedScoutResult(
  results: FeedScoutResult[]
): string | null {
  const valid = results.filter((r) => r.isValid);

  if (valid.length) {
    return valid.find((r) => r.title)?.url ?? valid[0].url ?? null;
  }

  return results[0]?.url ?? null;
}

// use npm package feedscout to find rss feed url from given url
async function discoverWithFeedScout(userUrl: string): Promise<string | null> {
  try {
    // @ts-ignore
    const results = await withTimeout(discoverFeeds(userUrl), FETCH_TIMEOUT_MS);
    if (!Array.isArray(results)) {
  return null;
}

return pickFeedScoutResult(results as FeedScoutResult[]);
  } catch {
    return null;
  }
}

async function resolveWebsiteFeed(userUrl: string): Promise<string | null> {
  const url = parseUserUrl(userUrl);
  const probed = await checkCommonFeedPaths(probeBase(url));
  if (probed) {
    return probed;
  }

  return discoverWithFeedScout(userUrl);
}



export async function resolveFeedUrl(
  userUrl: string,
  classification: IngestionUrlType
): Promise<ResolvedFeedUrl | null> {
  switch (classification) {
    case "direct-feed":
      return resolveDirectFeed(userUrl);

    case "reddit":
      return resolveRedditFeed(userUrl);

    case "youtube": {
      const resolved = await resolveYoutubeFeed(userUrl);
      if (!resolved) {
        throw new FeedResolutionError(
          "Could not derive a YouTube feed URL from this link. Try a /channel/UC… URL."
        );
      }
      return resolved;
    }

    case "website": {
      const feedUrl = await resolveWebsiteFeed(userUrl);
      if (!feedUrl) {
        throw new FeedResolutionError(`No feed found for ${userUrl}`);
      }
      return { feedUrl, feedType: "rss" };
    }

    case "podcast-page":
      return null;

    default:
      throw new FeedResolutionError(`Unsupported URL classification: ${classification}`);
  }
}














// // find feed url 


// import { FeedResolutionError } from "../../utils/types";
// import { IngestionUrlType } from "./url-classifier";
// // @ts-ignore
// const { discoverFeeds } = require("feedscout");

// export type FeedTypeHint = "rss" | "podcast";

// export interface ResolvedFeedUrl {
//   feedUrl: string;
//   feedType: FeedTypeHint;
// }

// export type FeedScoutResult = {
//   url?: string;
//   title?: string;
//   isValid?: boolean;
// };

// const FETCH_TIMEOUT_MS = 10_000;

// const COMMON_FEED_PATHS = [
//   "/feed",
//   "/feeds",
//   "/rss",
//   "/feed.xml",
//   "/feed.rss",
//   "/index.xml",
//   "/atom.xml",
//   "/atom",
//   "/rssfeed",
//   "/rss.cms",
//   "/rss-feeds",
//   "/rss/home",
//   "/rss/india/rssfeed.xml",
//   "/rss/india.xml",
//   "/blog/feed",
// ];

// const FEED_CONTENT_TYPES = [
//   "application/rss+xml",
//   "application/atom+xml",
//   "application/xml",
//   "text/xml",
//   "application/feed+json",
// ];

// function parseUserUrl(input: string): URL {
//   const trimmed = input.trim();
//   const withProtocol = /^https?:\/\//i.test(trimmed)
//     ? trimmed
//     : `https://${trimmed}`;
//   return new URL(withProtocol);
// }

// function probeBase(url: URL): string {
//   return `${url.origin}${url.pathname}`.replace(/\/$/, "") || url.origin;
// }

// async function fetchWithTimeout(url: string, method: "GET" | "HEAD" = "GET"): Promise<Response> {
//   const controller = new AbortController();
//   const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS); // abort after 10 seconds

//   try {
//     return await fetch(url, {
//       method,
//       signal: controller.signal,
//       headers: { "User-Agent": "RSS-App/1.0" },
//       redirect: "follow",
//     });
//   } finally {
//     clearTimeout(timeout);
//   }
// }

// // checks if the http response looks like an rss feed
// function checkFeedResponse(response: Response, bodyPreview?: string): boolean {
//   if (!response.ok) {
//     return false;
//   }

//   //checks content-type header to classify as rss/atom feed or not
//   const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
//   if (FEED_CONTENT_TYPES.some((type) => contentType.includes(type))) {
//     return true;
//   }

//   if (!bodyPreview) {
//     return false;
//   }

//   //xml body inspection to check for correct snippets to classify as rss/atom feed or not
//   const snippet = bodyPreview.trim().slice(0, 500).toLowerCase();
//   return (
//     snippet.startsWith("<?xml") ||
//     snippet.includes("<rss") ||
//     snippet.includes("<feed") ||
//     snippet.includes("<rdf:rdf")
//   );
// }

// // check if the url is an rss/atom feed url
// async function isFeedUrl(candidate: string): Promise<boolean> {
//   try {
//     const headResponse = await fetchWithTimeout(candidate, "HEAD");
//     if (checkFeedResponse(headResponse)) {
//       return true;
//     }

//     const getResponse = await fetchWithTimeout(candidate, "GET");
//     const body = await getResponse.text();
//     return checkFeedResponse(getResponse, body);
//   } catch {
//     return false;
//   }
// }

// // checks all common feed paths to find a correct rss/atom feed url
// async function checkCommonFeedPaths(baseUrl: string): Promise<string | null> {
//   for (const path of COMMON_FEED_PATHS) {
//     const candidate = `${baseUrl}${path}`;
//     if (await isFeedUrl(candidate)) {
//       return candidate;
//     }
//   }
//   return null;
// }

// // if user provides a feed url, return the same
// function resolveDirectFeed(userUrl: string): ResolvedFeedUrl {
//   return { feedUrl: parseUserUrl(userUrl).toString(), feedType: "rss" };
// }

// function resolveRedditFeed(userUrl: string): ResolvedFeedUrl {
//   const url = parseUserUrl(userUrl);

//   if (url.pathname.toLowerCase().endsWith(".rss")) {
//     return { feedUrl: url.toString(), feedType: "rss" };
//   }

//   url.pathname = `${url.pathname.replace(/\/$/, "")}.rss`;
//   return { feedUrl: url.toString(), feedType: "rss" };
// }

// function resolveYoutubeFeed(userUrl: string): ResolvedFeedUrl | null {
//   const url = parseUserUrl(userUrl);

//   if (url.pathname.includes("/feeds/videos.xml")) {
//     return { feedUrl: url.toString(), feedType: "rss" };
//   }

//   const channelMatch = url.pathname.match(/\/channel\/(UC[\w-]+)/i);
//   if (channelMatch?.[1]) {
//     return {
//       feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`,
//       feedType: "rss",
//     };
//   }

//   const playlistId = url.searchParams.get("list");
//   if (playlistId) {
//     return {
//       feedUrl: `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`,
//       feedType: "rss",
//     };
//   }

//   return null;
// }

// // run a promise, but fail if it takes too long.
// async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
//   return Promise.race([
//     promise,
//     new Promise<never>((_, reject) =>
//       setTimeout(() => reject(new Error("Operation timed out")), ms)
//     ),
//   ]);
// }

// function pickFeedScoutResult(
//   results: FeedScoutResult[]
// ): string | null {
//   const valid = results.filter((r) => r.isValid);

//   if (valid.length) {
//     return valid.find((r) => r.title)?.url ?? valid[0].url ?? null;
//   }

//   return results[0]?.url ?? null;
// }

// // use npm package feedscout to find rss feed url from given url
// async function discoverWithFeedScout(userUrl: string): Promise<string | null> {
//   try {
//     // @ts-ignore
//     const results = await withTimeout(discoverFeeds(userUrl), FETCH_TIMEOUT_MS);
//     if (!Array.isArray(results)) {
//   return null;
// }

// return pickFeedScoutResult(results as FeedScoutResult[]);
//   } catch {
//     return null;
//   }
// }

// async function resolveWebsiteFeed(userUrl: string): Promise<string | null> {
//   const url = parseUserUrl(userUrl);
//   const probed = await checkCommonFeedPaths(probeBase(url));
//   if (probed) {
//     return probed;
//   }

//   return discoverWithFeedScout(userUrl);
// }



// export async function resolveFeedUrl(
//   userUrl: string,
//   classification: IngestionUrlType
// ): Promise<ResolvedFeedUrl | null> {
//   switch (classification) {
//     case "direct-feed":
//       return resolveDirectFeed(userUrl);

//     case "reddit":
//       return resolveRedditFeed(userUrl);

//     case "youtube": {
//       const resolved = resolveYoutubeFeed(userUrl);
//       if (!resolved) {
//         throw new FeedResolutionError(
//           "Could not derive a YouTube feed URL from this link. Try a /channel/UC… URL."
//         );
//       }
//       return resolved;
//     }

//     case "website": {
//       const feedUrl = await resolveWebsiteFeed(userUrl);
//       if (!feedUrl) {
//         throw new FeedResolutionError(`No feed found for ${userUrl}`);
//       }
//       return { feedUrl, feedType: "rss" };
//     }

//     case "podcast-page":
//       return null;

//     default:
//       throw new FeedResolutionError(`Unsupported URL classification: ${classification}`);
//   }
// }
