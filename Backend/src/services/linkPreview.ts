// import { getLinkPreview } from "link-preview-js";

// export interface PreviewResult {
//   images: string[];
//   title?: string | null;
//   description?: string | null;
// }

// /**
//  * Fetches preview metadata for a URL.
//  * Uses link-preview-js as documented on npm.
//  *
//  * Returns a PreviewResult (may have empty images array).
//  */
// export async function fetchLinkPreview(url: string): Promise<PreviewResult> {
//   try {
//     const data = await getLinkPreview(url, {
//       headers: {
//         // You can add headers if needed (ex: user-agent)
//         "User-Agent": "Mozilla/5.0 (compatible; FeedPreview/1.0)"
//       },
//       timeout: 8000,      // optional timeout
//       followRedirects: "follow" // follow redirects
//     });

//     // link-preview-js returns an object with .images[] according to docs
//     return {
//       images: Array.isArray(data.images) ? data.images : [],
//       title: data.title ?? null,
//       description: data.description ?? null
//     };
//   } catch (err) {
//     console.error("Link preview error:", url, err);
//     return { images: [], title: null, description: null };
//   }
// }
