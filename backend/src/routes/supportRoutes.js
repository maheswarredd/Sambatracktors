import express from 'express';
import {
  createTicket,
  getAllTicketsAdmin,
  getMyTickets,
  processRefundAction,
  replyToTicket
} from '../controllers/supportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createTicket);
router.get('/my-tickets', getMyTickets);

router.get('/admin/all', authorizeRoles('admin'), getAllTicketsAdmin);
router.post('/:id/reply', authorizeRoles('admin'), replyToTicket);
router.put('/:id/refund-action', authorizeRoles('admin'), processRefundAction);

export default router;
