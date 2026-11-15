import dotenv from 'dotenv';
dotenv.config();

// Set to the Compose service hostname when the backend runs inside Docker.
export const YOUTUBE_RSS_BASE_URL =
  process.env.YOUTUBE_RSS_BASE_URL?.trim().replace(/\/+$/, '') || 'http://localhost:8080';
