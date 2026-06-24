export const INITIAL_RSS_IMPORT_LIMIT = 30;
export const INITIAL_PODCAST_IMPORT_LIMIT = 80;

export type FeedType = 'rss' | 'podcast';

export function getInitialImportLimit(feedType: FeedType): number {
  return feedType === 'podcast' ? INITIAL_PODCAST_IMPORT_LIMIT : INITIAL_RSS_IMPORT_LIMIT;
}

export function takeLatestByPubDate<T extends { pubDate: Date }>(items: T[], limit: number): T[] {
  return [...items].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime()).slice(0, limit);
}
