import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAction } from '../utils/activityLogger.js';

const router = express.Router();

// Update last active time
router.post('/me/ping', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { lastActiveAt: new Date() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating activity' });
  }
});

// Current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Update last active
    user.lastActiveAt = new Date();
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Error fetching current user' });
  }
});

// Update profile (profile image or full name)
router.patch('/me/profile', authenticateToken, async (req, res) => {
  try {
    const { profileImage, fullName } = req.body;
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
    user.lastActiveAt = new Date();
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
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
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
    user.lastActiveAt = new Date();
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

// Get all users (all authenticated users can see)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ fullName: 1 });
    
    // Mark users as active if they were active in last 5 minutes
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const usersWithActivity = users.map(user => {
      const userObj = user.toObject();
      userObj.isCurrentlyActive = user.lastActiveAt && new Date(user.lastActiveAt) > fiveMinutesAgo;
      return userObj;
    });
    
    res.json(usersWithActivity);
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

    const { username, email, password, fullName, role } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!['admin', 'ceza', 'uye'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
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
      role: role || 'uye',
      isActive: true,
      lastActiveAt: new Date(),
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

// Update user role (admin only)
router.patch('/:id/role', authenticateToken, async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }
    
    if (!['admin', 'ceza', 'uye'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (targetUser._id.toString() === admin._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logAction({
      actorId: admin._id,
      actorName: admin.fullName || admin.username,
      action: 'user_role_update',
      targetType: 'user',
      targetId: targetUser._id.toString(),
      message: `${targetUser.fullName || targetUser.username} kullanıcısının rolü ${oldRole} → ${role} olarak değiştirildi`,
    });

    const userResponse = targetUser.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (targetUser._id.toString() === admin._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await logAction({
      actorId: admin._id,
      actorName: admin.fullName || admin.username,
      action: 'user_delete',
      targetType: 'user',
      targetId: targetUser._id.toString(),
      message: `Kullanıcı silindi: ${targetUser.fullName || targetUser.username} (${targetUser.role})`,
    });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

export default router;
