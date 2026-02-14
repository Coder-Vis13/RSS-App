/*
psql -U myprojectuser -d myprojectdb -h localhost
\pset pager off
\dt - to see table
npx prettier --write .
*/

import { query } from '../src/config/db';

const createTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL,
        email VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        refresh_token TEXT
      );

      CREATE TABLE IF NOT EXISTS source (
        source_id SERIAL PRIMARY KEY,
        source_name TEXT NOT NULL,
        url TEXT UNIQUE NOT NULL,
        feed_type TEXT NOT NULL DEFAULT 'rss'
          CHECK (feed_type IN ('rss', 'podcast'))
      );

      CREATE TABLE IF NOT EXISTS folder (
        folder_id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL,
        user_id INT NOT NULL
          REFERENCES users(user_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE (user_id, name)
      );

      CREATE TABLE IF NOT EXISTS user_source (
        user_id INT NOT NULL
          REFERENCES users(user_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        source_id INT NOT NULL
          REFERENCES source(source_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        priority INT,
        PRIMARY KEY (user_id, source_id),
        UNIQUE (user_id, priority)
      );

      CREATE TABLE IF NOT EXISTS user_podcast (
        user_id INT NOT NULL
          REFERENCES users(user_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        podcast_id INT NOT NULL
          REFERENCES source(source_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        priority INT,
        PRIMARY KEY (user_id, podcast_id),
        UNIQUE (user_id, priority)
      );

      CREATE TABLE IF NOT EXISTS user_source_folder (
        user_id INT NOT NULL,
        folder_id INT NOT NULL,
        source_id INT NOT NULL,
        PRIMARY KEY (user_id, folder_id, source_id),
        FOREIGN KEY (user_id)
          REFERENCES users(user_id)
          ON DELETE CASCADE,
        FOREIGN KEY (folder_id)
          REFERENCES folder(folder_id)
          ON DELETE CASCADE,
        FOREIGN KEY (source_id)
          REFERENCES source(source_id)
          ON DELETE CASCADE,
        FOREIGN KEY (user_id, source_id)
          REFERENCES user_source(user_id, source_id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS item (
        item_id SERIAL PRIMARY KEY,
        source_id INT NOT NULL
          REFERENCES source(source_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        link TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        pub_date TIMESTAMP NOT NULL,
        is_categorized BOOLEAN DEFAULT false,
        UNIQUE (source_id, link),
        UNIQUE (link)
      );

      CREATE TABLE IF NOT EXISTS item_tag (
        item_id INT NOT NULL
          REFERENCES item(item_id)
          ON DELETE CASCADE,
        tag TEXT NOT NULL,
        PRIMARY KEY (item_id, tag)
      );

      CREATE TABLE IF NOT EXISTS user_item_metadata (
        user_id INT NOT NULL
          REFERENCES users(user_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        item_id INT NOT NULL
          REFERENCES item(item_id)
          ON UPDATE CASCADE,
        is_save BOOLEAN DEFAULT FALSE,
        read_time TIMESTAMP,
        PRIMARY KEY (user_id, item_id)
      );

      CREATE TABLE IF NOT EXISTS category (
        category_id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS item_category (
        item_id INT NOT NULL
          REFERENCES item(item_id)
          ON DELETE CASCADE,
        category_id INT NOT NULL
          REFERENCES category(category_id)
          ON DELETE CASCADE,
        PRIMARY KEY (item_id, category_id)
      );
    `);

    console.log('All tables created!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

createTables();