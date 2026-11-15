import type { PoolClient } from 'pg';

export async function ensureUserSourceUserCascade(client: PoolClient): Promise<void> {
  const orphanedSubscriptions = await client.query(
    `SELECT us.user_id, us.source_id
     FROM user_source us
     LEFT JOIN users u ON u.user_id = us.user_id
     WHERE u.user_id IS NULL
     LIMIT 1`
  );

  if (orphanedSubscriptions.rowCount) {
    throw new Error(
      'Cannot repair user_source ownership: orphaned subscriptions exist. Review and resolve them first.'
    );
  }

  await client.query('BEGIN');
  try {
    await client.query(`
      DO $$
      DECLARE constraint_name TEXT;
      BEGIN
        FOR constraint_name IN
          SELECT conname
          FROM pg_constraint
          WHERE conrelid = 'user_source'::regclass
            AND confrelid = 'users'::regclass
            AND contype = 'f'
        LOOP
          EXECUTE format(
            'ALTER TABLE user_source DROP CONSTRAINT %I',
            constraint_name
          );
        END LOOP;

        ALTER TABLE user_source
          ADD CONSTRAINT user_source_user_id_fkey
          FOREIGN KEY (user_id)
          REFERENCES users(user_id)
          ON DELETE CASCADE ON UPDATE CASCADE;
      END $$;
    `);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
