import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  fromUserName: {
    type: String,
    default: null,
  },
  fromUserProfileImage: {
    type: String,
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    enum: ['mention', 'task_comment', 'task_assigned', 'task_completed'],
    required: true,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  targetType: {
    type: String,
    enum: ['task', 'comment', 'mention'],
    default: null,
  },
  targetId: {
    type: String,
    default: null,
  },
  isGroupMention: {
    type: Boolean,
    default: false,
  },
  groupRole: {
    type: String,
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Notification', notificationSchema);

