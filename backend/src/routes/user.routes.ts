import { Router } from 'express';
import { syncUser, getUserByEmail, deleteUserByEmail } from '../controllers/user.controller';

const router = Router();

router.post('/sync', syncUser);
router.get('/:email', getUserByEmail);
router.delete('/:email', deleteUserByEmail);

export default router;
