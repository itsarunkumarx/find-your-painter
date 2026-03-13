import { Ticket } from '../models/Ticket.js';
import { createNotification } from './notification.controller.js';

// @desc    Create a new support ticket
// @route   POST /api/support
// @access  Private
export const createTicket = async (req, res) => {
    try {
        const { subject, message, type } = req.body;
        const ticket = await Ticket.create({
            user: req.user._id,
            subject,
            message,
            type
        });
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all tickets (Admin only)
// @route   GET /api/support
// @access  Private/Admin
export const getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find()
            .populate('user', 'name email profileImage')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user tickets
// @route   GET /api/support/my-tickets
// @access  Private
export const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update ticket status (Admin only)
// @route   PUT /api/support/:id/status
// @access  Private/Admin
export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });

        // Notify user
        await createNotification({
            user: ticket.user,
            type: 'system',
            title: 'Support Ticket Update',
            message: `Your ticket regarding "${ticket.subject}" has been marked as ${status}.`,
            icon: '🎫',
            io: req.io
        });

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add reply to ticket
// @route   POST /api/support/:id/reply
// @access  Private
export const addReply = async (req, res) => {
    try {
        const { message } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.replies.push({
            sender: req.user._id,
            message
        });

        // If admin replies, set status to in-review
        if (req.user.role === 'admin') {
            ticket.status = 'in-review';

            // Notify user
            await createNotification({
                user: ticket.user,
                type: 'system',
                title: 'New Support Reply',
                message: `An administrator has replied to your ticket: "${ticket.subject}"`,
                icon: '💬',
                io: req.io
            });
        }

        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
