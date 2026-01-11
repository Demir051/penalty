import mongoose from 'mongoose';

const dailyTrackingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isHere: {
    type: Boolean,
    default: false,
  },
  tasks: {
    type: [String],
    default: [],
    enum: [
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
    ],
  },
  note: {
    type: String,
    default: '',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure one entry per user per day
dailyTrackingSchema.index({ date: 1, user: 1 }, { unique: true });

// Update the updatedAt field before saving
dailyTrackingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('DailyTracking', dailyTrackingSchema);



