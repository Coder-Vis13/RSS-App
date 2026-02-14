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
    // Get website URL from query string: ?website=https://www.indiatoday.in
    const websiteUrl = req.query.website as string;

    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing "website" query parameter',
      });
    }

    // Patterns including RSS index pages
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

    // Test ALL patterns - collect ALL discovered feeds
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

        // Add ALL feeds (dedupe by href)
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

    // Root discovery
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

    // INCLUSION FILTER: Only keep important/top stories feeds
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

    // Sort: confident first, then alphabetical
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
      feeds: filteredFeeds.slice(0, 30), // Top 10 important ones
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
    const feedUrl = 'https://zeenews.india.com/feeds/#india_menus';

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


app.use('/', router);
app.use('/debug', debugRoutes);

app.use(routeNotFound);

//Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
