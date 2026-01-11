import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  penaltyDate: {
    type: Date,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  earlyPaymentDays: {
    type: Number,
    default: 0,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  type: {
    type: String,
    enum: ['sürücü', 'yolcu'],
    required: true,
  },
  isProcessed: {
    type: Boolean,
    default: false,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  processedByName: {
    type: String,
    default: null,
  },
  processedAt: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdByName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Receipt', receiptSchema);

