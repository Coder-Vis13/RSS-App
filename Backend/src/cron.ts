import { schedule }  from 'node-cron';
import { query } from './config/db';
import { RSSParser } from './services/rssService';
import { QueryResult } from "./utils/helpers";
import { RSSItem, ParsedRSS } from "./services/rssService"

import { addSource, addItem, addUserItemMetadata } from './models/model';


export interface SourceRow {
  source_id: number;
  url: string;
  user_ids: number[] | null;
}

// Returned shape from addItem()
export interface AddItemResult {
  insertedIds: number[];
  insertCount: number;
}

export interface AppError extends Error {
  stack?: string;
  message: string;
}

// Run every 2 hours
schedule('0 */2 * * *', async () => {
  // schedule('* * * * *', async () => {

  const startTime = new Date();
  console.log(`CRON -> Starting feed refresh at ${new Date().toISOString()}`);

  try {
    // Get all distinct sources with subscribed users
    const sourcesRes: QueryResult<SourceRow> = await query(
      `SELECT s.source_id, s.url, array_agg(us.user_id) AS user_ids
       FROM source s
       JOIN user_source us ON us.source_id = s.source_id
       GROUP BY s.source_id, s.url`
    );

    for (const row of sourcesRes.rows) {
      const { source_id: sourceId, url, user_ids: userIds } = row;

      try {
        const { sourceName, sourceItems }: ParsedRSS = await RSSParser(url);
        console.log(`CRON -> Processing source: ${sourceName} (${url})`);
        //add source to source table
        await addSource(sourceName, url);
        //get items from past 2 days
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const recentItems: RSSItem[] = (sourceItems || []).filter(
          i => i.pubDate && new Date(i.pubDate) >= twoDaysAgo
        );

        if (recentItems.length === 0) {
          console.log(`CRON -> No new items for source: ${sourceName}`);
          //there is nothing new published for this source
          continue;
        }
          

        //insert new items and get their IDs
        const { insertedIds = [], insertCount = 0 }: AddItemResult = await addItem(sourceId, recentItems);
        if (insertCount > 0) {
          console.log(`cron => Inserted ${insertCount} items for source ${sourceId}`);
        }

        if ( insertedIds.length > 0 && userIds?.length) {
          // "or null" because for preset sources, there will be no users in the db
          for (const userId of userIds || []) {
            try {
              await addUserItemMetadata(userId, insertedIds);
            } catch (err: unknown) {
              const error = err as AppError;
              console.error(`cron -> Error adding user-item metadata for user ${userId}:`, error.stack || error.message);
            }
          }
        }

      } catch (sourceErr: unknown) {
        const error = sourceErr as AppError;
        console.error(`cron => Error processing source ${url}:`, error.stack || error.message);
      }
    }
    
    const endTime = new Date();
    console.log(`CRON -> Finished feed refresh at ${endTime.toISOString()}`)
  } catch (error: unknown) {
    const err = error as AppError;
    console.error('cron => Error:', err.stack || err.message);
  }
});


