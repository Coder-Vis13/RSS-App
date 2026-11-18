import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/feed-ingestion/parse-feed.service', () => ({
  parseFeed: vi.fn(),
  getFeedImageUrl: (feed: { imageUrl?: string | null }) => feed.imageUrl ?? null,
}));

import { parseFeed } from '../../src/services/feed-ingestion/parse-feed.service';
import { getPodcastArtwork } from '../../src/services/feed-ingestion/feed-artwork.service';

describe('podcast feed artwork', () => {
  beforeEach(() => {
    vi.mocked(parseFeed).mockReset();
  });

  it('returns channel artwork and reuses it from the in-memory cache', async () => {
    const feedUrl = 'https://artwork.example.test/podcast.xml';
    const imageUrl = 'https://images.example.test/podcast-cover.jpg';
    vi.mocked(parseFeed).mockResolvedValue({ imageUrl } as never);

    await expect(getPodcastArtwork(feedUrl)).resolves.toBe(imageUrl);
    await expect(getPodcastArtwork(feedUrl)).resolves.toBe(imageUrl);

    expect(parseFeed).toHaveBeenCalledTimes(1);
  });

  it('returns null when artwork is absent or the feed cannot be parsed', async () => {
    vi.mocked(parseFeed).mockResolvedValueOnce({ imageUrl: null } as never);
    vi.mocked(parseFeed).mockRejectedValueOnce(new Error('Feed unavailable'));

    await expect(
      getPodcastArtwork('https://artwork.example.test/no-image.xml'),
    ).resolves.toBeNull();
    await expect(
      getPodcastArtwork('https://artwork.example.test/unavailable.xml'),
    ).resolves.toBeNull();
  });
});
