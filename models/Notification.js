const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { 
    type: String, 
    required: true // Can be a specific User ID, or special keywords like 'ALL', 'ADMINS', 'BUSINESS'
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null // null if system-generated
  },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error', 'broadcast'], 
    default: 'info' 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index to quickly find user notifications
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
