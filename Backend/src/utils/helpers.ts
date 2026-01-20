//helper functions used in model and controller

import { Response } from 'express';
// import { QueryResult } from "pg";

export interface QueryResult<T> {
  rows: T[];
}

export function getFirstRow<T>(insertResult: QueryResult<T> | null | undefined): T | null {
  return insertResult && insertResult.rows && insertResult.rows.length > 0
    ? insertResult.rows[0]
    : null;
}

// logAction: logs a message with optional description
export function logAction(action: string, description: string = ''): void {
  const message = description ? `SUCCESS: ${action} | ${description}` : `SUCCESS: ${action}`;
  console.info(message);
}

// markAsCreated: marks an object as created
export function markAsCreated<T>(obj: T): T & { created: true } {
  return { ...obj, created: true };
}

// handleError: handles Express errors
export function handleError(
  res: Response,
  error: unknown,
  status: number = 500,
  msg: string = 'Internal server error'
): Response {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error(`ERROR: ${msg}: ${errorMsg}`);
  return res.status(status).json({ error: msg });
}
