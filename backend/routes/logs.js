import express from 'express';
import Log from '../models/Log.js';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import { logAction } from '../utils/activityLogger.js';

const router = express.Router();

// Get logs (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Validate and sanitize limit
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) {
      limit = 200;
    }
    limit = Math.min(limit, 500); // Max 500
    
    const logs = await Log.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

// Get mail and beyan statistics
router.get('/mail-beyan-stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Mail logları
    const mailLogs = await Log.find({
      action: 'mail_copy',
    }).sort({ createdAt: -1 });

    // Beyan logları
    const beyanLogs = await Log.find({
      action: 'beyan_copy',
    }).sort({ createdAt: -1 });

    // Receipt logları
    const receiptLogs = await Log.find({
      action: { $in: ['receipt_create', 'receipt_process'] },
    }).sort({ createdAt: -1 });

    // Kullanıcı bazında istatistikler
    const mailStats = {};
    const beyanStats = {};
    const receiptStats = {};

    mailLogs.forEach(log => {
      const key = log.actorName || 'Bilinmiyor';
      if (!mailStats[key]) {
        mailStats[key] = { total: 0, byType: {} };
      }
      mailStats[key].total++;
      const mailType = log.metadata?.mailType || 'Bilinmiyor';
      mailStats[key].byType[mailType] = (mailStats[key].byType[mailType] || 0) + 1;
    });

    beyanLogs.forEach(log => {
      const key = log.actorName || 'Bilinmiyor';
      if (!beyanStats[key]) {
        beyanStats[key] = { total: 0 };
      }
      beyanStats[key].total++;
    });

    receiptLogs.forEach(log => {
      const key = log.actorName || 'Bilinmiyor';
      if (!receiptStats[key]) {
        receiptStats[key] = { total: 0, processed: 0 };
      }
      if (log.action === 'receipt_process') {
        receiptStats[key].processed = (receiptStats[key].processed || 0) + 1;
      } else {
        receiptStats[key].total++;
      }
    });

    res.json({
      mailLogs,
      beyanLogs,
      receiptLogs,
      mailStats,
      beyanStats,
      receiptStats,
    });
  } catch (error) {
    console.error('Error fetching mail/beyan stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Log mail copy
router.post('/mail-copy', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { mailType, mailContent } = req.body;

    // Sanitize inputs
    const sanitizedMailType = mailType && typeof mailType === 'string' 
      ? mailType.trim().slice(0, 100).replace(/[<>]/g, '')
      : 'Bilinmiyor';
    
    const contentLength = mailContent && typeof mailContent === 'string' 
      ? mailContent.length 
      : 0;

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'mail_copy',
      targetType: 'mail',
      targetId: null,
      message: `${sanitizedMailType} maili kopyalandı`,
      metadata: {
        mailType: sanitizedMailType,
        contentLength: contentLength,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging mail copy:', error);
    res.status(500).json({ message: 'Error logging mail copy' });
  }
});

// Log beyan copy
router.post('/beyan-copy', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { beyanContent } = req.body;

    // Sanitize inputs
    const contentLength = beyanContent && typeof beyanContent === 'string' 
      ? beyanContent.length 
      : 0;

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'beyan_copy',
      targetType: 'beyan',
      targetId: null,
      message: 'Beyan metni kopyalandı',
      metadata: {
        contentLength: contentLength,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging beyan copy:', error);
    res.status(500).json({ message: 'Error logging beyan copy' });
  }
});

export default router;

