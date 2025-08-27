import Message from '../models/Message.js';
import User from '../models/User.js';
import VideoCall from '../models/VideoCall.js';
import Room from '../models/Room.js';

const activeUsers = new Map();
const activeRooms = new Map();
const videoCalls = new Map();

export const handleSocketConnection = (socket, io) => {
  console.log(`User ${socket.user.username} connected`);
  
  // Store user connection
  activeUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user,
    rooms: new Set()
  });

  // Update user online status
  updateUserStatus(socket.userId, true);

  // Join user to their rooms
  socket.on('join-rooms', async (rooms) => {
    try {
      for (const roomId of rooms) {
        socket.join(roomId);
        activeUsers.get(socket.userId).rooms.add(roomId);
        
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, new Set());
        }
        activeRooms.get(roomId).add(socket.userId);
      }
      
      // Broadcast user online status to all rooms
      broadcastUserStatus(socket.userId, 'online');
    } catch (error) {
      console.error('Error joining rooms:', error);
    }
  });

  // Handle sending messages
  socket.on('send-message', async (messageData) => {
    try {
      const message = new Message({
        sender: socket.userId,
        content: messageData.content,
        room: messageData.room,
        messageType: messageData.messageType || 'text',
        fileUrl: messageData.fileUrl || '',
        fileName: messageData.fileName || '',
        fileSize: messageData.fileSize || 0,
        replyTo: messageData.replyTo || null
      });

      await message.save();
      await message.populate('sender', 'username avatar');
      
      if (messageData.replyTo) {
        await message.populate('replyTo');
      }

      // Broadcast message to room
      io.to(messageData.room).emit('new-message', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', ({ room, username }) => {
    socket.to(room).emit('user-typing', { userId: socket.userId, username });
  });

  socket.on('typing-stop', ({ room }) => {
    socket.to(room).emit('user-stop-typing', { userId: socket.userId });
  });

  // Handle message reactions
  socket.on('add-reaction', async ({ messageId, emoji }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      // Remove existing reaction from this user
      message.reactions = message.reactions.filter(
        reaction => !reaction.user.equals(socket.userId)
      );

      // Add new reaction
      message.reactions.push({
        user: socket.userId,
        emoji: emoji
      });

      await message.save();
      await message.populate('reactions.user', 'username avatar');

      io.to(message.room).emit('message-reaction-updated', {
        messageId,
        reactions: message.reactions
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  });

  // Handle video call initiation
  socket.on('initiate-video-call', async ({ roomId, callType = 'video' }) => {
    try {
      // Check if there's already an active call in this room
      if (videoCalls.has(roomId)) {
        socket.emit('call-error', { message: 'A call is already active in this room' });
        return;
      }

      // Create video call record
      const videoCall = new VideoCall({
        roomId,
        initiator: socket.userId,
        callType,
        participants: [{
          user: socket.userId
        }]
      });

      await videoCall.save();
      await videoCall.populate('initiator', 'username avatar');

      // Store active call
      videoCalls.set(roomId, {
        callId: videoCall._id,
        participants: new Map([[socket.userId, socket.id]]),
        offers: new Map(),
        answers: new Map()
      });

      // Join call room
      socket.join(`call-${roomId}`);

      // Notify room about incoming call
      socket.to(roomId).emit('incoming-call', {
        callId: videoCall._id,
        roomId,
        initiator: videoCall.initiator,
        callType
      });

      socket.emit('call-initiated', { callId: videoCall._id, roomId });
    } catch (error) {
      console.error('Error initiating video call:', error);
      socket.emit('call-error', { message: 'Failed to initiate call' });
    }
  });

  // Handle joining video call
  socket.on('join-video-call', async ({ callId, roomId }) => {
    try {
      const activeCall = videoCalls.get(roomId);
      if (!activeCall) {
        socket.emit('call-error', { message: 'Call not found' });
        return;
      }

      // Add participant to call
      activeCall.participants.set(socket.userId, socket.id);
      socket.join(`call-${roomId}`);

      // Update database
      await VideoCall.findByIdAndUpdate(callId, {
        $push: {
          participants: {
            user: socket.userId
          }
        }
      });

      // Notify existing participants
      socket.to(`call-${roomId}`).emit('participant-joined', {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar
      });

      // Send current participants to new joiner
      const participantIds = Array.from(activeCall.participants.keys());
      const participants = await User.find({ _id: { $in: participantIds } })
        .select('username avatar');

      socket.emit('call-joined', {
        callId,
        participants: participants.map(p => ({
          userId: p._id,
          username: p.username,
          avatar: p.avatar
        }))
      });
    } catch (error) {
      console.error('Error joining video call:', error);
      socket.emit('call-error', { message: 'Failed to join call' });
    }
  });

  // Handle WebRTC signaling
  socket.on('webrtc-offer', ({ roomId, targetUserId, offer }) => {
    const activeCall = videoCalls.get(roomId);
    if (!activeCall || !activeCall.participants.has(targetUserId)) return;

    const targetSocketId = activeCall.participants.get(targetUserId);
    io.to(targetSocketId).emit('webrtc-offer', {
      fromUserId: socket.userId,
      offer
    });
  });

  socket.on('webrtc-answer', ({ roomId, targetUserId, answer }) => {
    const activeCall = videoCalls.get(roomId);
    if (!activeCall || !activeCall.participants.has(targetUserId)) return;

    const targetSocketId = activeCall.participants.get(targetUserId);
    io.to(targetSocketId).emit('webrtc-answer', {
      fromUserId: socket.userId,
      answer
    });
  });

  socket.on('webrtc-ice-candidate', ({ roomId, targetUserId, candidate }) => {
    const activeCall = videoCalls.get(roomId);
    if (!activeCall || !activeCall.participants.has(targetUserId)) return;

    const targetSocketId = activeCall.participants.get(targetUserId);
    io.to(targetSocketId).emit('webrtc-ice-candidate', {
      fromUserId: socket.userId,
      candidate
    });
  });

  // Handle leaving video call
  socket.on('leave-video-call', ({ roomId }) => {
    handleLeaveVideoCall(socket, roomId);
  });

  // Handle ending video call (only initiator can end)
  socket.on('end-video-call', async ({ roomId }) => {
    try {
      const activeCall = videoCalls.get(roomId);
      if (!activeCall) return;

      // Check if user is the initiator
      const callRecord = await VideoCall.findById(activeCall.callId);
      if (!callRecord.initiator.equals(socket.userId)) {
        socket.emit('call-error', { message: 'Only the call initiator can end the call' });
        return;
      }

      await endVideoCall(roomId, io);
    } catch (error) {
      console.error('Error ending video call:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User ${socket.user.username} disconnected`);
    
    try {
      // Remove from active users
      const userData = activeUsers.get(socket.userId);
      if (userData) {
        // Leave all video calls
        for (const roomId of userData.rooms) {
          if (videoCalls.has(roomId)) {
            handleLeaveVideoCall(socket, roomId);
          }
        }
        
        activeUsers.delete(socket.userId);
      }

      // Update user offline status
      await updateUserStatus(socket.userId, false);
      broadcastUserStatus(socket.userId, 'offline');
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
};

// Helper functions
async function updateUserStatus(userId, isOnline) {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
}

function broadcastUserStatus(userId, status) {
  const userData = activeUsers.get(userId);
  if (!userData) return;

  for (const roomId of userData.rooms) {
    const roomUsers = activeRooms.get(roomId);
    if (roomUsers) {
      for (const roomUserId of roomUsers) {
        if (roomUserId !== userId) {
          const roomUserData = activeUsers.get(roomUserId);
          if (roomUserData) {
            io.to(roomUserData.socketId).emit('user-status-changed', {
              userId,
              status,
              username: userData.user.username
            });
          }
        }
      }
    }
  }
}

function handleLeaveVideoCall(socket, roomId) {
  const activeCall = videoCalls.get(roomId);
  if (!activeCall || !activeCall.participants.has(socket.userId)) return;

  // Remove participant
  activeCall.participants.delete(socket.userId);
  socket.leave(`call-${roomId}`);

  // Notify other participants
  socket.to(`call-${roomId}`).emit('participant-left', {
    userId: socket.userId,
    username: socket.user.username
  });

  // If no participants left, end the call
  if (activeCall.participants.size === 0) {
    endVideoCall(roomId);
  }
}

async function endVideoCall(roomId) {
  try {
    const activeCall = videoCalls.get(roomId);
    if (!activeCall) return;

    // Update database record
    const startTime = await VideoCall.findById(activeCall.callId).select('startedAt');
    const duration = Math.floor((Date.now() - startTime.startedAt.getTime()) / 1000);

    await VideoCall.findByIdAndUpdate(activeCall.callId, {
      status: 'ended',
      endedAt: new Date(),
      duration
    });

    // Notify all participants
    io.to(`call-${roomId}`).emit('call-ended', {
      callId: activeCall.callId,
      duration
    });

    // Clean up
    videoCalls.delete(roomId);
  } catch (error) {
    console.error('Error ending video call:', error);
  }
}