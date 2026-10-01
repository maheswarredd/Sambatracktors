import express from 'express';
import { registerUser, loginUser, getMe, updateLanguage } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.patch('/language', protect, updateLanguage);

export default router;
