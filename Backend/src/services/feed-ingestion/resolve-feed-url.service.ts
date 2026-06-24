// find feed url

import { FeedResolutionError } from '../../utils/types';
import { IngestionUrlType } from './url-classifier.service';
// @ts-ignore
const { discoverFeeds } = require('feedscout');

export type FeedType = 'rss' | 'podcast';

export interface ResolvedFeedUrl {
  feedUrl: string;
  feedType: FeedType;
}

export type FeedScoutResult = {
  url?: string;
  title?: string;
  isValid?: boolean;
};

const FETCH_TIMEOUT_MS = 5_000;

const COMMON_FEED_PATHS = [
  '/feed',
  '/feeds',
  '/feed/rss',
  '/rss',
  '/feed.xml',
  '/feed.rss',
  '/index.xml',
  '/atom.xml',
  '/atom',
  '/rssfeed',
  '/rss.cms',
  '/rss-feeds',
  '/rss/home',
  '/rss/india/rssfeed.xml',
  '/rss/india.xml',
  '/blog/feed',
];

const FEED_CONTENT_TYPES = [
  'application/rss+xml',
  'application/atom+xml',
  'application/xml',
  'text/xml',
  'application/feed+json',
];

// Final fallback for a few popular websites whose feed URLs are not derivable from site paths.
const DOMAIN_FEED_FALLBACKS: Record<string, string> = {
  'timesofindia.indiatimes.com': 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
  'thehindu.com': 'https://www.thehindu.com/feeder/default.rss',
  'ndtv.com': 'https://feeds.feedburner.com/NDTV-LatestNews',
  'indiatoday.in': 'https://www.indiatoday.in/rss/home',
  'hindustantimes.com': 'https://www.hindustantimes.com/rss/india/rssfeed.xml',
  'news18.com': 'https://www.news18.com/rss/india.xml',
  'economictimes.indiatimes.com': 'https://b2b.economictimes.indiatimes.com/rss/topstories',
  'edition.cnn.com': 'http://rss.cnn.com/rss/cnn_topstories.rss',
  'espn.in': 'https://www.espn.com/espn/rss/news',
  'buzzfeed.com': 'https://www.buzzfeed.com/feed.xml',
  'npr.org': 'https://feeds.npr.org/1001/rss.xml',
  'bbc.com': 'https://feeds.bbci.co.uk/news/rss.xml',
  'aljazeera.com': 'https://www.aljazeera.com/xml/rss/all.xml',
};

function parseUserUrl(input: string): URL {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol);
}

function normalizeHostnameForLookup(url: URL): string {
  return url.hostname.toLowerCase().replace(/^www\./, '');
}

function probeBase(url: URL): string {
  return `${url.origin}${url.pathname}`.replace(/\/$/, '') || url.origin;
}

