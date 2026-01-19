// RSS parsing
import Parser from 'rss-parser';
import sanitizeHtml from 'sanitize-html';
import pkg from 'he';
const { decode } = pkg;

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

export async function RSSParser(sourceURL: string): Promise<ParsedRSS> {
  try {
    const parsedSource = await parser.parseURL(sourceURL);

    // Decode and sanitize source title
    const sourceName = decode(
      sanitizeHtml(parsedSource.title || 'Untitled Source', {
        allowedTags: [],
        allowedAttributes: {},
      })
    );

    const sourceItems: RSSItem[] = (parsedSource.items || [])
      .filter((item) => item && (item.link || item.guid))
      .map((item) => ({
        link: item.link || item.guid!,
        title: decode(
          sanitizeHtml(item.title || 'Untitled', {
            allowedTags: [],
            allowedAttributes: {},
          })
        ),
        description: decode(
          sanitizeHtml(item.content || item.description || item.contentSnippet || '', {
            allowedTags: [],
            allowedAttributes: {},
          })
        ),
        pubDate: item.pubDate ? new Date(item.pubDate) : null,
      }));

    return { sourceName, sourceItems };
  } catch (error: any) {
    console.error('Error parsing RSS feed:', error?.message);
    throw new Error('RSS parsing failed');
  }
}
