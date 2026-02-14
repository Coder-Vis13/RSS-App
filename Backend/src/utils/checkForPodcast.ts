export async function checkForPodcast(input: string): Promise<boolean> {
  try {
    let searchTerm = input;

    try {
      const url = new URL(
        input.startsWith("http") ? input : `https://${input}`
      );
      searchTerm = url.hostname.replace("www.", "");
    } catch {
      searchTerm = input.trim();
    }

    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        searchTerm
      )}&media=podcast&limit=1`
    );

    const data = await response.json();

    return Boolean(
      data?.results &&
      data.results.length > 0 &&
      data.results[0].feedUrl
    );
  } catch {
    return false;
  }
}
