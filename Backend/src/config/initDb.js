//psql -U myprojectuser -d myprojectdb -h localhost
// \pset pager off
// \dt - to see table

import { query } from "./db";

const createTables = async() => {
    try{
        await query(`
            CREATE TABLE IF NOT EXISTS users(
            user_id SERIAL PRIMARY KEY, 
            name VARCHAR(30) NOT NULL, 
            email VARCHAR(50) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT now()
            );

            CREATE TABLE IF NOT EXISTS source(
            source_id SERIAL PRIMARY KEY,
            source_name TEXT NOT NULL,
            url TEXT UNIQUE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS folder(
            folder_id SERIAL PRIMARY KEY,
            name VARCHAR(30) NOT NULL,
            user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            UNIQUE (user_id, name)
            );

            CREATE TABLE IF NOT EXISTS user_source_folder(
            folder_id INT NOT NULL REFERENCES folder(folder_id) ON DELETE CASCADE ON UPDATE CASCADE,
            source_id INT NOT NULL REFERENCES source(source_id) ON DELETE CASCADE ON UPDATE CASCADE,
            user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
            PRIMARY KEY (user_id, folder_id, source_id)
            FOREIGN KEY (user_id, source_id) REFERENCES user_source(user_id, source_id) ON DELETE CASCADE  --only sources from user_source are added or deleted
            UNIQUE(user_id, folder_id, source_id)
            );

            CREATE TABLE IF NOT EXISTS user_source(
            user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
            source_id INT NOT NULL REFERENCES source(source_id) ON DELETE CASCADE ON UPDATE CASCADE,
            priority INT,
            PRIMARY KEY(user_id, source_id),
            UNIQUE(user_id, priority)
            );

            CREATE TABLE IF NOT EXISTS item(
            item_id SERIAL PRIMARY KEY,
            source_id INT NOT NULL REFERENCES source(source_id) ON DELETE CASCADE ON UPDATE CASCADE,
            link TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            pub_date TIMESTAMP NOT NULL
            UNIQUE(source_id, link)  --avoiding duplicates so only new items are inserted
            );

            CREATE TABLE IF NOT EXISTS user_item_metadata(
            user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
            item_id INT NOT NULL REFERENCES item(item_id) ON DELETE NO ACTION ON UPDATE CASCADE,   --users have to mark items as read - items won't get deleted after a few days
            is_save BOOLEAN DEFAULT FALSE,
            read_time TIMESTAMP,
            PRIMARY KEY(user_id, item_id)
            );
            `);
            console.log("All tables created!!");

    } catch(error){
        console.error("Error creating tables: ", error);
    }
};

createTables();
