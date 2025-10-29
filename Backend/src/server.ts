
//WORKING BLOGS: 
//https://www.figma.com/blog/feed/atom.xml
//https://timesofindia.indiatimes.com/rssfeedstopstories.cms  
//https://www.thehindu.com/feeder/default.rss   
//https://indianexpress.com -> https://indianexpress.com/feed/   
//https://fossbytes.com -> https://fossbytes.com/rss/
//https://www.news18.com -> https://www.news18.com/commonfeeds/v1/eng/rss/text.xml
//https://www.bollywoodhungama.com -> https://www.bollywoodhungama.com/rss/news.xml  
//https://www.techrytr.in -> https://www.techrytr.in/rss.xml
//https://tv9kannada.com -> https://tv9kannada.com/feed
//https://www.ndtv.com -> https://feeds.feedburner.com/NDTV-LatestNews
//https://www.buzzfeed.com -> https://www.buzzfeed.com/feed.xml
// business insider  
// vogue.in 
//harper's bazaar
//erik kim - photog  
//serious eats - food 
//cal newport  - deep work, produc  
//stratechery - tech 
//stephanie walter - ux research  
//the verge 
//the guardian
//deccan herald
//wired - tech
//techcrunch - startup and tech
//mashable - news, entertainment
//mark manson
//james clear
//bon appetit - food
//aeon
//longreads - writing - articles


//Website URLs that do not work: naukri, https://highonscore.com, vijayakarnataka, espn, nat geo, india today, bbc, cnn, vogue.com, forbes, hindustan times


// STRING MATCHING: https://www.npmjs.com/package/string-similarity-js


import express, { json, Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import router from "./routes/routes";
import './cron';
import { loggingHandler } from "./middleware/loggingHandler";
import { Feed } from 'podcast';
import { corsHandler } from "./middleware/corsHandler";
import { routeNotFound } from './middleware/routeNotFound';

const PORT = process.env.PORT;

const app = express();

app.use(corsHandler);

app.use(express.json());

app.use(loggingHandler);

app.use("/", router);

app.use(routeNotFound);

//Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));


// import Parser from "rss-parser";
// const parser = new Parser();

// const testFeed = async (url: string) => {
//   try {
//     const feed = await parser.parseURL(url);
//     console.log("Working:", feed.title, "-", url);
//   } catch (err) {
//     console.log("Failed:", url);
//   }
// };

// const feeds = [
//   "https://www.indiatoday.in/rss",
//   "http://rss.cnn.com/rss/cnn_topstories.rss",
//   "https://www.naukri.com/blog/rss",

//   // add more here
// ];

// feeds.forEach(testFeed);









// --- BELOW IS THE TESTING OF ITEM IMAGES FROM RSS PARSER


// import Parser from "rss-parser";

// const parser = new Parser();

// async function testRssImages() {
//   const feedUrl = "https://indianexpress.com/feed/ "; // ← try any RSS URL here

//   try {
//     const feed = await parser.parseURL(feedUrl);
//     console.log(`✅ Feed title: ${feed.title}`);
//     console.log(`Total items: ${feed.items.length}\n`);

//     for (const item of feed.items.slice(0, 5)) { // show just first 5 items
//       let image = null;

//       if (item.enclosure?.url) image = item.enclosure.url;
//       else if (item["media:content"]?.$?.url) image = item["media:content"].$.url;
//       else if (item["media:thumbnail"]?.$?.url) image = item["media:thumbnail"].$.url;
//       else if (item.content || item["content:encoded"]) {
//         const html = item.content || item["content:encoded"] || "";
//         const match = html.match(/<img[^>]+src="([^">]+)"/);
//         if (match) image = match[1];
//       }

//       console.log({
//         title: item.title,
//         image_url: image || "❌ No image found",
//       });
//     }
//   } catch (err) {
//     console.error("Error parsing feed:", err);
//   }
// }

// testRssImages();





// ---BELOW IS THE TESTING OF THE NPM PACKAGE USED TO GET RSS FEED URL FROM WEBSITE URL

'use strict';

import { find  } from 'feedfinder-ts';

async function testFeedFinder(url: string) {
  try {
    const feed = await find(url);
    if (feed) {
      console.log('RSS Feed found:', feed);
    } else {
      console.log('No RSS feed found at this URL.');
    }
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
  }
}

// Test with a known RSS feed URL
testFeedFinder('https://joerogan.com');



// ---BELOW IS AN ONGOING TEST OF AN NPM PACKAGE TO GET PODCASTS


// import * as PodcastModule from "podcast";

// const Podcast = (PodcastModule as any).default || (PodcastModule as any);

// Create podcast feed
// const feed = new Feed({
//   title: 'My Test Podcast',
//   description: 'A simple test feed served via Express',
//   feed_url: 'http://localhost:3000/rss.xml',
//   site_url: 'http://example.com',
//   language: 'en',
//   author: 'Test Author',
// });

// // Add one sample episode
// feed.addItem({
//   title: 'Episode 1: Hello World',
//   description: 'This is the first test episode.',
//   url: 'http://example.com/episode1.mp3',
//   date: new Date(),
//   enclosure: {
//     url: 'http://example.com/episode1.mp3',
//     size: 12345678,
//     type: 'audio/mpeg',
//   },
// });

// // Serve the RSS XML at /rss.xml
// app.get('/rss.xml', (req, res) => {
//   const xml = feed.buildXml();
//   res.type('application/xml');
//   res.send(xml);
// });

// // Start server
// app.listen(3000, () => {
//   console.log('✅ Podcast feed running at: http://localhost:3000/rss.xml');
// });
