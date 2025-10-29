import { schedule } from 'node-cron';
import { query } from './config/db';
import { RSSParser } from './services/rssService';
import { addSource, addItem, addUserItemMetadata } from './models/model';
// Run every 2 hours
schedule('0 */2 * * *', async () => {
    // schedule('* * * * *', async () => {
    const startTime = new Date();
    console.log(`CRON -> Starting feed refresh at ${new Date().toISOString()}`);
    try {
        // Get all distinct sources with subscribed users
        const sourcesRes = await query(`SELECT s.source_id, s.url, array_agg(us.user_id) AS user_ids
       FROM source s
       JOIN user_source us ON us.source_id = s.source_id
       GROUP BY s.source_id, s.url`);
        for (const row of sourcesRes.rows) {
            const { source_id: sourceId, url, user_ids: userIds } = row;
            try {
                const { sourceName, sourceItems } = await RSSParser(url);
                console.log(`CRON -> Processing source: ${sourceName} (${url})`);
                //add source to source table
                await addSource(sourceName, url);
                //get items from past 2 days
                const twoDaysAgo = new Date();
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                const recentItems = (sourceItems || []).filter(i => i.pubDate && new Date(i.pubDate) >= twoDaysAgo);
                if (recentItems.length === 0) {
                    console.log(`CRON -> No new items for source: ${sourceName}`);
                    //there is nothing new published for this source
                    continue;
                }
                //insert new items and get their IDs
                const { insertedIds = [], insertCount = 0 } = await addItem(sourceId, recentItems);
                if (insertCount > 0) {
                    console.log(`cron => Inserted ${insertCount} items for source ${sourceId}`);
                }
                if (insertedIds.length > 0 && userIds?.length) {
                    // "or null" because for preset sources, there will be no users in the db
                    for (const userId of userIds || []) {
                        try {
                            await addUserItemMetadata(userId, insertedIds);
                        }
                        catch (err) {
                            const error = err;
                            console.error(`cron -> Error adding user-item metadata for user ${userId}:`, error.stack || error.message);
                        }
                    }
                }
            }
            catch (sourceErr) {
                const error = sourceErr;
                console.error(`cron => Error processing source ${url}:`, error.stack || error.message);
            }
        }
        const endTime = new Date();
        console.log(`CRON -> Finished feed refresh at ${endTime.toISOString()}`);
    }
    catch (error) {
        const err = error;
        console.error('cron => Error:', err.stack || err.message);
    }
});
//   try {
//     // Get all distinct sources with subscribed users
//     const sourcesRes = await pool.query(
//       `SELECT s.source_id, s.url, array_agg(us.user_id) AS user_ids
//        FROM source s
//        JOIN user_source us ON us.source_id = s.source_id
//        GROUP BY s.source_id, s.url`
//     );
//     for (const row of sourcesRes.rows) {
//       const { source_id: sourceId, url, user_ids: userIds } = row;
//       try {
//         // Parse the RSS feed
//         const parsed = await parser.parseURL(url);
//         const sName = parsed.title || 'Untitled Source';
//         // Ensure source row exists & name is updated
//         await addSource(sName, url);
//         // Filter items from past 2 days and normalize
//         const twoDaysAgo = new Date();
//         twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
//         const sourceItems = parsed.items
//           .filter(it => (it.pubDate && new Date(it.pubDate) >= twoDaysAgo) && (it.link || it.guid))
//           .map(it => ({
//             link: it.link || it.guid,
//             title: he.decode(sanitizeHtml(it.title || 'Untitled')),
//             description: he.decode(
//               sanitizeHtml(it.content || it.description || it.contentSnippet || '', {
//                 allowedAttributes: { a: ['href'] }
//               })
//             ),
//             pubDate: it.pubDate ? new Date(it.pubDate) : null
//           }));
//         if (sourceItems.length === 0) continue;
//         // Insert new items and get their IDs
//         const { insertedIds, insertCount } = await addItem(sourceId, sourceItems);
//         if (insertCount > 0) {
//           console.log(`[cron] Inserted ${insertCount} items for source ${sourceId}`);
//         }
//         // Add metadata rows for all subscribed users
//         if (insertedIds.length > 0) {
//           for (const userId of userIds) {
//             await addUserItemMetadata(userId, insertedIds);
//           }
//         }
//       } catch (errInner) {
//         console.error(`[cron] Error processing source ${url}:`, errInner.message);
//       }
//     }
//     console.log(`[cron] Finished feed refresh at ${new Date().toISOString()}`);
//   } catch (err) {
//     console.error('[cron] Unexpected error:', err.message);
//   }
// });
//# sourceMappingURL=cron.js.map