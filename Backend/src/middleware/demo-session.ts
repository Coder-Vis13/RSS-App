import { Request, Response, NextFunction } from 'express';
import { findActiveDemoSession } from '../models/demo-session.model';
import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_TTL_MS,
  hashDemoSessionToken,
} from '../services/demo-session.service';
import { verifyJWT } from './verifyJWT';

const DEMO_SESSION_CREATION_LIMIT = 5;
const DEMO_SESSION_CREATION_WINDOW_MS = 10 * 60 * 1000;
const DEMO_SOURCE_ADD_LIMIT = 5;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const demoSessionCreationAttempts = new Map<string, RateLimitEntry>();
const demoSourceAdditions = new Map<string, RateLimitEntry>();

function consumeRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;

  current.count += 1;
  return true;
}

export function limitDemoSessionCreation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientKey = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const allowed = consumeRateLimit(
    demoSessionCreationAttempts,
    clientKey,
    DEMO_SESSION_CREATION_LIMIT,
    DEMO_SESSION_CREATION_WINDOW_MS
  );

  if (!allowed) {
    res.status(429).json({ message: 'Too many demo sessions. Please try again later.' });
    return;
  }

  next();
}

export function consumeDemoSourceAddition(
  req: Pick<Request, 'demoMode' | 'cookies'>
): boolean {
  if (!req.demoMode) return true;

  const sessionToken = req.cookies?.[DEMO_SESSION_COOKIE];
  if (!sessionToken) return false;

  const sessionKey = hashDemoSessionToken(sessionToken);
  return consumeRateLimit(
    demoSourceAdditions,
    sessionKey,
    DEMO_SOURCE_ADD_LIMIT,
    DEMO_SESSION_TTL_MS
  );
}

/**
 * Uses normal JWT authentication when a bearer token is present. Otherwise,
 * it authenticates the request with the temporary demo-session cookie.
 */
export async function verifyDemoSessionOrJWT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    verifyJWT(req, res, next);
    return;
  }

  const sessionToken = req.cookies?.[DEMO_SESSION_COOKIE];
  if (!sessionToken) {
    res.sendStatus(401);
    return;
  }

  try {
    const session = await findActiveDemoSession(hashDemoSessionToken(sessionToken));

    if (!session) {
      res.sendStatus(401);
      return;
    }

    req.user = { userId: session.user_id };
    req.demoMode = true;
    next();
  } catch (error) {
    next(error);
  }
}
