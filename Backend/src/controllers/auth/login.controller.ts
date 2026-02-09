import bcrypt from "bcrypt";
import { Request, Response } from 'express';
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import { findUserByEmail, saveRefreshToken } from "../../models/auth.model";



interface LoginRequestBody {
  email: string;
  password: string;
}



export const loginHandler = async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    res.sendStatus(401);
    return;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    res.sendStatus(401);
    return;
  }

  const accessToken = signAccessToken(user.user_id);
  const refreshToken = signRefreshToken(user.user_id);

  await saveRefreshToken(user.user_id, refreshToken);

  res.cookie("refresh", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken });
};
