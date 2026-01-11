import express from 'express';
import Receipt from '../models/Receipt.js';
import { authenticateToken, validateObjectId } from '../middleware/auth.js';
import { logAction } from '../utils/activityLogger.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to calculate early payment days
// Formula: today - penaltyDate (days difference)
const calculateEarlyPaymentDays = (penaltyDate) => {
  if (!penaltyDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const penalty = new Date(penaltyDate);
  penalty.setHours(0, 0, 0, 0);
  
  // Calculate: today - penaltyDate
  const diffTime = today.getTime() - penalty.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

// Get all receipts
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user has access (only admin and ceza roles can access)
    const User = mongoose.model('User');
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'ceza')) {
      return res.status(403).json({ message: 'Access denied. Only admin and ceza roles can access receipts.' });
    }

    const receipts = await Receipt.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username fullName profileImage')
      .populate('processedBy', 'username fullName profileImage')
      .limit(500); // Limit to prevent huge responses

    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'Error fetching receipts' });
  }
});

// Create a new receipt
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { penaltyDate, fullName, phoneNumber, email, type } = req.body;

    // Input validation and sanitization
    if (!penaltyDate) {
      return res.status(400).json({ message: 'Ceza tarihi gereklidir' });
    }
    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
      return res.status(400).json({ message: 'İsim soyisim gereklidir' });
    }
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
      return res.status(400).json({ message: 'Telefon numarası gereklidir' });
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ message: 'Mail adresi gereklidir' });
    }
    if (!type || !['sürücü', 'yolcu'].includes(type)) {
      return res.status(400).json({ message: 'Sürücü/Yolcu seçimi gereklidir' });
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Geçersiz mail adresi formatı' });
    }

    // Validate and parse date (expecting YYYY-MM-DD format)
    let penaltyDateObj;
    if (typeof penaltyDate === 'string' && penaltyDate.includes('-')) {
      // Already in YYYY-MM-DD format
      penaltyDateObj = new Date(penaltyDate + 'T00:00:00');
    } else {
      penaltyDateObj = new Date(penaltyDate);
    }
    if (isNaN(penaltyDateObj.getTime())) {
      return res.status(400).json({ message: 'Geçersiz tarih formatı' });
    }

    // Get user info
    const User = mongoose.model('User');
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Sanitize inputs
    const sanitizedFullName = fullName.trim().slice(0, 200);
    const sanitizedPhone = phoneNumber.trim().slice(0, 20);
    const sanitizedEmail = email.trim().toLowerCase().slice(0, 200);

    // Check for duplicate receipt (same penaltyDate and fullName)
    // Normalize dates for comparison (start and end of day)
    const startOfDay = new Date(penaltyDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(penaltyDateObj);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingReceipt = await Receipt.findOne({
      penaltyDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      fullName: sanitizedFullName
    });

    if (existingReceipt) {
      return res.status(400).json({ message: 'Bu makbuz zaten listede var. Aynı ceza tarihi ve isim soyisim kombinasyonuna sahip bir kayıt bulunmaktadır.' });
    }

    // Calculate early payment days after sanitization
    const earlyPaymentDays = calculateEarlyPaymentDays(penaltyDateObj);

    const receipt = new Receipt({
      name: sanitizedFullName, // Use fullName as name
      penaltyDate: penaltyDateObj,
      fullName: sanitizedFullName,
      phoneNumber: sanitizedPhone,
      email: sanitizedEmail,
      type: type,
      earlyPaymentDays: earlyPaymentDays,
      createdBy: req.user.userId,
      createdByName: user.fullName || user.username,
    });

    await receipt.save();

    // Log the action
    await logAction({
      actorId: req.user.userId,
      actorName: user.fullName || user.username,
      action: 'receipt_create',
      targetType: 'receipt',
      targetId: receipt._id.toString(),
      message: `Makbuz eklendi: ${sanitizedFullName}`,
    });

    await receipt.populate('createdBy', 'username fullName profileImage');

    res.status(201).json(receipt);
  } catch (error) {
    console.error('Error creating receipt:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating receipt' });
  }
});

