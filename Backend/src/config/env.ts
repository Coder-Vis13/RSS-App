import { YOUTUBE_RSS_BASE_URL } from './youtube-rss';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

export const ENV = {
  ACCESS_TOKEN_SECRET: required('ACCESS_TOKEN_SECRET'),
  REFRESH_TOKEN_SECRET: required('REFRESH_TOKEN_SECRET'),
  YOUTUBE_RSS_BASE_URL,
};
