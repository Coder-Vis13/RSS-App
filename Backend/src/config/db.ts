import 'dotenv/config';
import { Pool } from 'pg';
import type { QueryResult } from 'pg';

const connectionString =
  process.env.NODE_ENV === 'test' ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
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
