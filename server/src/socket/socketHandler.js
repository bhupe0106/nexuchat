const { socketAuth } = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {
  // Auth middleware
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    // Register user as online
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: new Date(),
    });

    // Join all user's conversation rooms
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    conversations.forEach((conv) => socket.join(conv._id.toString()));

    // Broadcast online status
    socket.broadcast.emit('user:status', { userId, isOnline: true });

    // ─── MESSAGING ──────────────────────────────────────────────────────────

    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type = 'text', replyTo, tempId } = data;

        // Verify participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });
        if (!conversation) return;

        const message = await Message.create({
          conversationId,
          sender: userId,
          content,
          type,
          replyTo: replyTo || null,
        });

        await message.populate('sender', 'username avatar');

        const formatted = {
          ...message.toObject(),
          tempId,
          sender: {
            ...message.sender.toObject(),
            avatar:
              message.sender.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender.username}`,
          },
        };

        // Update conversation last message & unread counts
        const unreadUpdates = {};
        conversation.participants
          .filter((p) => p.toString() !== userId)
          .forEach((p) => {
            unreadUpdates[`unreadCount.${p}`] = 1;
          });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastMessageAt: new Date(),
          $inc: unreadUpdates,
        });

        // Emit to everyone in the room
        io.to(conversationId).emit('message:new', formatted);

        // Send push notification to offline users in conversation
        conversation.participants
          .filter((p) => p.toString() !== userId)
          .forEach((participantId) => {
            const participantSocketId = onlineUsers.get(participantId.toString());
            if (participantSocketId) {
              io.to(participantSocketId).emit('notification:message', {
                conversationId,
                sender: { username: socket.user.username, avatar: socket.user.avatar },
                content: content?.substring(0, 60) || `Sent a ${type}`,
              });
            }
          });
      } catch (error) {
        console.error('Socket message:send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Message with file (emitted after REST upload)
    socket.on('message:file', async (data) => {
      const { conversationId, messageId } = data;
      try {
        const message = await Message.findById(messageId).populate('sender', 'username avatar');
        if (message) {
          io.to(conversationId).emit('message:new', {
            ...message.toObject(),
            sender: {
              ...message.sender.toObject(),
              avatar:
                message.sender.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender.username}`,
            },
          });
        }
      } catch (err) {
        console.error('Socket message:file error:', err);
      }
    });

    socket.on('message:delete', async (data) => {
      const { messageId, conversationId } = data;
      try {
        const message = await Message.findOne({ _id: messageId, sender: userId });
        if (message) {
          message.isDeleted = true;
          message.content = 'This message was deleted';
          await message.save();
          io.to(conversationId).emit('message:deleted', { messageId });
        }
      } catch (err) {
        console.error('Socket delete error:', err);
      }
    });

    socket.on('message:react', async (data) => {
      const { messageId, conversationId, emoji } = data;
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        message.reactions = message.reactions.filter((r) => r.user.toString() !== userId);
        message.reactions.push({ user: userId, emoji });
        await message.save();

        io.to(conversationId).emit('message:reacted', {
          messageId,
          reactions: message.reactions,
        });
      } catch (err) {
        console.error('Socket react error:', err);
      }
    });

    // ─── TYPING INDICATORS ──────────────────────────────────────────────────

    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:start', {
        userId,
        username: socket.user.username,
        conversationId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:stop', { userId, conversationId });
    });

    // ─── READ RECEIPTS ───────────────────────────────────────────────────────

    socket.on('messages:read', async ({ conversationId }) => {
      try {
        await Message.updateMany(
          { conversationId, 'readBy.user': { $ne: userId } },
          { $addToSet: { readBy: { user: userId, readAt: new Date() } } }
        );
        const key = `unreadCount.${userId}`;
        await Conversation.findByIdAndUpdate(conversationId, { $set: { [key]: 0 } });
        socket.to(conversationId).emit('messages:read', { userId, conversationId });
      } catch (err) {
        console.error('Socket read error:', err);
      }
    });

    // ─── GROUP MANAGEMENT ───────────────────────────────────────────────────

    socket.on('group:join', ({ conversationId }) => {
      socket.join(conversationId);
    });

    socket.on('group:leave', ({ conversationId }) => {
      socket.leave(conversationId);
    });

    // ─── VOICE / VIDEO SIGNALING ─────────────────────────────────────────────

    socket.on('call:initiate', ({ recipientId, conversationId, callType }) => {
      const recipientSocket = onlineUsers.get(recipientId);
      if (recipientSocket) {
        io.to(recipientSocket).emit('call:incoming', {
          callerId: userId,
          callerName: socket.user.username,
          callerAvatar: socket.user.avatar,
          conversationId,
          callType,
        });
      } else {
        socket.emit('call:unavailable', { recipientId });
      }
    });

    socket.on('call:answer', ({ callerId, accepted }) => {
      const callerSocket = onlineUsers.get(callerId);
      if (callerSocket) {
        io.to(callerSocket).emit('call:answered', { accepted, responderId: userId });
      }
    });

    socket.on('call:end', ({ otherUserId }) => {
      const otherSocket = onlineUsers.get(otherUserId);
      if (otherSocket) {
        io.to(otherSocket).emit('call:ended', { by: userId });
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        socketId: null,
        lastSeen: new Date(),
      });

      socket.broadcast.emit('user:status', {
        userId,
        isOnline: false,
        lastSeen: new Date(),
      });
    });

    // ─── PING / HEARTBEAT ────────────────────────────────────────────────────

    socket.on('ping', () => socket.emit('pong'));
  });

  return io;
};

module.exports = { initSocket, onlineUsers };
