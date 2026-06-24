import { Request, Response, NextFunction } from 'express';

const isDev = process.env.NODE_ENV !== 'production';

const logger = {
  info: (msg: string) => {
    if (isDev) console.log(`[INFO] ${msg}`);
  },
};

export function loggingHandler(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info(`Completed ${req.method} ${req.url} status=${res.statusCode} time=${duration}ms`);
  });

  next();
}
