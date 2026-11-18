export function getEmptyItemsMessage(feedType: "rss" | "podcast"): string {
  const itemType = feedType === "rss" ? "articles" : "podcast episodes";
  return `No ${itemType} match the selected time range or category.`;
}
