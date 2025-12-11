import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAction } from '../utils/activityLogger.js';

const router = express.Router();

// Current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Error fetching current user' });
  }
});

// Update profile (profile image or full name)
router.patch('/me/profile', authenticateToken, async (req, res) => {
  try {
    const { profileImage, fullName, isActive } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (profileImage !== undefined) {
      user.profileImage = profileImage || null;
    }
    if (fullName) {
      user.fullName = fullName;
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'user_profile_update',
      targetType: 'user',
      targetId: user._id.toString(),
      message: `Profil güncellendi${fullName ? ` (ad: ${fullName})` : ''}`,
    });

    res.json(userResponse);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Update password
router.patch('/me/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'user_password_update',
      targetType: 'user',
      targetId: user._id.toString(),
      message: 'Şifre güncellendi',
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Create a new user (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { username, email, password, fullName, role, isActive } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const newUser = new User({
      username,
      email,
      password,
      fullName,
      role: role || 'user',
      isActive: isActive !== undefined ? !!isActive : true,
    });

    await newUser.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;

    await logAction({
      actorId: admin._id,
      actorName: admin.fullName || admin.username,
      action: 'user_create',
      targetType: 'user',
      targetId: newUser._id.toString(),
      message: `Yeni kullanıcı eklendi: ${newUser.username} (${newUser.role})`,
    });

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

export default router;



