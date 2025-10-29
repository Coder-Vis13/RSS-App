/*FIX:
only show those feed data items which are provided

*/
//working URLs: https://www.figma.com/blog/feed/atom.xml
//https://timesofindia.indiatimes.com/rssfeedstopstories.cms
//https://fossbytes.com/feed/?x=1
//https://www.thehindu.com/feeder/default.rss
import express, { json } from 'express';
// import cors from 'cors';
import 'dotenv/config';
import router from "./routes/routes";
import './cron';
// import Parser from 'rss-parser';
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = express();
// app.use(cors());
app.use(json());
app.use("/", router);
//404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});
//Error handler
app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});
app.listen(PORT, () => console.log('Server running on port ' + PORT));
// app.use("/", appRouter);
// app.use("/addSource", appRouter);
// app.use("/createFolder", appRouter);
// app.use("/userAddSource". appRouter);
// async function fetchFeed() {
//     try {
//         const parser = new Parser();
//         const feed = await parser.parseURL('https://www.thehindu.com/feeder/default.rss');
//         console.log(feed.title, feed.items.length);
//         // Optional: log only items that exist
//         feed.items.forEach((item, index) => {
//             if (item.title && item.link) {
//                 console.log(index + 1, item.title, item.link);
//             }
//         });
//     } catch (err) {
//         console.error('Failed to fetch RSS feed:', err.message);
//     }
// }
// // Call the function
// fetchFeed();
//# sourceMappingURL=server.js.map