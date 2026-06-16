// find out if url is youtube, reddit, podcast or website
// * Priority: reddit → youtube → direct-feed → podcast-page → website

export type IngestionUrlType =
  | 'direct-feed' // user provides rss feed url
  | 'website' // user provides website url
  | 'podcast-page' // user provides podcast page url
  | 'reddit' // user provides reddit/subreddit url
  | 'youtube'; // user provides any youtube video or playlist url

const YOUTUBE_HOSTS = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com']);

const PODCAST_HOSTS = new Set([
  'podcasts.apple.com',
  'open.spotify.com',
  'anchor.fm',
  'buzzsprout.com',
  'podbean.com',
  'simplecast.com',
  'transistor.fm',
  'megaphone.fm',
  'spreaker.com',
  'libsyn.com',
]);

const DIRECT_FEED_EXTENSIONS = ['.rss', '.xml', '.atom', '.feed'];

const DIRECT_FEED_PATH_PATTERNS = [
  /\/feed\/?$/i,
  /\/feeds\/?$/i,
  /\/rss\/?$/i,
  /\/atom\/?$/i,
  /\/rss\.xml\/?$/i,
  /\/atom\.xml\/?$/i,
  /\/feed\.xml\/?$/i,
  /\/feed\.rss\/?$/i,
  /\/index\.xml\/?$/i,
  /\/feeds\/videos\.xml$/i,

  // Additional common RSS paths
  /\/rssfeed\/?$/i,
  /\/rss\.cms\/?$/i,
  /\/rss-feeds\/?$/i,
  /\/rss\/home\/?$/i,
  /\/rss\/india\/rssfeed\.xml\/?$/i,
  /\/rss\/india\.xml\/?$/i,
  /\/blog\/feed\/?$/i,
];

function normalizeInput(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('URL is required');
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  return new URL(withProtocol);
}

function baseHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/^www\./, '');
}

function isRedditUrl(url: URL): boolean {
  const host = baseHost(url);
  return host === 'reddit.com' || host.endsWith('.reddit.com');
}

function isYoutubeUrl(url: URL): boolean {
  return YOUTUBE_HOSTS.has(baseHost(url));
}

function isDirectFeedUrl(url: URL): boolean {
  const pathname = url.pathname.toLowerCase();

  if (DIRECT_FEED_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true;
  }

  if (DIRECT_FEED_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return true;
  }

  const format = url.searchParams.get('format')?.toLowerCase();
  return format === 'rss' || format === 'atom';
}

function isPodcastPageUrl(url: URL): boolean {
  const host = baseHost(url);

  if (PODCAST_HOSTS.has(host)) {
    return true;
  }

  if (host.includes('podcast')) {
    return true;
  }

  return url.pathname.toLowerCase().includes('/podcast');
}

export function classifySourceUrl(input: string): IngestionUrlType {
  const url = normalizeInput(input);

  if (isRedditUrl(url)) return 'reddit';
  if (isYoutubeUrl(url)) return 'youtube';
  if (isDirectFeedUrl(url)) return 'direct-feed';
  if (isPodcastPageUrl(url)) return 'podcast-page';

  return 'website';
}
