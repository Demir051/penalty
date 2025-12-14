import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Rate limiting for login
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check rate limiting
    const ip = req.ip || req.connection.remoteAddress;
    const attempts = loginAttempts.get(ip) || { count: 0, lockoutUntil: 0 };
    
    if (attempts.lockoutUntil > Date.now()) {
      const minutesLeft = Math.ceil((attempts.lockoutUntil - Date.now()) / 60000);
      return res.status(429).json({ 
        message: `Too many login attempts. Try again in ${minutesLeft} minute(s).` 
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log(`Login attempt failed: User not found - ${username}`);
      // Increment failed attempts
      attempts.count++;
      if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        attempts.lockoutUntil = Date.now() + LOCKOUT_TIME;
        attempts.count = 0;
      }
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log(`Login attempt failed: Invalid password for user - ${username}`);
      // Increment failed attempts
      attempts.count++;
      if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        attempts.lockoutUntil = Date.now() + LOCKOUT_TIME;
        attempts.count = 0;
      }
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset attempts on successful login
    loginAttempts.delete(ip);

    // Update last active
    user.lastActiveAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update last active
    user.lastActiveAt = new Date();
    await user.save();

    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
