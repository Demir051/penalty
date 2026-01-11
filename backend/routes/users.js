import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { authenticateToken, validateObjectId } from '../middleware/auth.js';
import { logAction } from '../utils/activityLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads/profile-images directory if it doesn't exist
const profileImagesDir = path.join(__dirname, '../uploads/profile-images');
if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize file extension to prevent path traversal
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    // Only allow image extensions
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const finalExt = allowedExts.includes(ext) ? ext : '.jpg';
    // Ensure userId is valid ObjectId string (no path traversal)
    // req.user is set by authenticateToken middleware, so it's safe to use
    const userId = req.user && req.user.userId 
      ? String(req.user.userId).replace(/[^a-f0-9]/g, '').slice(0, 24)
      : 'unknown';
    cb(null, `profile-${userId}-${uniqueSuffix}${finalExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

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

// Upload profile image
router.post('/me/upload-profile-image', authenticateToken, (req, res, next) => {
  upload.single('profileImage')(req, res, (err) => {
    if (err) {
      if (err.message === 'Only image files are allowed') {
        return res.status(400).json({ message: 'Sadece resim dosyaları yüklenebilir' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Dosya boyutu 5MB\'dan küçük olmalıdır' });
      }
      return res.status(400).json({ message: err.message || 'Dosya yükleme hatası' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Resim dosyası seçilmedi' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      // Delete uploaded file if user not found
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile image if exists
    if (user.profileImage && user.profileImage.includes('/uploads/profile-images/')) {
      const oldImagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (err) {
          console.error('Error deleting old profile image:', err);
        }
      }
    }

    // Save new profile image URL
    const imageUrl = `/uploads/profile-images/${req.file.filename}`;
    user.profileImage = imageUrl;
    user.lastActiveAt = new Date();
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'user_profile_image_upload',
      targetType: 'user',
      targetId: user._id.toString(),
      message: 'Profil resmi güncellendi',
    });

    res.json({ profileImage: imageUrl, user: userResponse });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting uploaded file on error:', err);
      }
    }
    res.status(500).json({ message: 'Profil resmi yüklenirken bir hata oluştu' });
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
    
    // Sanitize inputs
    if (profileImage !== undefined) {
      if (profileImage && typeof profileImage === 'string') {
        // Basic URL validation and sanitization
        const sanitizedUrl = profileImage.trim().slice(0, 500); // Max length
        // Only allow http/https URLs or relative paths starting with /uploads/
        if (sanitizedUrl.startsWith('http://') || sanitizedUrl.startsWith('https://') || sanitizedUrl.startsWith('/uploads/') || sanitizedUrl.startsWith('data:image/')) {
          user.profileImage = sanitizedUrl;
        } else {
          return res.status(400).json({ message: 'Invalid profile image URL format' });
        }
      } else {
        user.profileImage = null;
      }
    }
    if (fullName !== undefined) {
      if (fullName && typeof fullName === 'string') {
        // Sanitize full name (remove special characters, limit length)
        const sanitized = fullName.trim().slice(0, 100).replace(/[<>]/g, '');
        if (sanitized.length > 0) {
          user.fullName = sanitized;
        } else {
          return res.status(400).json({ message: 'Full name cannot be empty' });
        }
      } else {
        return res.status(400).json({ message: 'Full name must be a string' });
      }
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
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { username, email, password, fullName, role } = req.body;

    // Input validation and sanitization
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Sanitize and validate inputs
    const sanitizedUsername = String(username).trim().slice(0, 50).replace(/[<>]/g, '');
    const sanitizedEmail = String(email).trim().toLowerCase().slice(0, 100);
    const sanitizedFullName = String(fullName).trim().slice(0, 100).replace(/[<>]/g, '');
    
    if (!sanitizedUsername || sanitizedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!sanitizedFullName || sanitizedFullName.length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Validate role
    const allowedRoles = ['admin', 'ceza', 'uye'];
    const userRole = role && typeof role === 'string' && allowedRoles.includes(role) ? role : 'uye';

    const existingUser = await User.findOne({
      $or: [{ username: sanitizedUsername }, { email: sanitizedEmail }],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const newUser = new User({
      username: sanitizedUsername,
      email: sanitizedEmail,
      password,
      fullName: sanitizedFullName,
      role: userRole,
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
router.patch('/:id/role', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { role } = req.body;
    if (!role || typeof role !== 'string') {
      return res.status(400).json({ message: 'Role is required and must be a string' });
    }
    
    // Validate role to prevent injection
    const allowedRoles = ['admin', 'ceza', 'uye'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
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
router.delete('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
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
