// normalise items


import { FeedEntry } from "@extractus/feed-extractor";
import { FeedTypeHint } from "./resolve-feed-url";

export interface NormalizedItem {
  link: string;
  title: string;
  description: string | null;
  pubDate: Date;
  tags?: string[];
}

// type RawFeedEntry = FeedEntry & Record<string, unknown>;

type RawFeedEntry = FeedEntry;

function resolveLink(entry: RawFeedEntry): string | null {
  const link = typeof entry.link === "string" ? entry.link.trim() : "";
  const id = typeof entry.id === "string" ? entry.id.trim() : "";
  return link || id || null;
}

function resolveTitle(entry: RawFeedEntry): string {
  const title = typeof entry.title === "string" ? entry.title.trim() : "";
  return title || "Untitled";
}

function resolveDescription(entry: RawFeedEntry): string | null {
  const description =
    typeof entry.description === "string" ? entry.description.trim() : "";
  return description || null;
}

function resolvePubDate(entry: RawFeedEntry): Date {
  const { published } = entry;

  const publishedValue = published as unknown;

if (
  publishedValue instanceof Date &&
  !Number.isNaN(publishedValue.getTime())
) {
  return publishedValue;
}

  if (typeof published === "string" || typeof published === "number") {
    const parsed = new Date(published);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function resolveTags(entry: RawFeedEntry): string[] | undefined {
  const tags = new Set<string>();
  const raw = entry as unknown as Record<string, unknown>;

  const addTag = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      tags.add(value.trim());
    }
  };

  if (Array.isArray(raw.tags)) {
    raw.tags.forEach(addTag);
  }

  addTag(raw.category);

  if (Array.isArray(raw.categories)) {
    for (const category of raw.categories) {
      addTag(category);
    }
  }

  return tags.size
  ? Array.from(tags).slice(0, 3)
  : undefined;
}

function normalizeEntry(entry: RawFeedEntry): NormalizedItem | null {
  const link = resolveLink(entry);
  if (!link) {
    return null;
  }

  const tags = resolveTags(entry);

  return {
    link,
    title: resolveTitle(entry),
    description: resolveDescription(entry),
    pubDate: resolvePubDate(entry),
    ...(tags ? { tags } : {}),
  };
}


export function normalizeItems(
  entries: RawFeedEntry[],
  _feedType: FeedTypeHint
): NormalizedItem[] {
  if (!entries.length) {
    return [];
  }

  return entries
    .map(normalizeEntry)
    .filter((item): item is NormalizedItem => item !== null);
}
