export interface DemoSource {
  name: string;
  url: string;
}

/**
 * Stable feeds used to prepare the private demo baseline. These are regular
 * application sources: they are ingested and refreshed by the normal pipeline.
 */
export const DEMO_SOURCES: readonly DemoSource[] = [
  {
    name: 'The New York Times: World',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  },
  {
    name: 'The GitHub Blog',
    url: 'https://github.blog/feed/',
  },
  {
    name: 'Cleo Abram',
    url: 'https://www.youtube.com/@cleoabram',
  },
];

export const DEMO_BASELINE_FOLDER_NAME = 'Demo Sources';
