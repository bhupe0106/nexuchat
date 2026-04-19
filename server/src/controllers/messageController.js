const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false,
    })
      .populate('sender', 'username avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversationId, 'readBy.user': { $ne: req.user._id } },
      { $addToSet: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    // Reset unread count
    const unreadKey = `unreadCount.${req.user._id}`;
    await Conversation.findByIdAndUpdate(conversationId, { $set: { [unreadKey]: 0 } });

    const formattedMessages = messages.reverse().map((m) => ({
      ...m.toObject(),
      sender: {
        ...m.sender.toObject(),
        avatar: m.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender.username}`,
      },
    }));

    res.json({ success: true, messages: formattedMessages, page: parseInt(page) });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Send a message
// @route   POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', replyTo } = req.body;

    // Verify participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messageData = {
      conversationId,
      sender: req.user._id,
      content: content || '',
      type,
    };

    if (replyTo) messageData.replyTo = replyTo;

    // Handle file uploads
    if (req.file) {
      messageData.fileUrl = req.file.path;
      messageData.fileName = req.file.originalname;
      messageData.fileSize = req.file.size;
      messageData.mimeType = req.file.mimetype;

      if (req.file.mimetype.startsWith('image/')) {
        messageData.type = 'image';
      } else if (req.file.mimetype.startsWith('audio/')) {
        messageData.type = 'audio';
      } else {
        messageData.type = 'file';
      }
    }

    const message = await Message.create(messageData);
    await message.populate('sender', 'username avatar');

    // Update conversation
    const unreadKey = `unreadCount.${req.user._id}`;
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      $inc: conversation.participants
        .filter((p) => p.toString() !== req.user._id.toString())
        .reduce((acc, p) => {
          acc[`unreadCount.${p}`] = 1;
          return acc;
        }, {}),
    });

    const formatted = {
      ...message.toObject(),
      sender: {
        ...message.sender.toObject(),
        avatar: message.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender.username}`,
      },
    };

    res.status(201).json({ success: true, message: formatted });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, sender: req.user._id });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found or unauthorized' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await message.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search?q=query&conversationId=id
const searchMessages = async (req, res) => {
  try {
    const { q, conversationId } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const query = {
      content: { $regex: q, $options: 'i' },
      isDeleted: false,
    };

    if (conversationId) {
      query.conversationId = conversationId;
    } else {
      // Find all conversations user is in
      const conversations = await Conversation.find({ participants: req.user._id }).select('_id');
      query.conversationId = { $in: conversations.map((c) => c._id) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username avatar')
      .populate('conversationId', 'isGroup groupName participants')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Pin/unpin a message
// @route   POST /api/messages/:id/pin
const togglePinMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    // Verify user is in conversation
    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      participants: req.user._id,
    });
    if (!conversation) return res.status(403).json({ success: false, message: 'Access denied' });

    message.isPinned = !message.isPinned;
    await message.save();

    // Update conversation pinned messages
    if (message.isPinned) {
      await Conversation.findByIdAndUpdate(message.conversationId, {
        $addToSet: { pinnedMessages: message._id },
      });
    } else {
      await Conversation.findByIdAndUpdate(message.conversationId, {
        $pull: { pinnedMessages: message._id },
      });
    }

    res.json({ success: true, isPinned: message.isPinned });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:id/react
const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Not found' });

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter((r) => r.user.toString() !== req.user._id.toString());

    // Add new reaction (unless it's the same emoji = toggle off)
    const existing = message.reactions.find((r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji);
    if (!existing) {
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();
    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMessages, sendMessage, deleteMessage, searchMessages, togglePinMessage, reactToMessage };
