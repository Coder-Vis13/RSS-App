export function getDomainFromFeedUrl(feedUrl: string): string | null {
  try {
    return new URL(feedUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function buildClearbitLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

export function buildGoogleFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function logoUrlFromFeedUrl(feedUrl: string): string | null {
  const domain = getDomainFromFeedUrl(feedUrl);
  return domain ? buildClearbitLogoUrl(domain) : null;
}
