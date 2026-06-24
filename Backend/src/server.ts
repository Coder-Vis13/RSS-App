import express, { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import router from './routes';
import './cron';
import { loggingHandler } from './middleware/logging';
import { corsHandler } from './middleware/cors';
import { routeNotFound } from './middleware/route-not-found';
import cookieParser from 'cookie-parser';

const PORT = process.env.PORT;

const app = express();

app.use(corsHandler);

app.use(express.json());

app.use(cookieParser());

app.use(loggingHandler);

app.use('/', router);

app.use(routeNotFound);

//Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
