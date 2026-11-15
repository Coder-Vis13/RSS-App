import { afterEach, describe, expect, it, vi } from 'vitest';
import { YOUTUBE_RSS_BASE_URL } from '../../src/config/youtube-rss';
import { resolveFeedUrl } from '../../src/services/feed-ingestion/resolve-feed-url.service';

const CHANNEL_ID = 'UC1234567890123456789012';
const PLAYLIST_ID = 'PL12345678901234567890';

function expectedRequestUrl(parameter: 'channel_id' | 'playlist_id', value: string): string {
  const url = new URL('/feeds/videos.xml', YOUTUBE_RSS_BASE_URL);
  url.searchParams.set(parameter, value);
  return url.toString();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('YouTube feed resolution', () => {
  it('keeps a stable channel feed identity and builds a local request URL', async () => {
    const resolved = await resolveFeedUrl(
      `https://www.youtube.com/channel/${CHANNEL_ID}`,
      'youtube'
    );

    expect(resolved).toEqual({
      feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      requestUrl: expectedRequestUrl('channel_id', CHANNEL_ID),
      feedType: 'rss',
    });
  });

  it('maps playlist URLs to the local service playlist endpoint', async () => {
    const resolved = await resolveFeedUrl(
      `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`,
      'youtube'
    );

    expect(resolved).toEqual({
      feedUrl: `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`,
      requestUrl: expectedRequestUrl('playlist_id', PLAYLIST_ID),
      feedType: 'rss',
    });
  });

  it('resolves a channel handle to its channel ID before building the local URL', async () => {
    const html = `<link rel="alternate" type="application/rss+xml" href="https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}">`;
    const fetchMock = vi.fn().mockResolvedValue(new Response(html, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const resolved = await resolveFeedUrl('https://www.youtube.com/@example', 'youtube');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(resolved).toEqual({
      feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      requestUrl: expectedRequestUrl('channel_id', CHANNEL_ID),
      feedType: 'rss',
    });
  });

  it('redirects existing direct YouTube feed URLs to the local service', async () => {
    const resolved = await resolveFeedUrl(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      'youtube'
    );

    expect(resolved?.requestUrl).toBe(expectedRequestUrl('channel_id', CHANNEL_ID));
    expect(resolved?.feedUrl).toBe(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`
    );
  });

  it('leaves a normal direct RSS feed unchanged', async () => {
    const feedUrl = 'https://github.blog/feed/';
    const resolved = await resolveFeedUrl(feedUrl, 'direct-feed');

    expect(resolved).toEqual({ feedUrl, feedType: 'rss' });
  });
});
