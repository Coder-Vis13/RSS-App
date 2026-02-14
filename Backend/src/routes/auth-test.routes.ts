import { Router } from 'express';
import { verifyJWT } from '../middleware/verifyJWT';

const router = Router();

// no auth
router.get('/public', (_req, res) => {
  res.json({ ok: true });
});

// protected
router.get('/protected', verifyJWT, (req, res) => {
  res.json({
    ok: true,
    user: req.user,
  });
});

export default router;
