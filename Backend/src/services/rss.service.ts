import Parser from 'rss-parser';

export interface RSSItem {
  link: string;
  title: string;
  description: string | null;
  pubDate: string | Date | null;
}

export interface ParsedRSS {
  sourceName: string;
  sourceItems: RSSItem[];
}

// Reuse parser instance
const parser = new Parser<RSSItem>();

export async function RSSParser(sourceURL: string): Promise<ParsedRSS> {
  const parsedSource = await parser.parseURL(sourceURL);

  const sourceName = parsedSource.title ? parsedSource.title.replace(/<[^>]+>/g, '') : 'Untitled Source';

  // Only keep recent items (last 2 days)
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const sourceItems: RSSItem[] = (parsedSource.items || [])
    .filter((item) => item && (item.link || item.guid))
    .filter((item) => item.pubDate && new Date(item.pubDate) >= twoDaysAgo)
    .map((item) => ({
      link: item.link || item.guid!,
      title: item.title ? item.title.replace(/<[^>]+>/g, '') : 'Untitled',
      description: item.content || item.description || null,
      pubDate: item.pubDate ? new Date(item.pubDate) : null,
    }));

  return { sourceName, sourceItems };
}
