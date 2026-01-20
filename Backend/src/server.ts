import express, { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import router from './routes/routes';
import './cron';
import { loggingHandler } from './middleware/loggingHandler';
import { Feed } from 'podcast';
import { corsHandler } from './middleware/corsHandler';
import { routeNotFound } from './middleware/routeNotFound';

const PORT = process.env.PORT;

const app = express();

app.post('/_debug', (req, res) => {
  res.json({ ok: true, body: req.body, headers: req.headers });
});

app.use(corsHandler);

app.use(express.json());

app.use(loggingHandler);

app.get('/ping', (_, res) => {
  res.send('ok');
});

app.use('/', router);

app.use(routeNotFound);

//Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
