
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


/*PODCAST URLS:
Dan Carlin’s Hardcore History:
https://feeds.feedburner.com/dancarlin/history?format=xml​

Lore:
https://feeds.megaphone.fm/lore​

Revisionist History:
https://feeds.megaphone.fm/revisionisthistory​

Throughline (NPR):
https://feeds.npr.org/510333/podcast.xml​

You Must Remember This:    ///
https://feeds.megaphone.fm/YMRT7068253588​

The Memory Palace:
http://feeds.thememorypalace.us/thememorypalace​

The Joe Rogan Experience:
https://joeroganexp.joerogan.libsynpro.com/rss​

The Daily (The New York Times):
https://feeds.simplecast.com/54nAGcIl​

Crime Junkie:
https://feeds.simplecast.com/qm_9xx0g​

Call Her Daddy:
https://rss.art19.com/call-her-daddy​

This Past Weekend with Theo Von:
https://rss.art19.com/this-past-weekend​

Dateline NBC:
https://feeds.megaphone.fm/dateline​

My Favorite Murder:
https://feeds.megaphone.fm/WWO8086402096​
*/




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



// import { categorizeArticle } from "../src/utils/categorizer";

// (async () => {
//   const title = "Catherine Paiz: My Husband Cheated with 20 Women (Full Episode)";
//     const category = await categorizeArticle(title);
//     console.log(`"${title}" → ${category}`);
// })();


//FINAL PODCAST PACKAGE
// import getPodcastFromFeed from "podparse";

// const FEED_URL = "https://feeds.megaphone.fm/YMRT7068253588"; // replace with your feed

// async function run() {
//   try {
//     const response = await fetch(FEED_URL , {
//       headers: {
//         "User-Agent": "Mozilla/5.0 (Node.js; RSS Parser Test)"
//   }});
//     // const response = await fetch(PROXY);
//     const xml = await response.text();

//     const podcast = getPodcastFromFeed(xml);

//     console.log("Podcast title:", podcast.meta.title);
//     console.log("Number of episodes:", podcast.episodes.length);

//     podcast.episodes.slice(0, 9).forEach((ep, i) => {
//       console.log(`${i + 1}. ${ep.title}`);
//       console.log(`${i + 1}. ${ep.link}`);

      

//     });
//   } catch (err) {
//     console.error("Error parsing podcast feed:", err);
//   }
// }

// run();




// 'use strict';

// import { find  } from 'feedfinder-ts';

// async function testFeedFinder(url: string) {
//   try {
//     const feed = await find(url);
//     if (feed) {
//       console.log('RSS Feed found:', feed);
//     } else {
//       console.log('No RSS feed found at this URL.');
//     }
//   } catch (error) {
//     console.error('Error fetching RSS feed:', error);
//   }
// }

// // Test with a known RSS feed URL
// testFeedFinder('https://www.npr.org');





















// import getPodcastFromFeed from "podparse";

// const FEED_URL = "https://feeds.npr.org/510333/podcast.xml"; // replace with your feed
// const PROXY = "https://api.allorigins.win/raw?url=" + encodeURIComponent(FEED_URL);

// async function run() {
//   try {
//     const response = await fetch(FEED_URL , {
//       headers: {
//         "User-Agent": "Mozilla/5.0 (Node.js; RSS Parser Test)"
//   }});
//     // const response = await fetch(PROXY);
//     const xml = await response.text();

//     const podcast = getPodcastFromFeed(xml);

//     console.log("🎧 Podcast title:", podcast.meta.title);
//     console.log("Number of episodes:", podcast.episodes.length);

//     podcast.episodes.slice(0, 9).forEach((ep, i) => {
//       console.log(`${i + 1}. ${ep.title}`);
//       console.log(`${i + 1}. ${ep.link}`);

//     });
//   } catch (err) {
//     console.error("❌ Error parsing podcast feed:", err);
//   }
// }

