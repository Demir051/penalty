import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Rate limiting for login - More lenient
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 10; // Increased from 5
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes (reduced from 15)

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation and sanitization
    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Username and password are required and must be strings' });
    }

    // Sanitize inputs (prevent injection attacks)
    const sanitizedUsername = username.trim().slice(0, 50).replace(/[<>]/g, '');
    if (!sanitizedUsername || sanitizedUsername.length < 3) {
      return res.status(400).json({ message: 'Invalid username format' });
    }

    if (password.length < 6 || password.length > 100) {
      return res.status(400).json({ message: 'Invalid password length' });
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

    const user = await User.findOne({ username: sanitizedUsername });
    if (!user) {
      // Increment failed attempts
      attempts.count++;
      if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        attempts.lockoutUntil = Date.now() + LOCKOUT_TIME;
        attempts.count = 0;
      }
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
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

    // Check JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      console.error('WARNING: JWT_SECRET is not set or using default value. This is a security risk!');
    }

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username, role: user.role },
      jwtSecret || 'your-secret-key',
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

    if (!token || typeof token !== 'string') {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret);

    // Validate decoded token structure
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Update last active
    user.lastActiveAt = new Date();
    await user.save();

    res.json({ user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
