import express from 'express';
import Log from '../models/Log.js';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get logs (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const logs = await Log.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

export default router;

