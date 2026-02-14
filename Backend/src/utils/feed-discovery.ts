import { find } from "feedfinder-ts";
import { RSSParser } from "../services/rss.service";

export async function resolveWorkingRSSFeed(sourceURL: string) {
  const feeds = (await find(sourceURL)) as { title: string; link: string }[];

  for (const { link } of feeds) {
    try {
      const { sourceName, sourceItems } = await RSSParser(link);

      if (sourceItems?.length) {
        return {
          feedUrl: link,
          sourceName,
          sourceItems,
        };
      }
    } catch {
        // RSSParser can fail for invalid feeds
        // ignore and try next feed
    }
  }

  return null;
}