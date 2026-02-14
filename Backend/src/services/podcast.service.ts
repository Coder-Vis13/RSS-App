import getPodcastFromFeed from 'podparse';
import sanitizeHtml from 'sanitize-html';


interface AppleSearchResult {
  resultCount: number;
  results: {
    collectionId: number;
    feedUrl: string;
    artworkUrl600: string;
    artistName: string;
  }[];
}
export async function resolvePodcastFromWebsite(websiteUrl: string) {
  const urlObj = new URL(websiteUrl);
  const hostname = urlObj.hostname.replace("www.", "");

  let podcastName: string | null = null;

  try {
    const page = await fetch(websiteUrl);
    if (page.ok) {
      const html = await page.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);

      if (titleMatch?.[1]) {
        podcastName = titleMatch[1]
          .replace(/Podcast/i, "")
          .trim();
      }
    }
  } catch {
    // Ignore HTML fetch errors
  }

  // Fallback to hostname if title not found
  const searchTerm = podcastName || hostname;

  const searchResponse = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(
      searchTerm
    )}&media=podcast&limit=1`
  );

  const data = (await searchResponse.json()) as AppleSearchResult;

  if (!data.results?.length) {
    throw new Error("NOT_FOUND_ON_APPLE");
  }

  const result = data.results[0];

  const parsedPodcast = await podcastParser(result.feedUrl);

  return {
    applePodcastId: result.collectionId,
    feedUrl: result.feedUrl,
    artwork: result.artworkUrl600,
    author: result.artistName,
    ...parsedPodcast,
  };
}


export const podcastParser = async (sourceURL: string) => {
  console.log(`Fetching podcast feed for: ${sourceURL}`);

  const response = await fetch(sourceURL);
  if (!response.ok) {
    throw new Error('Invalid or unreachable podcast URL');
  }

  const xml = await response.text();
  const podcast = getPodcastFromFeed(xml);

  if (!podcast?.meta?.title || !podcast.episodes?.length) {
    throw new Error('Could not parse podcast feed');
  }

  const podcastTitle = podcast.meta.title.trim();

  const episodeItems = podcast.episodes.map((ep) => {
    const episodeLink = ep.enclosure?.url || ep.guid || ep.link || ep.title;

    return {
      title: ep.title?.trim() || 'Untitled Episode',
      link: episodeLink,
      pubDate: ep.pubDate,
      description: sanitizeHtml(ep.description || '', {
        allowedTags: [], // no HTML tags allowed
        allowedAttributes: {}, // no HTML attributes allowed
      }).trim(),
      duration: ep.duration || null,
    };
  });

  return { podcastTitle, episodeItems, totalEpisodes: podcast.episodes.length };
};
