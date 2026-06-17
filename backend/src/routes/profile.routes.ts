import { Router } from 'express';
import {
  ensureProfileHandler,
  getNextPrompt,
  recordSwipe,
  resetWeights,
} from '../controllers/profile.controller';

const router = Router();

router.post('/ensure', ensureProfileHandler);
router.post('/next-prompt', getNextPrompt);
router.post('/:profileId/swipe', recordSwipe);
router.post('/:profileId/reset-weights', resetWeights);

export default router;
