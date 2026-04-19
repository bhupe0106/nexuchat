const User = require('../models/User');
const Message = require('../models/Message');

// @desc    Search users
// @route   GET /api/users/search?q=query
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { blockedUsers: { $nin: [req.user._id] } },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        },
      ],
    })
      .select('username email avatar bio isOnline lastSeen')
      .limit(20);

    const usersWithAvatars = users.map((u) => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
      bio: u.bio,
      isOnline: u.isOnline,
      lastSeen: u.lastSeen,
    }));

    res.json({ success: true, users: usersWithAvatars });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
      blockedUsers: { $nin: [req.user._id] },
    })
      .select('username email avatar bio isOnline lastSeen')
      .sort({ isOnline: -1, username: 1 })
      .limit(50);

    const usersWithAvatars = users.map((u) => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
      bio: u.bio,
      isOnline: u.isOnline,
      lastSeen: u.lastSeen,
    }));

    res.json({ success: true, users: usersWithAvatars });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username email avatar bio isOnline lastSeen');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Star/unstar a message
// @route   POST /api/users/star/:messageId
const toggleStarMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const user = await User.findById(req.user._id);

    const isStarred = user.starredMessages.includes(messageId);

    if (isStarred) {
      user.starredMessages = user.starredMessages.filter((id) => id.toString() !== messageId);
    } else {
      user.starredMessages.push(messageId);
    }

    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      starred: !isStarred,
      message: isStarred ? 'Message unstarred' : 'Message starred',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get starred messages
// @route   GET /api/users/starred
const getStarredMessages = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'starredMessages',
      populate: { path: 'sender', select: 'username avatar' },
    });

    res.json({ success: true, messages: user.starredMessages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Block/unblock user
// @route   POST /api/users/block/:userId
const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);

    const isBlocked = user.blockedUsers.includes(userId);

    if (isBlocked) {
      user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== userId);
    } else {
      user.blockedUsers.push(userId);
    }

    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      blocked: !isBlocked,
      message: isBlocked ? 'User unblocked' : 'User blocked',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  searchUsers,
  getAllUsers,
  getUserById,
  toggleStarMessage,
  getStarredMessages,
  toggleBlockUser,
};
