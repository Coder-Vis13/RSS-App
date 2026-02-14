import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { createUser, findUserByEmail, saveRefreshToken } from '../../models/auth.model';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';

const SALT_ROUNDS = 10;

export const registerHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await createUser(email, passwordHash);

  const accessToken = signAccessToken(user.user_id);
  const refreshToken = signRefreshToken(user.user_id);

  await saveRefreshToken(user.user_id, refreshToken);

  res.cookie('refresh', refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true, // proxy through https/temp disable for localhost
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({ accessToken });
};
