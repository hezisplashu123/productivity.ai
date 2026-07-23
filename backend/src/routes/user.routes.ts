import { Router } from 'express';
import { syncUser, getUserByEmail, deleteUserByEmail } from '../controllers/user.controller';

import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/sync', syncUser);
router.get('/:email', requireAuth, getUserByEmail);
router.delete('/:email', requireAuth, deleteUserByEmail);

export default router;
