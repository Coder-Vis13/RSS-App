import { getFeedImageUrl, parseFeed } from './parse-feed.service';

const ARTWORK_CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedArtwork {
  imageUrl: string | null;
  expiresAt: number;
}

const artworkCache = new Map<string, CachedArtwork>();

export function rememberPodcastArtwork(feedUrl: string, imageUrl?: string | null): void {
  artworkCache.set(feedUrl, {
    imageUrl: imageUrl ?? null,
    expiresAt: Date.now() + ARTWORK_CACHE_TTL_MS,
  });
}

export async function getPodcastArtwork(feedUrl: string): Promise<string | null> {
  const cached = artworkCache.get(feedUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.imageUrl;
  }

  try {
    const imageUrl = getFeedImageUrl(await parseFeed(feedUrl));
    rememberPodcastArtwork(feedUrl, imageUrl);
    return imageUrl;
  } catch {
    return null;
  }
}
