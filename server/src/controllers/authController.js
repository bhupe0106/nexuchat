const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatarUrl,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        preferredLanguage: user.preferredLanguage,
        theme: user.theme,
        notifications: user.notifications,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatarUrl,
        bio: user.bio,
        isOnline: true,
        lastSeen: user.lastSeen,
        preferredLanguage: user.preferredLanguage,
        theme: user.theme,
        notifications: user.notifications,
        starredMessages: user.starredMessages,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('starredMessages');
    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatarUrl,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        preferredLanguage: user.preferredLanguage,
        theme: user.theme,
        notifications: user.notifications,
        starredMessages: user.starredMessages,
        friends: user.friends,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { bio, preferredLanguage, theme, notifications, username } = req.body;
    const updateData = {};

    if (bio !== undefined) updateData.bio = bio;
    if (preferredLanguage) updateData.preferredLanguage = preferredLanguage;
    if (theme) updateData.theme = theme;
    if (notifications !== undefined) updateData.notifications = notifications;
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
      updateData.username = username;
    }

    if (req.file) {
      updateData.avatar = req.file.path;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });

    res.json({
      success: true,
      message: 'Profile updated',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatarUrl,
        bio: user.bio,
        preferredLanguage: user.preferredLanguage,
        theme: user.theme,
        notifications: user.notifications,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
      socketId: null,
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe, updateProfile, logout };
