import pool from '../config/db';

interface ExpiredDemoSession {
  session_id: string;
  user_id: number;
}

interface SourceRow {
  source_id: number;
}

export async function cleanupExpiredDemoSessions(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const expiredSessions = await client.query<ExpiredDemoSession>(`
      SELECT session_id, user_id
      FROM demo_session
      WHERE expires_at <= NOW()
      FOR UPDATE SKIP LOCKED
    `);

    if (expiredSessions.rows.length === 0) {
      await client.query('COMMIT');
      return;
    }

    const sessionIds = expiredSessions.rows.map((session) => session.session_id);
    const userIds = expiredSessions.rows.map((session) => session.user_id);
    const sourceResult = await client.query<SourceRow>(
      `
        SELECT DISTINCT source_id
        FROM user_source
        WHERE user_id = ANY($1::int[])
      `,
      [userIds]
    );

    await client.query(
      `DELETE FROM demo_session WHERE session_id = ANY($1::uuid[])`,
      [sessionIds]
    );
    await client.query(`DELETE FROM users WHERE user_id = ANY($1::int[])`, [userIds]);

    const sourceIds = sourceResult.rows.map((source) => source.source_id);
    let deletedSourceCount = 0;

    if (sourceIds.length > 0) {
      const deletedSources = await client.query(
        `
          DELETE FROM source s
          WHERE s.source_id = ANY($1::int[])
            AND NOT EXISTS (
              SELECT 1
              FROM user_source us
              WHERE us.source_id = s.source_id
            )
            AND NOT EXISTS (
              SELECT 1
              FROM user_item_metadata uim
              INNER JOIN item i ON i.item_id = uim.item_id
              WHERE i.source_id = s.source_id
            )
        `,
        [sourceIds]
      );
      deletedSourceCount = deletedSources.rowCount ?? 0;
    }

    await client.query('COMMIT');

    console.log(
      `DEMO CLEANUP -> removed ${userIds.length} guest session(s) and ` +
        `${deletedSourceCount} orphaned source(s)`
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      'DEMO CLEANUP -> Failed:',
      error instanceof Error ? error.message : error
    );
  } finally {
    client.release();
  }
}
