

//rss parsing 
import Parser from 'rss-parser';

import sanitizeHtml from 'sanitize-html';
// import { decode } from 'he';
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
    const sourceName = parsedSource.title || "Untitled Source";

    const sourceItems: RSSItem[] = (parsedSource.items || [])
      .filter(item => item && (item.link || item.guid))
      .map(item => ({
        link: item.link || item.guid!,
        title: decode(sanitizeHtml(item.title || "Untitled", { allowedTags: [], allowedAttributes: {} })),
        description: decode(
          sanitizeHtml(item.content || item.description || item.contentSnippet || "", {
            allowedTags: [], allowedAttributes: {},
          })
        ),
        pubDate: item.pubDate ? new Date(item.pubDate) : null,
      }));

    return { sourceName, sourceItems };
  } catch (error: any) {
    console.error("Error parsing RSS feed:", error?.message);
    throw new Error("RSS parsing failed");
  }
};

