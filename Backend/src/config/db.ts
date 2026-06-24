import 'dotenv/config';
import { Pool } from 'pg';
import type { QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = async <T extends object = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('DB Error:', err.message);
    } else {
      console.error('DB Error:', err);
    }
    throw err;
  }
};

export default pool;
