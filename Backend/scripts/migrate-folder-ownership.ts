import 'dotenv/config';
import pool from '../src/config/db';

async function migrateFolderOwnership(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const invalidMappings = await client.query(
      `SELECT usf.user_id, usf.folder_id, usf.source_id
       FROM user_source_folder usf
       LEFT JOIN folder f ON f.folder_id = usf.folder_id
       WHERE f.folder_id IS NULL OR f.user_id <> usf.user_id
       LIMIT 1`
    );

    if (invalidMappings.rowCount) {
      throw new Error(
        'Cannot add folder ownership constraints: mismatched user_source_folder rows exist. Review and correct them first.'
      );
    }

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'folder_user_folder_unique'
            AND conrelid = 'folder'::regclass
        ) THEN
          ALTER TABLE folder
            ADD CONSTRAINT folder_user_folder_unique UNIQUE (user_id, folder_id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'user_source_folder_owner_fk'
            AND conrelid = 'user_source_folder'::regclass
        ) THEN
          ALTER TABLE user_source_folder
            ADD CONSTRAINT user_source_folder_owner_fk
            FOREIGN KEY (user_id, folder_id)
            REFERENCES folder (user_id, folder_id)
            ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    await client.query('COMMIT');
    console.log('Folder ownership constraints added.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

migrateFolderOwnership()
  .catch((error: unknown) => {
    console.error('Folder ownership migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
