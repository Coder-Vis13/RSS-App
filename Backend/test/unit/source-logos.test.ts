import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/config/db', () => ({ query: vi.fn() }));
vi.mock('../../src/utils/get-logo', () => ({ getLogo: vi.fn() }));
vi.mock('../../src/services/feed-ingestion/feed-artwork.service', () => ({
  getPodcastArtwork: vi.fn(),
}));

import { query } from '../../src/config/db';
import { getLogo } from '../../src/utils/get-logo';
import { getPodcastArtwork } from '../../src/services/feed-ingestion/feed-artwork.service';
import { allUserSources } from '../../src/models/sources.model';

describe('source logos returned to the sidebar', () => {
  beforeEach(() => {
    vi.mocked(query).mockReset();
    vi.mocked(getLogo).mockReset();
    vi.mocked(getPodcastArtwork).mockReset();
  });

  it('uses podcast artwork for podcasts and keeps favicon logos for RSS sources', async () => {
    vi.mocked(query).mockResolvedValue({
      rows: [
        {
          source_id: 1,
          source_name: 'Example RSS',
          url: 'https://blog.example.test/feed.xml',
          feed_type: 'rss',
        },
        {
          source_id: 2,
          source_name: 'Example Podcast',
          url: 'https://audio.example.test/podcast.xml',
          feed_type: 'podcast',
        },
      ],
    } as never);
    vi.mocked(getLogo).mockReturnValue('https://www.google.com/s2/favicons?domain=example.test');
    vi.mocked(getPodcastArtwork).mockResolvedValue(
      'https://images.example.test/cover.jpg',
    );

    const sources = await allUserSources(12);

    expect(sources.map((source) => source.logo_url)).toEqual([
      'https://www.google.com/s2/favicons?domain=example.test',
      'https://images.example.test/cover.jpg',
    ]);
    expect(getLogo).toHaveBeenCalledTimes(1);
    expect(getPodcastArtwork).toHaveBeenCalledWith(
      'https://audio.example.test/podcast.xml',
    );
  });
});
