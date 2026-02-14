// src/routes/debug.routes.ts
import { Router } from 'express';
import { signAccessToken } from '../utils/jwt';

const router = Router();

router.get('/token/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const token = signAccessToken(userId);
  res.json({ token });
});

export default router;
