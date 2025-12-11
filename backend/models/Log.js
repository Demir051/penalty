import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actorName: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  targetType: {
    type: String,
    required: true,
    trim: true,
  },
  targetId: {
    type: String,
    default: null,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Log', logSchema);

