import express from 'express';
import {
    createTicket, getAllTickets, getMyTickets,
    updateTicketStatus, addReply
} from '../controllers/support.controller.js';
import { protect, adminObj } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createTicket);
router.get('/', protect, adminObj, getAllTickets);
router.get('/my-tickets', protect, getMyTickets);
router.put('/:id/status', protect, adminObj, updateTicketStatus);
router.post('/:id/reply', protect, addReply);

export default router;
