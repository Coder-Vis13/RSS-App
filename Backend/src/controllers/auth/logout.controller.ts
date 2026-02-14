import { clearRefreshToken } from '../../models/auth.model';
import { Request, Response } from 'express';

export const logoutHandler = async (req: Request, res: Response) => {
  const token = req.cookies?.refresh;
  if (token) {
    await clearRefreshToken(token);
  }

  res.clearCookie('refresh', {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
  });

  res.sendStatus(204);
};
