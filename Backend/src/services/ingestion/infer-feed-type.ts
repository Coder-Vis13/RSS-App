import { FeedTypeHint } from "./resolve-feed-url";

import { FeedData, FeedEntry } from "@extractus/feed-extractor";

type EntryLike = FeedEntry;

function entryLooksLikePodcast(entry: EntryLike): boolean {
  const raw = entry as unknown as Record<string, unknown>;

  const media = raw.media as
    | { url?: string; type?: string }
    | undefined;

  if (media?.type?.startsWith("audio/")) {
    return true;
  }

  const enclosure = raw.enclosure as
    | { type?: string }
    | undefined;

  if (enclosure?.type?.startsWith("audio/")) {
    return true;
  }

  if (raw.itunes) {
    return true;
  }

  return false;
}

/**
 * Refines rss vs podcast after parsing.
 * URL hints win; otherwise look for audio enclosures / iTunes tags.
 */
export function inferFeedType(
  parsed: FeedData,
  hint: FeedTypeHint
): FeedTypeHint {
  if (hint === "podcast") return "podcast";

  const entries = (parsed.entries ?? []);
  if (!entries.length) return hint;

  const podcastish = entries.filter(entryLooksLikePodcast).length;
  return podcastish / entries.length >= 0.5 ? "podcast" : hint;
}