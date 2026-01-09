import express from 'express';
import DailyTracking from '../models/DailyTracking.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAction } from '../utils/activityLogger.js';

const router = express.Router();

// Helper function to check if user has access (admin or ceza role)
const checkAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'admin' && user.role !== 'ceza') {
      return res.status(403).json({ 
        message: 'Access denied. This page is only available for admin and ceza roles.' 
      });
    }
    
    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Error checking access:', error);
    res.status(500).json({ message: 'Error checking access' });
  }
};

// Get daily tracking entries for a specific date
// GET /api/daily-tracking?date=2024-01-15
router.get('/', authenticateToken, checkAccess, async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    // Parse date (expecting YYYY-MM-DD format)
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Set to start of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await DailyTracking.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate('user', 'username fullName profileImage role')
      .sort({ 'user.fullName': 1 });

    res.json(entries);
  } catch (error) {
    console.error('Error fetching daily tracking:', error);
    res.status(500).json({ message: 'Error fetching daily tracking' });
  }
});

// Get all users for the tracking page (only ceza role - admins can edit but won't appear in list)
router.get('/users', authenticateToken, checkAccess, async (req, res) => {
  try {
    // Get only users with ceza role (admins can edit but won't appear in the list)
    const users = await User.find({
      role: 'ceza',
      isActive: true,
    })
      .select('-password')
      .sort({ fullName: 1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Create or update daily tracking entry
// POST /api/daily-tracking
router.post('/', authenticateToken, checkAccess, async (req, res) => {
  try {
    const { date, userId, isHere, tasks, note } = req.body;
    const currentUser = req.currentUser;

    if (!date || !userId) {
      return res.status(400).json({ message: 'Date and userId are required' });
    }

    // Check if user is trying to update someone else's entry
    if (userId !== currentUser._id.toString() && currentUser.role !== 'admin') {
      return res.status(403).json({ 
        message: 'You can only update your own daily tracking entry' 
      });
    }

    // Verify the target user exists and has the ceza role
    // (Admins can edit but won't appear in the list)
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role !== 'ceza') {
      return res.status(400).json({ 
        message: 'Daily tracking entries can only be created for users with ceza role' 
      });
    }

    // Parse date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Set to start of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Validate tasks array
    const validTasks = [
      'Ceza Kampanyası',
      'Sürücü Kontrol',
      'Yolcu Kontrol',
      'Gün Sonu Kontrolu',
      'Sürücü Beyan',
      'Yolcu Beyan',
      'Etiket',
      'Atama',
      'Noramin-WP',
      'Acil Mail',
      'TAG Destek Klasör',
      'Ödeme Mail',
      'Dekont / Süreç Arama',
      'Kaza',
      'Eğitim',
      'Diğer (?)',
    ];

    const filteredTasks = Array.isArray(tasks) 
      ? tasks.filter(task => validTasks.includes(task))
      : [];

    // Find existing entry or create new one
    let entry = await DailyTracking.findOne({
      date: startOfDay,
      user: userId,
    });

    const isNew = !entry;

    if (entry) {
      // Update existing entry
      entry.isHere = isHere !== undefined ? isHere : entry.isHere;
      entry.tasks = filteredTasks;
      entry.note = note !== undefined ? note : entry.note;
      entry.updatedAt = new Date();
    } else {
      // Create new entry
      entry = new DailyTracking({
        date: startOfDay,
        user: userId,
        isHere: isHere !== undefined ? isHere : false,
        tasks: filteredTasks,
        note: note || '',
      });
    }

    await entry.save();
    await entry.populate('user', 'username fullName profileImage role');

    await logAction({
      actorId: currentUser._id,
      actorName: currentUser.fullName || currentUser.username,
      action: isNew ? 'daily_tracking_create' : 'daily_tracking_update',
      targetType: 'daily_tracking',
      targetId: entry._id.toString(),
      message: `Günlük takip ${isNew ? 'oluşturuldu' : 'güncellendi'}: ${targetUser.fullName || targetUser.username}`,
      metadata: { date: startOfDay, tasks: filteredTasks },
    });

    res.status(isNew ? 201 : 200).json(entry);
  } catch (error) {
    console.error('Error creating/updating daily tracking:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'An entry already exists for this user and date' 
      });
    }
    
    res.status(500).json({ message: 'Error creating/updating daily tracking' });
  }
});

// Update daily tracking entry
// PATCH /api/daily-tracking/:id
router.patch('/:id', authenticateToken, checkAccess, async (req, res) => {
  try {
    const { isHere, tasks, note } = req.body;
    const currentUser = req.currentUser;

    const entry = await DailyTracking.findById(req.params.id).populate('user');
    
    if (!entry) {
      return res.status(404).json({ message: 'Daily tracking entry not found' });
    }

    // Check if user can edit this entry
    if (entry.user._id.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
      return res.status(403).json({ 
        message: 'You can only update your own daily tracking entry' 
      });
    }

    // Validate tasks array
    const validTasks = [
      'Ceza Kampanyası',
      'Sürücü Kontrol',
      'Yolcu Kontrol',
      'Gün Sonu Kontrolu',
      'Sürücü Beyan',
      'Yolcu Beyan',
      'Etiket',
      'Atama',
      'Noramin-WP',
      'Acil Mail',
      'TAG Destek Klasör',
      'Ödeme Mail',
      'Dekont / Süreç Arama',
      'Kaza',
      'Eğitim',
      'Diğer (?)',
    ];

    if (isHere !== undefined) entry.isHere = isHere;
    if (tasks !== undefined) {
      entry.tasks = Array.isArray(tasks) 
        ? tasks.filter(task => validTasks.includes(task))
        : [];
    }
    if (note !== undefined) entry.note = note;
    entry.updatedAt = new Date();

    await entry.save();
    await entry.populate('user', 'username fullName profileImage role');

    await logAction({
      actorId: currentUser._id,
      actorName: currentUser.fullName || currentUser.username,
      action: 'daily_tracking_update',
      targetType: 'daily_tracking',
      targetId: entry._id.toString(),
      message: `Günlük takip güncellendi: ${entry.user.fullName || entry.user.username}`,
      metadata: { date: entry.date, tasks: entry.tasks },
    });

    res.json(entry);
  } catch (error) {
    console.error('Error updating daily tracking:', error);
    res.status(500).json({ message: 'Error updating daily tracking' });
  }
});

export default router;

