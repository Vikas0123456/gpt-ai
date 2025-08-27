import express from 'express';
import Room from '../models/Room.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all rooms for user
router.get('/', authenticate, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { type: 'public' },
        { 'members.user': req.userId },
        { creator: req.userId }
      ]
    })
    .populate('creator', 'username avatar')
    .populate('members.user', 'username avatar')
    .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new room
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, type = 'public' } = req.body;

    const room = new Room({
      name,
      description,
      type,
      creator: req.userId,
      members: [{
        user: req.userId,
        role: 'admin'
      }]
    });

    await room.save();
    await room.populate('creator', 'username avatar');
    await room.populate('members.user', 'username avatar');

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join room
router.post('/:roomId/join', authenticate, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if already a member
    const isMember = room.members.some(member => 
      member.user.toString() === req.userId
    );

    if (isMember) {
      return res.status(400).json({ error: 'Already a member of this room' });
    }

    room.members.push({
      user: req.userId,
      role: 'member'
    });

    await room.save();
    await room.populate('members.user', 'username avatar');

    res.json({ message: 'Joined room successfully', room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave room
router.post('/:roomId/leave', authenticate, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    room.members = room.members.filter(member => 
      member.user.toString() !== req.userId
    );

    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
