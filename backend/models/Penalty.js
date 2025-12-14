import mongoose from 'mongoose';

const penaltySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  count: {
    type: Number,
    required: true,
    min: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Penalty', penaltySchema);