// run();















// test-podparse-url.js
// import fetch from "node-fetch";
// import getPodcastFromFeed from "podparse";

// const FEED_URL = "http://feeds.thememorypalace.us/thememorypalace"; // replace with your feed
// const PROXY = "https://api.allorigins.win/raw?url=" + encodeURIComponent(FEED_URL);

// async function run() {
//   try {
//     const response = await fetch(FEED_URL , {
//       headers: {
//         "User-Agent": "Mozilla/5.0 (Node.js; RSS Parser Test)"
//   }});
//     // const response = await fetch(PROXY);
//     const xml = await response.text();

//     const podcast = getPodcastFromFeed(xml);

//     console.log("🎧 Podcast title:", podcast.meta.title);
//     console.log("Number of episodes:", podcast.episodes.length);

//     podcast.episodes.forEach((ep, i) => {
//       console.log(`${i + 1}. ${ep.title}`);
//     });
//   } catch (err) {
//     console.error("❌ Error parsing podcast feed:", err);
//   }
// }

// run();













// // test-podparse.js
// import getPodcastFromFeed from "podparse";
// const FEED_URL = "https://feeds.npr.org/510333/podcast.xml​";
// import fs from 'fs';

// const podcastFeed = fs.readFileSync('path/to/podcast-feed.xml', 'utf8')
// const podcast = getPodcastFromFeed(podcastFeed)

// console.log(podcast.meta.title)
// // "My Podcast"

// podcast.episodes.forEach( (episode) => {
// 	console.log(episode.title)
// })











// async function run() {
//   try {
//     const response = await fetch(FEED_URL);
//     const xml = await response.text();

//     // parse returns parsed feed data
//     const feed = await getPodcastFromFeed(xml);
//     console.log("Feed title:", feed.title);
//     console.log("Number of items:", feed.items?.length);
//     console.log("First item:", feed.items?.[0]);
//   } catch (err) {
//     console.error("Error with podparse:", err);
//   }
// }

// run();












// import { parseFeedToJson, parseFeedToSesamy } from "@sesamy/podcast-parser";

// const FEED_URL = "https://feeds.npr.org/510333/podcast.xml​";

// async function run() {
//   try {
//     const response = await fetch(FEED_URL);
//     const xml = await response.text();

//     // parseFeedToJson expects XML string (or maybe URL?) — typically you pass XML
//     const podcastFeedJson = await parseFeedToJson(xml);

//     // Then convert to Sesamy format
//     const sesamyPodcastFeed = await parseFeedToSesamy(podcastFeedJson);

//     console.log("Products:", sesamyPodcastFeed.products);
//     console.log("Episodes:", sesamyPodcastFeed.episodes);
//   } catch (err) {
//     console.error("Error parsing feed:", err);
//   }
// }

// run();


// import { parseFeedToJson } from '@sesamy/podcast-parser';
// import { parseFeedToSesamy } from '@sesamy/podcast-parser';


// // Parse from a URL
// const podcastFeed = parseFeedToJson('https://feeds.simplecast.com/54nAGcIl');

// (async () => {
// // Convert the JSON feed to Sesamy format
// const sesamyPodcastFeed = parseFeedToSesamy(podcastFeed);

// // This provides access to Sesamy-specific features like:
// console.log(sesamyPodcastFeed.products); // Product information
// console.log(sesamyPodcastFeed.episodes);
// })();













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

// 'use strict';

// import { find  } from 'feedfinder-ts';

// async function testFeedFinder(url: string) {
//   try {
//     const feed = await find(url);
//     if (feed) {
//       console.log('RSS Feed found:', feed);
//     } else {
//       console.log('No RSS feed found at this URL.');
//     }
//   } catch (error) {
//     console.error('Error fetching RSS feed:', error);
//   }
// }

// // Test with a known RSS feed URL
// testFeedFinder('https://joerogan.com');



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
