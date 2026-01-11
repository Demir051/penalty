import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { authenticateToken, validateObjectId } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ toUser: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('fromUser', 'username fullName profileImage')
      .lean();
    
    // Convert taskId and targetId to strings, handle both ObjectId and populated objects
    const formattedNotifications = notifications.map(notif => {
      let taskId = null;
      let targetId = null;
      
      // Handle taskId - can be ObjectId, populated object, or string
      if (notif.taskId) {
        if (typeof notif.taskId === 'object' && notif.taskId._id) {
          taskId = notif.taskId._id.toString();
        } else if (typeof notif.taskId === 'object' && notif.taskId.toString) {
          taskId = notif.taskId.toString();
        } else if (typeof notif.taskId === 'string') {
          taskId = notif.taskId;
        }
      }
      
      // Handle targetId
      if (notif.targetId) {
        if (typeof notif.targetId === 'object' && notif.targetId._id) {
          targetId = notif.targetId._id.toString();
        } else if (typeof notif.targetId === 'object' && notif.targetId.toString) {
          targetId = notif.targetId.toString();
        } else if (typeof notif.targetId === 'string') {
          targetId = notif.targetId;
        }
      } else if (taskId) {
        targetId = taskId;
      }
      
      return {
        ...notif,
        _id: notif._id?.toString() || notif._id,
        taskId: taskId,
        targetId: targetId || taskId,
        toUser: notif.toUser?.toString() || notif.toUser,
        fromUser: notif.fromUser?._id?.toString() || notif.fromUser?.toString() || notif.fromUser,
      };
    });
    
    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, validateObjectId, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid notification ID format' });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      toUser: req.user.userId,
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

// Mark all as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { toUser: req.user.userId, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      toUser: req.user.userId,
      read: false,
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

export default router;

