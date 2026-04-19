const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get or create a DM conversation
// @route   POST /api/conversations/dm
const getOrCreateDM = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;

    if (recipientId === senderId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot start conversation with yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId).select('username email avatar bio isOnline lastSeen');
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find existing DM
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [senderId, recipientId], $size: 2 },
    })
      .populate('participants', 'username email avatar bio isOnline lastSeen')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username avatar' } });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        isGroup: false,
      });
      conversation = await conversation.populate('participants', 'username email avatar bio isOnline lastSeen');
    }

    // Format with avatar URLs
    const formatted = {
      ...conversation.toObject(),
      participants: conversation.participants.map((p) => ({
        ...p.toObject ? p.toObject() : p,
        avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`,
      })),
    };

    res.json({ success: true, conversation: formatted });
  } catch (error) {
    console.error('Get/Create DM error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username email avatar bio isOnline lastSeen')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username avatar' } })
      .sort({ lastMessageAt: -1 });

    const formatted = conversations.map((conv) => ({
      ...conv.toObject(),
      participants: conv.participants.map((p) => ({
        ...(p.toObject ? p.toObject() : p),
        avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`,
      })),
      unreadCount: conv.unreadCount?.get(req.user._id.toString()) || 0,
    }));

    res.json({ success: true, conversations: formatted });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create group conversation
// @route   POST /api/conversations/group
const createGroup = async (req, res) => {
  try {
    const { groupName, participantIds, groupDescription } = req.body;

    if (!groupName?.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    if (!participantIds || participantIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Add at least 2 members to the group' });
    }

    const allParticipants = [...new Set([req.user._id.toString(), ...participantIds])];

    const conversation = await Conversation.create({
      participants: allParticipants,
      isGroup: true,
      groupName: groupName.trim(),
      groupDescription: groupDescription || '',
      admin: req.user._id,
      groupAvatar: req.file?.path || '',
    });

    // Create system message
    await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      content: `${req.user.username} created the group "${groupName}"`,
      type: 'system',
    });

    const populated = await conversation.populate('participants', 'username email avatar bio isOnline lastSeen');

    res.status(201).json({ success: true, conversation: populated });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add member to group
// @route   POST /api/conversations/:id/add-member
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation?.isGroup) {
      return res.status(400).json({ success: false, message: 'Not a group conversation' });
    }

    if (conversation.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only admin can add members' });
    }

    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already in group' });
    }

    conversation.participants.push(userId);
    await conversation.save();

    const user = await User.findById(userId).select('username');
    await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      content: `${req.user.username} added ${user.username} to the group`,
      type: 'system',
    });

    res.json({ success: true, message: 'Member added' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/conversations/:id/remove-member/:userId
const removeMember = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation?.isGroup) {
      return res.status(400).json({ success: false, message: 'Not a group conversation' });
    }

    const isAdmin = conversation.admin.toString() === req.user._id.toString();
    const isSelf = req.params.userId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    conversation.participants = conversation.participants.filter((p) => p.toString() !== req.params.userId);
    await conversation.save();

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get pinned messages in a conversation
// @route   GET /api/conversations/:id/pinned
const getPinnedMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.id,
      isPinned: true,
    }).populate('sender', 'username avatar');

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getOrCreateDM, getConversations, createGroup, addMember, removeMember, getPinnedMessages };
