import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  authorImage: {
    type: String,
    default: null,
  },
  priority: {
    type: String,
    enum: ['critical', 'medium', 'normal'],
    default: 'normal',
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  completedByImage: {
    type: String,
    default: null,
  },
  completedByName: {
    type: String,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  comments: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      authorName: { type: String, required: true },
      authorImage: { type: String, default: null },
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model('Task', taskSchema);



