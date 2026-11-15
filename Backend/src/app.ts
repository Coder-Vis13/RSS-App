import express, { Request, Response, NextFunction } from 'express';
import router from './routes';
import { loggingHandler } from './middleware/logging';
import { corsHandler } from './middleware/cors';
import { routeNotFound } from './middleware/route-not-found';
import cookieParser from 'cookie-parser';

export const createApp = () => {
  const app = express();

  app.use(corsHandler);
  app.use(express.json());
  app.use(cookieParser());
  app.use(loggingHandler);

  app.get('/', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      message: 'RSS Backend is running',
    });
  });

  app.use('/', router);
  app.use(routeNotFound);

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  return app;
};
