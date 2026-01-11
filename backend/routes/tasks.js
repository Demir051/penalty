import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticateToken, validateObjectId } from '../middleware/auth.js';
import { logAction } from '../utils/activityLogger.js';

const router = express.Router();

// Helper function to extract mentions from text
const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)]; // Remove duplicates
};

// Helper function to create notifications for mentions (including group mentions)
const createMentionNotifications = async (taskId, content, fromUser, fromUserName, fromUserImage) => {
  const mentions = extractMentions(content);
  if (mentions.length === 0) return;

  const notifications = [];
  const groupRoles = ['üye', 'ceza', 'admin'];

  for (const mention of mentions) {
    // Check if it's a group mention
    if (groupRoles.includes(mention.toLowerCase())) {
      const role = mention.toLowerCase();
      const usersInRole = await User.find({ role });
      
      for (const user of usersInRole) {
        if (user._id.toString() !== fromUser._id.toString()) {
          notifications.push({
            toUser: user._id,
            fromUser: fromUser._id,
            fromUserName: fromUserName,
            fromUserProfileImage: fromUserImage,
            title: 'Grup Etiketlendi',
            message: `${fromUserName} ${role} rolündeki herkesi bir görevde etiketledi: ${content.slice(0, 100)}`,
            link: `/dashboard/tasks?taskId=${taskId}`,
            type: 'mention',
            isGroupMention: true,
            groupRole: role,
          });
        }
      }
    } else {
      // Individual mention
      const users = await User.find({
        $or: [
          { username: mention },
          { fullName: mention },
        ],
      });

      for (const user of users) {
        if (user._id.toString() !== fromUser._id.toString()) {
          notifications.push({
            toUser: user._id,
            fromUser: fromUser._id,
            fromUserName: fromUserName,
            fromUserProfileImage: fromUserImage,
            title: 'Görevde bahsedildin!',
            message: `${fromUserName} seni bir görevde veya yorumda bahsetti.`,
            link: `/dashboard/tasks?taskId=${taskId}`,
            type: 'mention',
            isGroupMention: false,
          });
        }
      }
    }
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
};

// Get all tasks (feed)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user has access (only admin and ceza roles can access)
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'uye') {
      return res.status(403).json({ message: 'Access denied. This page is not available for your role.' });
    }

    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username fullName profileImage')
      .populate('completedBy', 'username fullName profileImage');

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Create a new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user has access (only admin and ceza roles can access)
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'uye') {
      return res.status(403).json({ message: 'Access denied. This page is not available for your role.' });
    }

    const { content, priority } = req.body;

    // Input validation and sanitization
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ message: 'Task content is required and must be a non-empty string' });
    }

    // Sanitize content (prevent XSS, limit length)
    const sanitizedContent = content.trim().slice(0, 5000).replace(/<script[^>]*>.*?<\/script>/gi, '');

    if (sanitizedContent.length === 0) {
      return res.status(400).json({ message: 'Task content cannot be empty after sanitization' });
    }

    // Validate priority
    const allowedPriorities = ['critical', 'medium', 'normal'];
    const taskPriority = priority && typeof priority === 'string' && allowedPriorities.includes(priority) 
      ? priority 
      : 'normal';

    const task = new Task({
      content: sanitizedContent,
      author: req.user.userId,
      authorName: user.fullName || user.username,
      authorImage: user.profileImage || null,
      priority: taskPriority,
    });

    await task.save();
    await task.populate('author', 'username fullName');

    // Create notifications for mentions
    await createMentionNotifications(
      task._id,
      task.content,
      user,
      user.fullName || user.username,
      user.profileImage || null
    );

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'task_create',
      targetType: 'task',
      targetId: task._id.toString(),
      message: `Görev oluşturuldu: ${task.content.slice(0, 80)}`,
      metadata: { priority: task.priority },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Mark task as completed (specific route - must come before /:id)
router.patch('/:id/complete', authenticateToken, validateObjectId, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.completed) {
      return res.status(400).json({ message: 'Task is already completed' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    task.completed = true;
    task.completedBy = req.user.userId;
    task.completedByName = user.fullName || user.username;
    task.completedByImage = user.profileImage || null;
    task.completedAt = new Date();

    await task.save();
    await task.populate('author', 'username fullName profileImage');
    await task.populate('completedBy', 'username fullName profileImage');

    // Notify task author
    if (task.author.toString() !== req.user.userId) {
      await Notification.create({
        toUser: task.author,
        type: 'task_completed',
        targetType: 'task',
        targetId: task._id.toString(),
        title: 'Görev tamamlandı',
        message: `${user.fullName || user.username} görevinizi tamamladı: ${task.content.slice(0, 100)}`,
        taskId: task._id,
        fromUser: user._id,
        fromUserName: user.fullName || user.username,
        fromUserProfileImage: user.profileImage || null,
        link: `/dashboard/tasks/${task._id}`,
      });
    }

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'task_complete',
      targetType: 'task',
      targetId: task._id.toString(),
      message: `Görev tamamlandı: ${task.content.slice(0, 80)}`,
    });

    res.json(task);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ message: 'Error completing task' });
  }
});

// Unmark task as completed (specific route - must come before /:id)
router.patch('/:id/uncomplete', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has access (only admin and ceza roles can access)
    if (user.role === 'uye') {
      return res.status(403).json({ message: 'Access denied. This page is not available for your role.' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.completed = false;
    task.completedBy = null;
    task.completedByName = null;
    task.completedByImage = null;
    task.completedAt = null;

    await task.save();
    await task.populate('author', 'username fullName profileImage');

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'task_uncomplete',
      targetType: 'task',
      targetId: task._id.toString(),
      message: `Görev geri alındı: ${task.content.slice(0, 80)}`,
    });

    res.json(task);
  } catch (error) {
    console.error('Error uncompleting task:', error);
    res.status(500).json({ message: 'Error uncompleting task' });
  }
});

