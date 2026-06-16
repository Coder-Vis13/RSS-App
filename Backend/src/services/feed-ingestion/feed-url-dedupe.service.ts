// prevent duplicate ingestion

export function normalizeFeedUrl(feedUrl: string): string {
  const url = new URL(feedUrl);
  url.hash = '';
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }
  return url.toString();
}

export function createDuplicateChecker() {
  const processedUrls = new Map<string, string>();

  return {
    markAsSeen(feedUrl: string): { safeUrl: string; isDuplicate: boolean } {
      const cleanUrl = normalizeFeedUrl(feedUrl);
      const isDuplicate = processedUrls.has(cleanUrl);

      if (!isDuplicate) {
        processedUrls.set(cleanUrl, cleanUrl);
      }

      return { safeUrl: cleanUrl, isDuplicate };
    },
  };
}

const runningFetches = new Map<string, Promise<unknown>>();

// prevents multiple simultaneous ingestions
export async function preventDoubleFetch<T>(feedUrl: string, fn: () => Promise<T>): Promise<T> {
  const key = normalizeFeedUrl(feedUrl);
  const activeRequest = runningFetches.get(key);

  if (activeRequest) {
    console.log(`[ingestion] dedupe: coalescing in-flight request for ${key}`);
    return activeRequest as Promise<T>;
  }

  const promise = fn().finally(() => runningFetches.delete(key));
  runningFetches.set(key, promise);
  return promise;
}
