import express, { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import router from './routes';
import './cron';
import { loggingHandler } from './middleware/logging';
import { corsHandler } from './middleware/cors';
import { routeNotFound } from './middleware/route-not-found';
import debugRoutes from './routes/debug.routes';
import cookieParser from 'cookie-parser';
import { findFeed } from 'find-feed';
import { find } from 'feedfinder-ts';

const PORT = process.env.PORT;

const app = express();

app.post('/_debug', (req, res) => {
  res.json({ ok: true, body: req.body, headers: req.headers });
});

app.use(corsHandler);

app.use(express.json());

app.use(cookieParser());

app.use(loggingHandler);





app.get('/test-feed-discovery', async (req: Request, res: Response) => {
  try {
    const websiteUrl = req.query.website as string;

    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing "website" query parameter',
      });
    }

    const rssPatterns = [
      '/rss/',
      '/rss',
      '/rss.html',
      '/rss.cms',
      '/feeds/',
      '/feed/',
      '/rss-feeds/',
      '/rss-feeds/listing',
      '/info/rssfeed',
    ];

    let allFeeds: any[] = [];
    let primaryIndexUrl = '';

    for (const pattern of rssPatterns) {
      const candidateUrl = websiteUrl.endsWith('/')
        ? `${websiteUrl}${pattern}`
        : `${websiteUrl}${pattern.startsWith('/') ? '' : '/'}${pattern}`;

      try {
        console.log(`Testing: ${candidateUrl}`);
        const candidateFeeds = await findFeed(candidateUrl, {
          recursive: true,
          aggressiveSearch: true,
        });

        console.log(`Found ${candidateFeeds?.length || 0} feeds from ${candidateUrl}`);

        if (candidateFeeds && candidateFeeds.length > 0) {
          candidateFeeds.forEach((feed: any) => {
            if (!allFeeds.some((f) => f.href === feed.href)) {
              allFeeds.push(feed);
            }
          });
          if (!primaryIndexUrl) {
            primaryIndexUrl = candidateUrl; // first working url
            break;
          }
        }
      } catch (err) {
        console.log(`${candidateUrl} failed: ${err}`);
      }
    }

    try {
      console.log(`Running root discovery: ${websiteUrl}`);
      const rootFeeds = await findFeed(websiteUrl, {
        recursive: true,
        aggressiveSearch: true,
      });
      rootFeeds?.forEach((feed: any) => {
        if (!allFeeds.some((f) => f.href === feed.href)) {
          allFeeds.push(feed);
        }
      });
    } catch (rootErr) {
      console.log(`Root discovery failed: ${rootErr}`);
    }

    const importantKeywords = [
      'top',
      'latest',
      'today',
      'news',
      'india',
      'world',
      'global',
      'headlines',
      'breaking',
      'home',
      'main',
      'front',
      'editor',
    ];

    const filteredFeeds = allFeeds.filter((feed: any) => {
      const urlLower = (feed.href || '').toLowerCase();
      const titleLower = (feed.title || '').toLowerCase();

      // Must match AT LEAST ONE important keyword in URL OR title
      return importantKeywords.some(
        (keyword) => urlLower.includes(keyword) || titleLower.includes(keyword)
      );
    });

    filteredFeeds.sort((a: any, b: any) => {
      if (a.isUncertain !== b.isUncertain) return a.isUncertain ? 1 : -1;
      return (a.title || '').localeCompare(b.title || '');
    });

    if (filteredFeeds.length === 0) {
      throw new Error('No important/top story feeds found');
    }

    res.json({
      success: true,
      website: websiteUrl,
      primaryIndexUrl,
      totalRawFeeds: allFeeds.length,
      importantFeeds: filteredFeeds.length,
      feeds: filteredFeeds.slice(0, 30), // Top 30 
    });
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Unknown error',
      });
    }
  }
});




import Parser from 'rss-parser';

const rssParser = new Parser({
  headers: {
    'User-Agent': 'RSS-App/1.0 (contact: your@email.com)',
    Accept: 'application/rss+xml, application/xml',
    Connection: 'keep-alive',
  },
  timeout: 15000,
});



