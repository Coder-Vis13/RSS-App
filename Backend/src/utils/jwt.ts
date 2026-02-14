//create and verify tokens

import jwt = require('jsonwebtoken');
import { ENV } from '../config/env';
import { AUTH_CONFIG } from '../config/auth.config';

export interface JwtPayload {
  userId: number;
}

export function signAccessToken(userId: number): string {
  return jwt.sign({ userId }, ENV.ACCESS_TOKEN_SECRET, {
    expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function signRefreshToken(userId: number): string {
  return jwt.sign({ userId }, ENV.REFRESH_TOKEN_SECRET, {
    expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, ENV.ACCESS_TOKEN_SECRET);
  assertJwtPayload(payload);
  return payload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const payload = jwt.verify(token, ENV.REFRESH_TOKEN_SECRET);
  assertJwtPayload(payload);
  return payload;
}

function assertJwtPayload(payload: unknown): asserts payload is JwtPayload {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('userId' in payload) ||
    typeof (payload as any).userId !== 'number'
  ) {
    throw new Error('Invalid JWT payload');
  }
}