// Update a receipt
router.patch('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Only admin or creator can update
    const User = mongoose.model('User');
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin' && receipt.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You are not authorized to update this receipt.' });
    }

    const { penaltyDate, fullName, phoneNumber, email, type, isProcessed } = req.body;

    // Track changes for duplicate check
    let newPenaltyDate = receipt.penaltyDate;
    let newFullName = receipt.fullName;

    if (penaltyDate !== undefined) {
      const penaltyDateObj = new Date(penaltyDate);
      if (isNaN(penaltyDateObj.getTime())) {
        return res.status(400).json({ message: 'Geçersiz tarih formatı' });
      }
      newPenaltyDate = penaltyDateObj;
      receipt.penaltyDate = penaltyDateObj;
      // Recalculate early payment days
      receipt.earlyPaymentDays = calculateEarlyPaymentDays(penaltyDateObj);
    }

    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || fullName.trim() === '') {
        return res.status(400).json({ message: 'İsim soyisim gereklidir' });
      }
      newFullName = fullName.trim().slice(0, 200);
      receipt.fullName = newFullName;
    }

    // Check for duplicate receipt (same penaltyDate and fullName, excluding current receipt)
    if (newPenaltyDate && newFullName) {
      // Normalize dates for comparison (start and end of day)
      const startOfDay = new Date(newPenaltyDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(newPenaltyDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const existingReceipt = await Receipt.findOne({
        penaltyDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        fullName: newFullName,
        _id: { $ne: receipt._id } // Exclude current receipt
      });

      if (existingReceipt) {
        return res.status(400).json({ message: 'Bu makbuz zaten listede var. Aynı ceza tarihi ve isim soyisim kombinasyonuna sahip bir kayıt bulunmaktadır.' });
      }
    }

    if (phoneNumber !== undefined) {
      if (typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
        return res.status(400).json({ message: 'Telefon numarası gereklidir' });
      }
      receipt.phoneNumber = phoneNumber.trim().slice(0, 20);
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ message: 'Mail adresi gereklidir' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: 'Geçersiz mail adresi formatı' });
      }
      receipt.email = email.trim().toLowerCase().slice(0, 200);
    }

    if (type !== undefined) {
      if (!['sürücü', 'yolcu'].includes(type)) {
        return res.status(400).json({ message: 'Sürücü/Yolcu seçimi gereklidir' });
      }
      receipt.type = type;
    }

    // Handle isProcessed status
    if (isProcessed !== undefined) {
      const wasProcessed = receipt.isProcessed;
      receipt.isProcessed = isProcessed === true;
      
      if (receipt.isProcessed && !wasProcessed) {
        // Mark as processed
        receipt.processedBy = req.user.userId;
        receipt.processedByName = user.fullName || user.username;
        receipt.processedAt = new Date();
        
        // Log the processing action
        await logAction({
          actorId: req.user.userId,
          actorName: user.fullName || user.username,
          action: 'receipt_process',
          targetType: 'receipt',
          targetId: receipt._id.toString(),
          message: `Makbuz işlendi: ${receipt.fullName}`,
        });
      } else if (!receipt.isProcessed && wasProcessed) {
        // Unmark as processed
        receipt.processedBy = null;
        receipt.processedByName = null;
        receipt.processedAt = null;
      }
    }

    await receipt.save();
    await receipt.populate('createdBy', 'username fullName profileImage');
    if (receipt.processedBy) {
      await receipt.populate('processedBy', 'username fullName profileImage');
    }

    // Log the action (if not a process action)
    if (isProcessed === undefined) {
      await logAction({
        actorId: req.user.userId,
        actorName: user.fullName || user.username,
        action: 'receipt_update',
        targetType: 'receipt',
        targetId: receipt._id.toString(),
        message: `Makbuz güncellendi: ${receipt.fullName}`,
      });
    }

    res.json(receipt);
  } catch (error) {
    console.error('Error updating receipt:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    res.status(500).json({ message: 'Error updating receipt' });
  }
});

// Delete a receipt
router.delete('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Only admin or creator can delete
    const User = mongoose.model('User');
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin' && receipt.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You are not authorized to delete this receipt.' });
    }

    await Receipt.findByIdAndDelete(req.params.id);

    // Log the action
    await logAction({
      actorId: req.user.userId,
      actorName: user.fullName || user.username,
      action: 'receipt_delete',
      targetType: 'receipt',
      targetId: req.params.id,
      message: `Makbuz silindi: ${receipt.fullName}`,
    });

    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    res.status(500).json({ message: 'Error deleting receipt' });
  }
});

export default router;

