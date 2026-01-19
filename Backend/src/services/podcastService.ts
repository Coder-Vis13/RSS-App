import getPodcastFromFeed from 'podparse';
import sanitizeHtml from 'sanitize-html';

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

// import  getPodcastFromFeed  from "podparse"; // or wherever your function is

// export const podcastParser = async (sourceURL: string) => {
//   console.log(`Fetching podcast feed for: ${sourceURL}`);

//   const response = await fetch(sourceURL);
//   if (!response.ok) {
//     throw new Error("Invalid or unreachable podcast URL");
//   }

//   const xml = await response.text();
//   const podcast = getPodcastFromFeed(xml);

//   if (!podcast?.meta?.title || !podcast.episodes?.length) {
//     throw new Error("Could not parse podcast feed");
//   }

//   const podcastTitle = podcast.meta.title.trim();
//   const episodeItems = podcast.episodes.map((ep) => ({
//   const episodeLink = ep.guid || ep.enclosure?.url || ep.link || ep.title;
//   return {
//     title: ep.title,
//     link: ep.link || "",
//     pubDate: ep.pubDate,
//     description: ep.description,
//     // play: ep.enclosure
//   }
//   }));

//   return { podcastTitle, episodeItems, totalEpisodes: podcast.episodes.length };
// };
