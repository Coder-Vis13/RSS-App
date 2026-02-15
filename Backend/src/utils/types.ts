// types.ts
export interface FeedItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  duration?: string | number | null; // mainly for podcasts
}

export interface RSSResult {
  feedUrl: string;
  sourceName: string;
  sourceItems: FeedItem[];
}

export interface PodcastResult {
  feedUrl: string;
  podcastTitle: string;
  episodeItems: FeedItem[];
  totalEpisodes: number;
}

export class FeedResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedResolutionError";
  }
}