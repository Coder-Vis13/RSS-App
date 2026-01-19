 
import 'dotenv/config';
import { Pool } from "pg";
import type { QueryResult } from "pg";


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432, //5432 -> the default port for PostgreSQL
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});


export const query = async <T extends object = any> (text: string, params?: any[]): Promise<QueryResult<T>> => {
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
