import { query } from '../config/db';
import { getFirstRow, logAction, markAsCreated, QueryResult } from '../utils/helpers';

interface DBUser {
  user_id: number;
  name: string;
  email: string;
  password_hash?: string;
  created_at: string;
}

interface User extends DBUser {
  created: boolean;
}

type NewUser = Omit<DBUser, 'user_id' | 'created_at'>;

//create a new user
export const addUser = async (user: NewUser): Promise<User> => {
  //try to insert. if it exists, select it
  const insertResult: QueryResult<DBUser> = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING user_id, name, email, password_hash, created_at`,
    [user.name, user.email, user.password_hash]
  );
  const insertedUser = getFirstRow(insertResult);

  if (insertedUser) {
    logAction(`Registered new user with Email=${user.email}`);
    return markAsCreated(insertedUser);
  }

  // If email already exists, fetch existing user details
  const selectResult: QueryResult<DBUser> = await query(
    `SELECT user_id, name, email, created_at FROM users WHERE email = $1`,
    [user.email]
  );
  const existingUser = getFirstRow(selectResult);
  if (!existingUser) {
    throw new Error(`User with email ${user.email} not found`);
  }
  logAction(`Existing user with Email=${user.email}`);
  return { ...existingUser, created: false };
};
