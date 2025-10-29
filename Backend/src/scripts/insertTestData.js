import { query, end } from "../config/db";

const insertTestData = async () => {
  try {
    // const userResult = await pool.query(
    //   `INSERT INTO users (name, email, password_hash)
    //    VALUES ($1, $2, $3)
    //    ON CONFLICT (email) DO NOTHING
    //    RETURNING user_id`,
    //   ["Test User", "testuser@example.com", "testpasswordhash"]
    // );
    // const testUserId = userResult.rows[0]?.user_id || 2; // fallback to 2 if exists
    // console.log("User ID:", testUserId);

    // Sources
    const sourceResult1 = await query(
      `INSERT INTO source (source_name, url)
       VALUES ($1, $2)
       ON CONFLICT (source_name) DO NOTHING
       RETURNING source_id`,
      ["Tech Blog", "https://techblog.com/feed"]
    );
    const sourceResult2 = await query(
      `INSERT INTO source (source_name, url)
       VALUES ($1, $2)
       ON CONFLICT (source_name) DO NOTHING
       RETURNING source_id`,
      ["News Site", "https://newssite.com/rss"]
    );
    const source1 = sourceResult1.rows[0]?.source_id || 1;
    const source2 = sourceResult2.rows[0]?.source_id || 2;
    console.log("Sources:", source1, source2);

    // Folders
    const folderResult = await query(
      `INSERT INTO folder (name, user_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, name) DO NOTHING
       RETURNING folder_id`,
      ["Work", testUserId]
    );
    const folderId = folderResult.rows[0]?.folder_id || 1;
    console.log("Folder ID:", folderId);

    //User Source
    await query(
      `INSERT INTO user_source (user_id, source_id, priority)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, source_id) DO NOTHING`,
      [testUserId, source1, 1]
    );
    await query(
      `INSERT INTO user_source (user_id, source_id, priority)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, source_id) DO NOTHING`,
      [testUserId, source2, 2]
    );
    console.log("User sources inserted");

    //Items
    const itemResult1 = await query(
      `INSERT INTO item (source_id, link, title, description, pub_date)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING item_id`,
      [source1, "https://techblog.com/article1", "Tech Article 1", "Description 1"]
    );
    const itemResult2 = await query(
      `INSERT INTO item (source_id, link, title, description, pub_date)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING item_id`,
      [source2, "https://newssite.com/article1", "News Article 1", "Description 2"]
    );
    const item1 = itemResult1.rows[0].item_id;
    const item2 = itemResult2.rows[0].item_id;
    console.log("Items inserted:", item1, item2);

    //User Item Metadata
    await query(
      `INSERT INTO user_item_metadata (user_id, item_id, is_save)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, item_id) DO NOTHING`,
      [testUserId, item1, false]
    );
    await query(
      `INSERT INTO user_item_metadata (user_id, item_id, is_save)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, item_id) DO NOTHING`,
      [testUserId, item2, false]
    );
    console.log("User item metadata inserted");

    console.log("Test data inserted successfully!");
  } catch (err) {
    console.error("Error inserting test data:", err);
  } finally {
    end(); // close DB connection
  }
};

insertTestData();
