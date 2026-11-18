export interface DemoSource {
  name: string;
  url: string;
}

/**
 * Sources used to prepare the private demo baseline. They are ingested and
 * refreshed through the normal application pipeline.
 */
export const DEMO_SOURCES: readonly DemoSource[] = [
  {
    name: 'YourStory',
    url: 'https://yourstory.com/',
  },
  {
    name: 'The Daily Brief',
    url: 'https://podcasts.apple.com/in/podcast/the-daily-brief/id1754694834',
  },
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/',
  },
];

export const DEMO_BASELINE_FOLDER_NAME = 'Demo Sources';

export const DEMO_ITEMS_PER_SOURCE = 15;
