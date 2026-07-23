import { Router } from 'express';
import {
  ensureProfileHandler,
  getNextPrompt,
  recordSwipe,
  resetWeights,
} from '../controllers/profile.controller';

import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/ensure', requireAuth, ensureProfileHandler);
router.post('/next-prompt', requireAuth, getNextPrompt);
router.post('/:profileId/swipe', requireAuth, recordSwipe);
router.post('/:profileId/reset-weights', requireAuth, resetWeights);

export default router;
