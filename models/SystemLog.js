const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'PLACE_CREATED', 'USER_LOGIN', 'BUSINESS_UPDATE'
  details: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  userRole: { type: String },
  targetId: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemLog', systemLogSchema);
