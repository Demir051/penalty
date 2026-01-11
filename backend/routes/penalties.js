import express from 'express';
import Penalty from '../models/Penalty.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAction } from '../utils/activityLogger.js';
import User from '../models/User.js';

// Helper function to validate and sanitize date
const validateDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
};

// Helper function to validate count
const validateCount = (count) => {
  if (typeof count !== 'number' || isNaN(count) || !isFinite(count)) {
    return null;
  }
  if (count < 0) {
    return null;
  }
  // Max reasonable count (prevent integer overflow)
  if (count > 1000000) {
    return null;
  }
  return Math.round(count);
};

const router = express.Router();

// Get penalties for a date range
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      const start = validateDate(startDate);
      const end = validateDate(endDate);
      
      if (!start || !end) {
        return res.status(400).json({ message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' });
      }
      
      if (start > end) {
        return res.status(400).json({ message: 'Start date must be before or equal to end date' });
      }
      
      query.date = {
        $gte: start,
        $lte: end,
      };
    }
    
    const penalties = await Penalty.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'username fullName')
      .limit(100);
    
    res.json(penalties);
  } catch (error) {
    console.error('Error fetching penalties:', error);
    res.status(500).json({ message: 'Error fetching penalties' });
  }
});

// Get today's penalty
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const penalty = await Penalty.findOne({
      date: { $gte: today, $lt: tomorrow },
    }).populate('createdBy', 'username fullName');
    
    res.json(penalty || { count: 0, date: today });
  } catch (error) {
    console.error('Error fetching today penalty:', error);
    res.status(500).json({ message: 'Error fetching today penalty' });
  }
});

// Get weekly total
router.get('/weekly-total', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const penalties = await Penalty.find({
      date: { $gte: weekStart },
    });
    
    const total = penalties.reduce((sum, p) => sum + (p.count || 0), 0);
    
    res.json({ total, weekStart });
  } catch (error) {
    console.error('Error fetching weekly total:', error);
    res.status(500).json({ message: 'Error fetching weekly total' });
  }
});

// Get weekly data for chart (last 7 days)
router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weeklyData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const penalty = await Penalty.findOne({
        date: { $gte: date, $lt: nextDay },
      });
      
      weeklyData.push({
        date: date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
        ceza: penalty ? penalty.count : 0,
      });
    }
    
    res.json({ weeklyData });
  } catch (error) {
    console.error('Error fetching weekly data:', error);
    res.status(500).json({ message: 'Error fetching weekly data' });
  }
});

// Get all penalties for date range (for editing interface)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!['admin', 'ceza'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { startDate, endDate } = req.query;
    
    // Validate dates
    const start = startDate ? validateDate(startDate) : new Date();
    const end = endDate ? validateDate(endDate) : new Date();
    
    if (!start || !end) {
      return res.status(400).json({ message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' });
    }
    
    if (start > end) {
      return res.status(400).json({ message: 'Start date must be before or equal to end date' });
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    const penalties = await Penalty.find({
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });
    
    res.json(penalties);
  } catch (error) {
    console.error('Error fetching all penalties:', error);
    res.status(500).json({ message: 'Error fetching penalties' });
  }
});

// Create or update today's penalty (admin and ceza only)
router.post('/today', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!['admin', 'ceza'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { count } = req.body;
    
    // Validate and sanitize count
    const validatedCount = validateCount(count);
    if (validatedCount === null) {
      return res.status(400).json({ message: 'Valid count is required (must be a non-negative number)' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let penalty = await Penalty.findOne({
      date: { $gte: today, $lt: tomorrow },
    });
    
    if (penalty) {
      penalty.count = validatedCount;
      penalty.createdBy = req.user.userId;
      await penalty.save();
    } else {
      penalty = new Penalty({
        date: today,
        count: validatedCount,
        createdBy: req.user.userId,
      });
      await penalty.save();
    }
    
    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'penalty_update',
      targetType: 'penalty',
      targetId: penalty._id.toString(),
      message: `Bugünkü ceza sayısı güncellendi: ${validatedCount}`,
    });
    
    res.json(penalty);
  } catch (error) {
    console.error('Error updating penalty:', error);
    res.status(500).json({ message: 'Error updating penalty' });
  }
});

// Update penalty for a specific date (admin and ceza only)
router.post('/date', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!['admin', 'ceza'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { date, count } = req.body;
    
    // Validate date
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Date is required and must be a string' });
    }
    
    const targetDate = validateDate(date);
    if (!targetDate) {
      return res.status(400).json({ message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' });
    }
    
    // Validate and sanitize count
    const validatedCount = validateCount(count);
    if (validatedCount === null) {
      return res.status(400).json({ message: 'Valid count is required (must be a non-negative number)' });
    }
    
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    let penalty = await Penalty.findOne({
      date: { $gte: targetDate, $lt: nextDay },
    });
    
    if (penalty) {
      penalty.count = validatedCount;
      penalty.createdBy = req.user.userId;
      await penalty.save();
    } else {
      penalty = new Penalty({
        date: targetDate,
        count: validatedCount,
        createdBy: req.user.userId,
      });
      await penalty.save();
    }
    
    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'penalty_update',
      targetType: 'penalty',
      targetId: penalty._id.toString(),
      message: `${targetDate.toLocaleDateString('tr-TR')} tarihli ceza sayısı güncellendi: ${validatedCount}`,
    });
    
    res.json(penalty);
  } catch (error) {
    console.error('Error updating penalty:', error);
    res.status(500).json({ message: 'Error updating penalty' });
  }
});

export default router;

