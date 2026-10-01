import express from 'express';
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  replyTicket
} from '../controllers/supportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createTicket);
router.get('/my', getMyTickets);
router.get('/all', authorize('admin'), getAllTickets);
router.patch('/:id/reply', authorize('admin'), replyTicket);

export default router;