async function fetchWithTimeout(url: string, method: 'GET' | 'HEAD' = 'GET'): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS); // abort after 10 seconds

  try {
    return await fetch(url, {
      method,
      signal: controller.signal,
      headers: { 'User-Agent': 'RSS-App/1.0' },
      redirect: 'follow',
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
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (FEED_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    return true;
  }

  if (!bodyPreview) {
    return false;
  }

  //xml body inspection to check for correct snippets to classify as rss/atom feed or not
  const xmlsnippet = bodyPreview.trim().slice(0, 500).toLowerCase();
  return (
    xmlsnippet.startsWith('<?xml') ||
    xmlsnippet.includes('<rss') ||
    xmlsnippet.includes('<feed') ||
    xmlsnippet.includes('<rdf:rdf')
  );
}

// check if the url is an rss/atom feed url
async function isFeedUrl(candidate: string): Promise<boolean> {
  try {
    const getResponse = await fetchWithTimeout(candidate, 'GET');
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

    return (await isFeedUrl(candidate)) ? candidate : null;
  });

  const results = await Promise.all(checks);

  return results.find(Boolean) ?? null;
}

// if user provides a feed url, return the same
function resolveDirectFeed(userUrl: string): ResolvedFeedUrl {
  return { feedUrl: parseUserUrl(userUrl).toString(), feedType: 'rss' };
}

function resolveRedditFeed(userUrl: string): ResolvedFeedUrl {
  const url = parseUserUrl(userUrl);

  if (url.pathname.toLowerCase().endsWith('.rss')) {
    return { feedUrl: url.toString(), feedType: 'rss' };
  }

  url.pathname = `${url.pathname.replace(/\/$/, '')}.rss`;
  return { feedUrl: url.toString(), feedType: 'rss' };
}

async function resolveYoutubeHandle(url: URL): Promise<ResolvedFeedUrl | null> {
  const response = await fetch(url.toString());

  if (!response.ok) {
    return null;
  }

  const html = await response.text();

  console.log(url.toString());
console.log(html.substring(0, 1000));
console.log(html.includes("channelId"));


  const patterns = [
    /"channelId":"(UC[\w-]+)"/,
    /"externalId":"(UC[\w-]+)"/,
    /"browseId":"(UC[\w-]+)"/,
  ]

  let channelId: string | null = null

  for (const pattern of patterns){
    const match = html.match(pattern)

    if (match?.[1]) {
      channelId = match[1];
      break;
    }
  }

  if (!channelId) {
    return null;
  }


  return {
    feedUrl:
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    feedType: "rss",
};
}

async function resolveYoutubeFeed(userUrl: string): Promise<ResolvedFeedUrl | null> {
  const url = parseUserUrl(userUrl);

  if (url.pathname.includes('/feeds/videos.xml')) {
    return { feedUrl: url.toString(), feedType: 'rss' };
  }

  const channelMatch = url.pathname.match(/\/channel\/(UC[\w-]+)/i);
  if (channelMatch?.[1]) {
    return {
      feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`,
      feedType: 'rss',
    };
  }

  const playlistId = url.searchParams.get('list');
  if (playlistId) {
    return {
      feedUrl: `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`,
      feedType: 'rss',
    };
  }

  const path = url.pathname 
  .replace(/\/videos$/, '')
  .replace(/\/featured$/, '')
  .replace(/\/streams$/, '')
  .replace(/\/shorts$/, '')
  .replace(/\/playlists$/, '')
  .replace(/\/$/, '');

  url.pathname = path

  if (path.startsWith('/@')) {
    return resolveYoutubeHandle(url);
  }
  return null;
}

// run a promise, but fail if it takes too long.
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    ),
  ]);
}

function getFeedScoutResult(results: FeedScoutResult[]): string | null {
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

    return getFeedScoutResult(results as FeedScoutResult[]);
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

  const discovered = await discoverWithFeedScout(userUrl);
  if (discovered) {
    return discovered;
  }

  // Keep this as the last step to preserve the existing discovery priority.
  return DOMAIN_FEED_FALLBACKS[normalizeHostnameForLookup(url)] ?? null;
}

interface AppleLookupResult {
  resultCount: number;
  results: {
    feedUrl?: string;
    collectionName?: string;
  }[];
}

interface AppleSearchResult {
  resultCount: number;
  results: {
    feedUrl?: string;
  }[];
}

/** Apple show URLs end with /id1234567890 — this is the iTunes collection ID. */
function getApplePodcastId(userUrl: string): string | null {
  const match = userUrl.match(/\/id(\d+)(?:\?|$|\/)/i);
  return match?.[1] ?? null;
}

async function resolveViaAppleLookup(appleId: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(`https://itunes.apple.com/lookup?id=${appleId}`, 'GET');

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as AppleLookupResult;
    const feedUrl = data.results?.[0]?.feedUrl;

    return typeof feedUrl === 'string' && feedUrl.trim() ? feedUrl.trim() : null;
  } catch {
    return null;
  }
}

async function resolvePodcastViaItunesSearch(userUrl: string): Promise<string | null> {
  const url = parseUserUrl(userUrl);
  const hostname = url.hostname.replace(/^www\./, '');
  let searchTerm = hostname;

  try {
    const page = await fetchWithTimeout(userUrl, 'GET');
    if (page.ok) {
      const html = await page.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      if (titleMatch?.[1]) {
        searchTerm = titleMatch[1].replace(/Podcast/i, '').trim() || searchTerm;
      }
    }
  } catch {
    // ignore — fall back to hostname
  }

  try {
    const response = await fetchWithTimeout(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        searchTerm
      )}&media=podcast&limit=1`,
      'GET'
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as AppleSearchResult;
    const feedUrl = data.results?.[0]?.feedUrl;

    return typeof feedUrl === 'string' && feedUrl.trim() ? feedUrl.trim() : null;
  } catch {
    return null;
  }
}

async function resolvePodcastPageFeed(userUrl: string): Promise<string | null> {
  const url = parseUserUrl(userUrl);
  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  // Spotify has no public RSS — cannot be subscribed like a normal podcast feed.
  if (host === 'open.spotify.com') {
    throw new FeedResolutionError(
      "Spotify podcast links cannot be subscribed directly. Spotify does not provide a public RSS feed. Try the same show on Apple Podcasts, or paste the podcast's RSS feed URL."
    );
  }

  if (host === 'podcasts.apple.com') {
    const appleId = getApplePodcastId(userUrl);
    if (appleId) {
      const fromLookup = await resolveViaAppleLookup(appleId);
      if (fromLookup) {
        return fromLookup;
      }
    }
  }

  const fromDiscovery = await resolveWebsiteFeed(userUrl);
  if (fromDiscovery) {
    return fromDiscovery;
  }

  return resolvePodcastViaItunesSearch(userUrl);
}

export async function resolveFeedUrl(
  userUrl: string,
  classification: IngestionUrlType
): Promise<ResolvedFeedUrl | null> {
  switch (classification) {
    case 'direct-feed':
      return resolveDirectFeed(userUrl);

    case 'reddit':
      return resolveRedditFeed(userUrl);

    case 'youtube': {
      const resolved = await resolveYoutubeFeed(userUrl);
      if (!resolved) {
        throw new FeedResolutionError(
          'Could not derive a YouTube feed URL from this link. Try a /channel/UC… URL.'
        );
      }
      return resolved;
    }

    case 'website': {
      const feedUrl = await resolveWebsiteFeed(userUrl);
      if (!feedUrl) {
        throw new FeedResolutionError(`No feed found for ${userUrl}`);
      }
      return { feedUrl, feedType: 'rss' };
    }

    case 'podcast-page': {
      const feedUrl = await resolvePodcastPageFeed(userUrl);
      if (!feedUrl) {
        throw new FeedResolutionError(
          `No podcast feed found for ${userUrl}. Try the show's direct RSS feed URL or an Apple Podcasts show link.`
        );
      }
      return { feedUrl, feedType: 'podcast' };
    }

    default:
      throw new FeedResolutionError(`Unsupported URL classification: ${classification}`);
  }
}
