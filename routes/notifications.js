const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth } = require('./auth');
const User = require('../models/User');

// --- Helper for role-restricted middleware ---
const roleAuth = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối' });
  }
  next();
};

// GET /api/notifications - Get current user notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipientId: req.user.id },
        { recipientId: 'ALL' },
        { recipientId: `ROLE_${req.user.role.toUpperCase()}` }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      $or: [
        { recipientId: req.user.id },
        { recipientId: 'ALL' },
        { recipientId: `ROLE_${req.user.role.toUpperCase()}` }
      ],
      isRead: false
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/notifications/read/:id - Mark as read
router.put('/read/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    
    // Only recipient can mark as read if it was targeted
    if (notification.recipientId.startsWith('ROLE_') || notification.recipientId === 'ALL') {
        // Broadcast notifications might need a separate 'readBy' array in production, 
        // but for now we'll just let anyone mark it
    } else if (notification.recipientId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    notification.isRead = true;
    await notification.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/notifications/broadcast - Admin send broadcast
router.post('/broadcast', auth, roleAuth(['admin', 'superadmin']), async (req, res) => {
  try {
    const { recipientType, title, message, link, type } = req.body;
    
    // recipientType: 'ALL', 'BUSINESS', 'USER', or specific userId
    let finalRecipient = recipientType;
    if (['BUSINESS', 'USER', 'ADMIN'].includes(recipientType)) {
        finalRecipient = `ROLE_${recipientType}`;
    }

    const notification = new Notification({
      recipientId: finalRecipient,
      senderId: req.user.id,
      title,
      message,
      link,
      type: type || 'broadcast'
    });

    await notification.save();
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
