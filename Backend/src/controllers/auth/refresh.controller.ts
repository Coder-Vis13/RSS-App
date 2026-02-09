import { verifyRefreshToken, signAccessToken, signRefreshToken } from "../../utils/jwt";
import { findUserByRefreshToken, saveRefreshToken } from "../../models/auth.model";
import { Request, Response } from 'express';


type RefreshRequest = Request & { cookies: { refresh?: string } };

export const refreshHandler = async (req: RefreshRequest, res: Response): Promise<void> => {
  const oldToken = req.cookies?.refresh;
  if (!oldToken) {
    res.sendStatus(401);
    return;
  }

  const storedUser = await findUserByRefreshToken(oldToken);
  if (!storedUser) {
    res.sendStatus(403);
    return;
  }

  const payload = verifyRefreshToken(oldToken);

  if (payload.userId !== storedUser.user_id) {
    res.sendStatus(403);
    return;
  }

  const newAccessToken = signAccessToken(payload.userId);
  const newRefreshToken = signRefreshToken(payload.userId);

  await saveRefreshToken(payload.userId, newRefreshToken);

  res.cookie("refresh", newRefreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: newAccessToken });
};