app.get('/test-rss-parser', async (req: Request, res: Response) => {
  try {
    // Example RSS feed URL
    // const feedUrl = 'https://www.reddit.com/subreddits/.rss';
    // const feedUrl = 'https://www.reddit.com/discover.rss';
    const feedUrl = 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml';

    const feed = await rssParser.parseURL(feedUrl);

    const items = (feed.items || []).map((item, index) => ({
      index,
      title: item.title || null,
      categories: item.categories || [],
      content: item.content || null,
      description: item.description || null,
      contentSnippet: item.contentSnippet,
    }));

    res.json({
      success: true,
      feedTitle: feed.title,
      totalItems: items.length,
      items,
    });
  } catch (err: unknown) {
    console.error(err);

    if (err instanceof Error) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: 'Unknown error' });
    }
  }
});





app.get('/test-apple-search', async (_req: Request, res: Response) => {
  try {
    const websiteUrl = 'https://www.allthingswtf.com/';

    const page = await fetch(websiteUrl);
    const html = await page.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (!titleMatch) {
      return res.status(400).json({ success: false, reason: 'NO_TITLE_FOUND' });
    }

    const podcastName = titleMatch[1].replace(/Podcast/i, '').trim();

    const searchResponse = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        podcastName
      )}&media=podcast&limit=1`
    );

    const data = await searchResponse.json();

    if (!data.results || !data.results.length) {
      return res.status(404).json({
        success: false,
        reason: 'NOT_FOUND_ON_APPLE',
      });
    }

    const result = data.results[0];

    res.json({
      success: true,
      detectedTitle: podcastName,
      applePodcastId: result.collectionId,
      feedUrl: result.feedUrl,
      artwork: result.artworkUrl600,
      author: result.artistName,
    });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});



const parser = new Parser({ timeout: 2500 });

app.get('/test-feed-discovery-top', async (req: Request, res: Response) => {
  try {
    const websiteUrl = req.query.website as string;

    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing "website" query parameter',
      });
    }

    const rssPatterns = [
      '/rss/',
      '/rss',
      '/rss.html',
      '/rss.cms',
      '/feeds/',
      '/feed/',
      '/rss-feeds/',
      '/rss-feeds/listing',
      '/info/rssfeed',
    ];

    let allFeeds: string[] = [];
    let primaryIndexUrl = '';

    // Step 1: Try RSS index-style paths
    for (const pattern of rssPatterns) {
      const candidateUrl = websiteUrl.endsWith('/')
        ? `${websiteUrl}${pattern}`
        : `${websiteUrl}${pattern.startsWith('/') ? '' : '/'}${pattern}`;

      try {
        const candidateFeeds = await findFeed(candidateUrl, {
          recursive: true,
          aggressiveSearch: true,
        });

        if (candidateFeeds && candidateFeeds.length > 0) {
          for (const feed of candidateFeeds) {
            if (feed.href && !allFeeds.includes(feed.href)) {
              allFeeds.push(feed.href);
            }
          }

          if (!primaryIndexUrl) {
            primaryIndexUrl = candidateUrl;
          }

          break; // stop after first working index
        }
      } catch {
        continue;
      }
    }

    // Step 2: Fallback to root discovery
    if (allFeeds.length === 0) {
      try {
        const rootFeeds = await findFeed(websiteUrl, {
          recursive: true,
          aggressiveSearch: true,
        });

        for (const feed of rootFeeds || []) {
          if (feed.href && !allFeeds.includes(feed.href)) {
            allFeeds.push(feed.href);
          }
        }
      } catch {}
    }

    if (allFeeds.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No feeds discovered',
      });
    }

    // Step 3: Parse each feed and count items
    const results: { feedUrl: string; itemCount: number }[] = [];

    for (const feedUrl of allFeeds) {
      try {
        const parsed = await parser.parseURL(feedUrl);
        const itemCount = parsed.items ? parsed.items.length : 0;

        

        if (itemCount > 0) {
          results.push({ feedUrl, itemCount });
        }
      } catch {
        // Skip non-XML or invalid feeds (like RSS index HTML)
        continue;
      }
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feeds found but none were valid RSS XML feeds',
      });
    }

    // Step 4: Sort by item count descending
    results.sort((a, b) => b.itemCount - a.itemCount);

    return res.json({
      success: true,
      website: websiteUrl,
      primaryIndexUrl,
      totalDiscoveredFeeds: allFeeds.length,
      validFeedsParsed: results.length,
      bestFeed: results[0],
      topFeeds: results.slice(0, 5),
    });

  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});


import pLimit from 'p-limit';

// Concurrency limit (balanced for speed + stability)
const limit = pLimit(6);

// Avoid pathological cases (some sites return 200+ feeds)
const MAX_FEEDS_TO_PARSE = 80;

app.get('/test-feed-discovery-top-new', async (req: Request, res: Response) => {
  try {
    const websiteUrl = req.query.website as string;

    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing "website" query parameter',
      });
    }

    const normalizedBase = websiteUrl.endsWith('/')
      ? websiteUrl.slice(0, -1)
      : websiteUrl;

    const rssPatterns = [
      '/rss/',
      '/rss',
      '/rss.html',
      '/rss.cms',
      '/feeds/',
      '/feed/',
      '/rss-feeds/',
      '/rss-feeds/listing',
      '/info/rssfeed',
    ];

    const feedSet = new Set<string>();
    let primaryIndexUrl = '';

    // STEP 1: Try index-style paths (highest priority)
    for (const pattern of rssPatterns) {
      const candidateUrl = `${normalizedBase}${pattern}`;

      try {
        const discovered = await findFeed(candidateUrl, {
          recursive: true,
          aggressiveSearch: true,
        });

        if (discovered?.length) {
          for (const feed of discovered) {
            if (feed.href) {
              feedSet.add(feed.href.trim());
            }
          }

          if (!primaryIndexUrl) {
            primaryIndexUrl = candidateUrl;
          }

          break; // stop after first successful index
        }
      } catch {
        continue;
      }
    }

    // STEP 2: Fallback to root discovery
    if (feedSet.size === 0) {
      try {
        const rootFeeds = await findFeed(normalizedBase, {
          recursive: true,
          aggressiveSearch: true,
        });

        for (const feed of rootFeeds || []) {
          if (feed.href) {
            feedSet.add(feed.href.trim());
          }
        }
      } catch {}
    }

    if (feedSet.size === 0) {
      return res.status(404).json({
        success: false,
        error: 'No feeds discovered',
      });
    }

    // Convert to array + limit size (prevents extreme slowdowns)
    const allFeeds = Array.from(feedSet).slice(0, MAX_FEEDS_TO_PARSE);

    // STEP 3: Parse feeds with controlled concurrency
    const parseTasks = allFeeds.map((feedUrl) =>
      limit(async () => {
        try {
          // Quick guard: skip obvious HTML pages
          if (
            feedUrl.endsWith('.html') ||
            feedUrl.endsWith('.htm')
          ) {
            return null;
          }

          const parsed = await parser.parseURL(feedUrl);

          if (!parsed?.items?.length) {
            return null;
          }

          return {
            feedUrl,
            itemCount: parsed.items.length,
          };
        } catch {
          return null;
        }
      })
    );

    const parsedResults = await Promise.all(parseTasks);

    const validFeeds = parsedResults.filter(
      (r): r is { feedUrl: string; itemCount: number } => r !== null
    );

    if (validFeeds.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feeds found but none were valid RSS XML feeds',
      });
    }

    // STEP 4: Sort by item count descending
    validFeeds.sort((a, b) => b.itemCount - a.itemCount);

    return res.json({
      success: true,
      website: normalizedBase,
      primaryIndexUrl,
      totalDiscoveredFeeds: feedSet.size,
      parsedFeeds: allFeeds.length,
      validFeedsParsed: validFeeds.length,
      bestFeed: validFeeds[0],
      topFeeds: validFeeds.slice(0, 5),
    });

  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});







async function isLikelyRSS(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!res.ok) return false;

    const text = await res.text();

    return (
      text.includes('<rss') ||
      text.includes('<feed') ||
      text.includes('<channel>')
    );
  } catch {
    return false;
  }
}


app.get('/test-feed-discovery-top-3', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const MAX_TOTAL_TIME = 8000; // hard cap: 8s total

    const websiteUrl = req.query.website as string;

    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing "website" query parameter',
      });
    }

    const normalizedBase = websiteUrl.endsWith('/')
      ? websiteUrl.slice(0, -1)
      : websiteUrl;

    const rssPatterns = [
      '/rss/',
      '/rss',
      '/rss.html',
      '/rss.cms',
      '/feeds/',
      '/feed/',
      '/rss-feeds/',
      '/rss-feeds/listing',
      '/info/rssfeed',
    ];

    const feedSet = new Set<string>();
    let primaryIndexUrl = '';

    // STEP 1: Index-style paths
    for (const pattern of rssPatterns) {
      const candidateUrl = `${normalizedBase}${pattern}`;

      try {
        const discovered = await findFeed(candidateUrl, {
          recursive: true,
          aggressiveSearch: true,
        });

        if (discovered?.length) {
          for (const feed of discovered) {
            if (feed.href) {
              feedSet.add(feed.href.trim());
            }
          }

          if (!primaryIndexUrl) {
            primaryIndexUrl = candidateUrl;
          }

          break;
        }
      } catch {
        continue;
      }
    }

    // STEP 2: Fallback
    if (feedSet.size === 0) {
      try {
        const rootFeeds = await findFeed(normalizedBase, {
          recursive: true,
          aggressiveSearch: true,
        });

        for (const feed of rootFeeds || []) {
          if (feed.href) {
            feedSet.add(feed.href.trim());
          }
        }
      } catch {}
    }

    if (feedSet.size === 0) {
      return res.status(404).json({
        success: false,
        error: 'No feeds discovered',
      });
    }

    const allFeeds = Array.from(feedSet).slice(0, MAX_FEEDS_TO_PARSE);

    // STEP 3: Parse with concurrency + fast reject
    const parseTasks = allFeeds.map((feedUrl) =>
      limit(async () => {
        try {
          // Global time cap protection
          if (Date.now() - startTime > MAX_TOTAL_TIME) {
            return null;
          }

          if (
            feedUrl.endsWith('.html') ||
            feedUrl.endsWith('.htm')
          ) {
            return null;
          }

          // FAST VALIDATION FIRST
          const validXML = await isLikelyRSS(feedUrl);
          if (!validXML) return null;

          // FULL PARSE (unchanged logic)
          const parsed = await parser.parseURL(feedUrl);
          if (parsed.items.length > 100) {
   return {
      feedUrl,
      itemCount: parsed.items.length,
      strong: true
   };
}

          if (!parsed?.items?.length) {
            return null;
          }

          return {
            feedUrl,
            itemCount: parsed.items.length,
          };
        } catch {
          return null;
        }
      })
    );

    const parsedResults = await Promise.all(parseTasks);

    

    const validFeeds = parsedResults.filter(
      (r): r is { feedUrl: string; itemCount: number } => r !== null
    );

    const strongFeed = validFeeds.find(f => (f as any).strong);

if (strongFeed) {
   return res.json({
      success: true,
      website: normalizedBase,
      primaryIndexUrl,
      totalDiscoveredFeeds: feedSet.size,
      parsedFeeds: allFeeds.length,
      validFeedsParsed: validFeeds.length,
      bestFeed: strongFeed,
      topFeeds: validFeeds
        .sort((a, b) => b.itemCount - a.itemCount)
        .slice(0, 5),
    });
}

    if (validFeeds.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feeds found but none were valid RSS XML feeds',
      });
    }

    validFeeds.sort((a, b) => b.itemCount - a.itemCount);

    return res.json({
      success: true,
      website: normalizedBase,
      primaryIndexUrl,
      totalDiscoveredFeeds: feedSet.size,
      parsedFeeds: allFeeds.length,
      validFeedsParsed: validFeeds.length,
      bestFeed: validFeeds[0],
      topFeeds: validFeeds.slice(0, 5),
    });

  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});





// async function testFeedFinder() {
//   const website = "https://www.nytimes.com"; // <-- set your website URL here

//   try {
//     const feeds = await find(website);
//     console.log("Website:", website);
//     console.log("Discovered feeds:", feeds);
//   } catch (err) {
//     console.error("Failed to find feeds:", err);
//   }
// }

// testFeedFinder();




app.use('/', router);
app.use('/debug', debugRoutes);

app.use(routeNotFound);

//Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
