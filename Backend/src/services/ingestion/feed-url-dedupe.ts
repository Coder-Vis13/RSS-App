// prevent duplicate ingestion

export function normalizeFeedUrl(feedUrl: string): string {
  const url = new URL(feedUrl);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

export function createRequestFeedDedupe() {
  const seen = new Map<string, string>();

  return {
    register(feedUrl: string): { canonicalFeedUrl: string; isDuplicate: boolean } {
      const canonicalFeedUrl = normalizeFeedUrl(feedUrl);
      const isDuplicate = seen.has(canonicalFeedUrl);

      if (!isDuplicate) {
        seen.set(canonicalFeedUrl, canonicalFeedUrl);
      }

      return { canonicalFeedUrl, isDuplicate };
    },
  };
}

const inFlightByFeedUrl = new Map<string, Promise<unknown>>();

// prevents multiple simultaneous ingestions
export async function withIngestionDedupe<T>(
  feedUrl: string,
  fn: () => Promise<T>
): Promise<T> {
  const key = normalizeFeedUrl(feedUrl);
  const inFlight = inFlightByFeedUrl.get(key);

  if (inFlight) {
    console.log(`[ingestion] dedupe: coalescing in-flight request for ${key}`);
    return inFlight as Promise<T>;
  }

  const promise = fn().finally(() => inFlightByFeedUrl.delete(key));
  inFlightByFeedUrl.set(key, promise);
  return promise;
}
