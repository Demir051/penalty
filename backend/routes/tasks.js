import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';
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

// Helper function to create notifications for mentions
const createMentionNotifications = async (taskId, content, fromUser, fromUserName) => {
  const mentions = extractMentions(content);
  if (mentions.length === 0) return;

  const users = await User.find({
    $or: [
      { username: { $in: mentions } },
      { fullName: { $in: mentions } },
    ],
  });

  const notifications = users.map(user => ({
    userId: user._id,
    type: 'mention',
    title: 'Görevde bahsedildiniz',
    message: `${fromUserName} sizi bir görevde bahsetti: ${content.slice(0, 100)}`,
    taskId,
    fromUser: fromUser._id,
    fromUserName,
  }));

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
};

// Get all tasks (feed)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username fullName')
      .populate('completedBy', 'username fullName');

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Create a new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, priority } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Task content is required' });
    }
    const allowedPriorities = ['critical', 'medium', 'normal'];
    const taskPriority = allowedPriorities.includes(priority) ? priority : 'normal';

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = new Task({
      content: content.trim(),
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
      user.fullName || user.username
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

// Delete a task (author or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

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

// Mark task as completed
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
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
    await task.populate('author', 'username fullName');
    await task.populate('completedBy', 'username fullName');

    // Notify task author
    if (task.author.toString() !== req.user.userId) {
      await Notification.create({
        userId: task.author,
        type: 'task_completed',
        title: 'Görev tamamlandı',
        message: `${user.fullName || user.username} görevinizi tamamladı: ${task.content.slice(0, 100)}`,
        taskId: task._id,
        fromUser: user._id,
        fromUserName: user.fullName || user.username,
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

// Unmark task as completed
router.patch('/:id/uncomplete', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    task.completed = false;
    task.completedBy = null;
    task.completedByName = null;
    task.completedByImage = null;
    task.completedAt = null;

    await task.save();
    await task.populate('author', 'username fullName');

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

// Add comment to task
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Comment message is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    task.comments.push({
      author: user._id,
      authorName: user.fullName || user.username,
      authorImage: user.profileImage || null,
      message: message.trim(),
      createdAt: new Date(),
    });

    await task.save();
    await task.populate('author', 'username fullName');
    await task.populate('completedBy', 'username fullName');

    // Create notifications for mentions in comment
    await createMentionNotifications(
      task._id,
      message.trim(),
      user,
      user.fullName || user.username
    );

    // Notify task author if comment is not from author
    if (task.author.toString() !== req.user.userId) {
      await Notification.create({
        userId: task.author,
        type: 'task_comment',
        title: 'Görevinize yorum yapıldı',
        message: `${user.fullName || user.username} görevinize yorum yaptı: ${message.trim().slice(0, 100)}`,
        taskId: task._id,
        fromUser: user._id,
        fromUserName: user.fullName || user.username,
      });
    }

    await logAction({
      actorId: user._id,
      actorName: user.fullName || user.username,
      action: 'comment_add',
      targetType: 'task',
      targetId: task._id.toString(),
      message: `Yorum eklendi: ${message.trim().slice(0, 80)}`,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Delete comment
router.delete('/:taskId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

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

export default router;
