import { Request, Response } from 'express';
import { handleError } from '../utils/helpers';
import {
  createGuestDemoSession,
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_TTL_MS,
} from '../services/demo-session.service';

export async function createDemoSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await createGuestDemoSession(req.cookies?.demo_session);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(DEMO_SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: DEMO_SESSION_TTL_MS,
      path: '/',
    });

    res.status(201).json({ userId: session.userId });
  } catch (error) {
    handleError(res, error, 500, 'Could not start demo session');
  }
}
