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

const parser = new Parser<RSSItem>();

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function cleanRSSDescription(html: string): string {
  return (
    html
      // Replace block-level tags with newlines
      .replace(/<\/(p|div|li|ul|ol|br|h\d)>/gi, '\n')
      .replace(/<(p|div|li|ul|ol|br|h\d)[^>]*>/gi, '')

      // Remove links but keep text
      .replace(/<a[^>]*>/gi, '')
      .replace(/<\/a>/gi, '')

      // Remove strong/emphasis tags
      .replace(/<\/?(strong|em|b|i)[^>]*>/gi, '')

      // Remove “Continue reading”
      .replace(/Continue reading\.*/i, '')

      // Collapse whitespace
      .replace(/\n{2,}/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n/g, ' ')

      .trim()
  );
}

function truncate(text: string, max = 320) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}
export async function RSSParser(sourceURL: string): Promise<ParsedRSS> {
  const parsedSource = await parser.parseURL(sourceURL);

  const sourceName = parsedSource.title
    ? parsedSource.title.replace(/<[^>]+>/g, '')
    : 'Untitled Source';

  const sourceItems: RSSItem[] = (parsedSource.items || [])
    .filter((item) => item && (item.link || item.guid))
    .map((item) => ({
      link: item.link || item.guid!,
      title: item.title ? stripHtml(item.title) : 'Untitled',
      description:
        item.content || item.description
          ? truncate(cleanRSSDescription(item.content || item.description!))
          : null,
      pubDate: item.pubDate ? new Date(item.pubDate) : null,
    }));

  return { sourceName, sourceItems };
}
