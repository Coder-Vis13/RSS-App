import axios from "axios";

export async function getLogo(url: string): Promise<string | null> {
  try {
    const domain = new URL(url).hostname;
    // Clearbit auto-finds logos for most domains
    return `https://logo.clearbit.com/${domain}`;
  } catch (err) {
    console.error("Failed to get logo for:", url, err);
    return null;
  }
}
