const mongoose = require('mongoose');

const adminAccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  displayName: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  permissions: { type: [String], default: ['overview'] },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminAccount', adminAccountSchema);
