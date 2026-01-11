import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'your-secret-key') {
    console.error('WARNING: JWT_SECRET is not set or using default value. This is a security risk!');
  }

  jwt.verify(token, jwtSecret || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    // Validate user object structure
    if (!user || !user.userId) {
      return res.status(403).json({ message: 'Invalid token payload' });
    }

    // Validate userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(user.userId)) {
      return res.status(403).json({ message: 'Invalid user ID in token' });
    }

    req.user = user;
    next();
  });
};

// Helper function to validate MongoDB ObjectId
export const validateObjectId = (req, res, next) => {
  const id = req.params.id;
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};



