import { Request, Response, NextFunction } from 'express';

/**
 * Ensures downstream handlers use authenticated user id,
 * not any client-supplied userId in params/body.
 */
export function attachAuthenticatedUser(req: Request, res: Response, next: NextFunction): void {
  const authenticatedUserId = req.user?.userId;

  if (!authenticatedUserId) {
    res.sendStatus(401);
    return;
  }

  if (req.params && 'userId' in req.params) {
    req.params.userId = String(authenticatedUserId);
  }

  if (req.body && typeof req.body === 'object') {
    (req.body as Record<string, unknown>).userId = authenticatedUserId;
  }

  next();
}