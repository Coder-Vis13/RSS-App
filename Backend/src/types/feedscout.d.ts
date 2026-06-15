declare module "feedscout" {
  export function discoverFeeds(url: string): Promise<unknown>;
}