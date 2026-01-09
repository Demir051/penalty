import express from 'express';
import Penalty from '../models/Penalty.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAction } from '../utils/activityLogger.js';
import User from '../models/User.js';

const router = express.Router();

// Get penalties for a date range
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
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
    if (!['admin', 'ceza'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
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
    if (!['admin', 'ceza'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { count } = req.body;
    
    if (typeof count !== 'number' || count < 0) {
      return res.status(400).json({ message: 'Valid count is required' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let penalty = await Penalty.findOne({
      date: { $gte: today, $lt: tomorrow },
    });
    
    if (penalty) {
      penalty.count = count;
      penalty.createdBy = req.user.userId;
      await penalty.save();
    } else {
      penalty = new Penalty({
        date: today,
        count,
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
      message: `Bugünkü ceza sayısı güncellendi: ${count}`,
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
    if (!['admin', 'ceza'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { date, count } = req.body;
    
    if (!date || typeof count !== 'number' || count < 0) {
      return res.status(400).json({ message: 'Valid date and count are required' });
    }
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    let penalty = await Penalty.findOne({
      date: { $gte: targetDate, $lt: nextDay },
    });
    
    if (penalty) {
      penalty.count = count;
      penalty.createdBy = req.user.userId;
      await penalty.save();
    } else {
      penalty = new Penalty({
        date: targetDate,
        count,
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
      message: `${targetDate.toLocaleDateString('tr-TR')} tarihli ceza sayısı güncellendi: ${count}`,
    });
    
    res.json(penalty);
  } catch (error) {
    console.error('Error updating penalty:', error);
    res.status(500).json({ message: 'Error updating penalty' });
  }
});

export default router;

