/* UPDATE TSCONFIG LATER WHEN SWITCHING TO TS (for sanitize-html)

{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
*/
//rss parsing 
import Parser from 'rss-parser';
import sanitizeHtml from 'sanitize-html';
// import { decode } from 'he';
import pkg from 'he';
const { decode } = pkg;
const parser = new Parser();
export async function RSSParser(sourceURL) {
    try {
        const parsedSource = await parser.parseURL(sourceURL);
        const sourceName = parsedSource.title || "Untitled Source";
        const sourceItems = (parsedSource.items || [])
            .filter(item => item && (item.link || item.guid))
            .map(item => ({
            link: item.link || item.guid,
            title: decode(sanitizeHtml(item.title || "Untitled", { allowedTags: [], allowedAttributes: {} })),
            description: decode(sanitizeHtml(item.content || item.description || item.contentSnippet || "", {
                allowedTags: [], allowedAttributes: {},
            })),
            pubDate: item.pubDate ? new Date(item.pubDate) : null,
        }));
        return { sourceName, sourceItems };
    }
    catch (error) {
        console.error("Error parsing RSS feed:", error?.message);
        throw new Error("RSS parsing failed");
    }
}
;
//# sourceMappingURL=rssService.js.map