// Add comment to task (specific route - must come before /:id)
router.post('/:id/comments', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has access (only admin and ceza roles can access)
    if (user.role === 'uye') {
      return res.status(403).json({ message: 'Access denied. This page is not available for your role.' });
    }

    const { message } = req.body;
    
    // Input validation and sanitization
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: 'Comment message is required and must be a non-empty string' });
    }

    // Sanitize message (prevent XSS, limit length)
    const sanitizedMessage = message.trim().slice(0, 2000).replace(/<script[^>]*>.*?<\/script>/gi, '');

    if (sanitizedMessage.length === 0) {
      return res.status(400).json({ message: 'Comment message cannot be empty after sanitization' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.comments.push({
      author: user._id,
      authorName: user.fullName || user.username,
      authorImage: user.profileImage || null,
      message: sanitizedMessage,
      createdAt: new Date(),
    });

    await task.save();
    await task.populate('author', 'username fullName profileImage');
    await task.populate('completedBy', 'username fullName profileImage');
    await task.populate({
      path: 'comments.author',
      select: 'username fullName profileImage'
    });

    // Create notifications for mentions in comment
    await createMentionNotifications(
      task._id,
      sanitizedMessage,
      user,
      user.fullName || user.username,
      user.profileImage || null
    );

    // Notify task author if comment is not from author
    if (task.author.toString() !== req.user.userId) {
      await Notification.create({
        toUser: task.author,
        type: 'task_comment',
        targetType: 'task',
        targetId: task._id.toString(),
        title: 'Görevinize yorum yapıldı',
        message: `${user.fullName || user.username} görevinize yorum yaptı: ${sanitizedMessage.slice(0, 100)}`,
        taskId: task._id,
        fromUser: user._id,
        fromUserName: user.fullName || user.username,
        fromUserProfileImage: user.profileImage || null,
        link: `/dashboard/tasks/${task._id}`,
      });
    }

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'comment_add',
      targetType: 'task',
      targetId: task._id.toString(),
      message: `Yorum eklendi: ${sanitizedMessage.slice(0, 80)}`,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Delete comment (specific route - must come before /:id)
router.delete('/:taskId/comments/:commentId', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check if user has access (only admin and ceza roles can access)
    if (user.role === 'uye') {
      return res.status(403).json({ message: 'Access denied. This page is not available for your role.' });
    }

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID format' });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const comment = task.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = comment.author.toString() === req.user.userId;
    if (!isOwner && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete comment' });
    }

    await comment.deleteOne();
    await task.save();

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'comment_delete',
      targetType: 'task',
      targetId: task._id.toString(),
      message: `Yorum silindi: ${comment.message.slice(0, 80)}`,
    });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

// Get a single task by ID (must come after all specific routes)
router.get('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    // Additional validation: ensure ID is valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'uye') {
      return res.status(403).json({ message: 'Access denied. This page is not available for your role.' });
    }

    const task = await Task.findById(req.params.id)
      .populate('author', 'username fullName profileImage')
      .populate('completedBy', 'username fullName profileImage')
      .populate({
        path: 'comments.author',
        select: 'username fullName profileImage'
      });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    // Don't expose internal error details
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    res.status(500).json({ message: 'Error fetching task' });
  }
});

// Update task content and priority (author or admin) - must come after all specific routes
router.patch('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has access (only admin and ceza roles can access)
    if (user.role === 'uye') {
      return res.status(403).json({ message: 'Access denied. This page is not available for your role.' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user can edit this task (author or admin)
    const isOwner = task.author.toString() === req.user.userId;
    if (!isOwner && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit task' });
    }

    const { content, priority } = req.body;

    // Update content if provided
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ message: 'Task content must be a non-empty string' });
      }

      // Sanitize content (prevent XSS, limit length, but allow HTML from rich text editor)
      // Remove only script tags, keep other HTML for rich text formatting
      const sanitizedContent = content.trim().slice(0, 10000).replace(/<script[^>]*>.*?<\/script>/gi, '');

      if (sanitizedContent.length === 0) {
        return res.status(400).json({ message: 'Task content cannot be empty after sanitization' });
      }

      task.content = sanitizedContent;
    }

    // Update priority if provided
    if (priority !== undefined) {
      const allowedPriorities = ['critical', 'medium', 'normal'];
      if (typeof priority === 'string' && allowedPriorities.includes(priority)) {
        task.priority = priority;
      }
    }

    await task.save();
    await task.populate('author', 'username fullName');
    await task.populate('completedBy', 'username fullName');

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'task_update',
      targetType: 'task',
      targetId: task._id.toString(),
      message: `Görev güncellendi: ${task.content.slice(0, 80)}`,
      metadata: { priority: task.priority },
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete a task (author or admin) - must come after all specific routes
router.delete('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check if user has access (only admin and ceza roles can access)
    if (user.role === 'uye') {
      return res.status(403).json({ message: 'Access denied. This page is not available for your role.' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isOwner = task.author.toString() === req.user.userId;
    if (!isOwner && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete task' });
    }

    await Task.findByIdAndDelete(req.params.id);

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'task_delete',
      targetType: 'task',
      targetId: task._id.toString(),
      message: `Görev silindi: ${task.content.slice(0, 80)}`,
    });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

export default router;
