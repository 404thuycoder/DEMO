const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['user', 'business', 'admin', 'superadmin'], 
    default: 'user' 
  },
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'pending'], 
    default: 'active' 
  },
  displayName: String,
  notes: String,
  preferences: {
    budget: { type: Number, default: 2 },
    pace: { type: String, default: 'vua' },
    interests: [String],
    habits: [String],
    theme: { type: String, default: 'light' }
  },
  savedTrips: [{
    name: String,
    stops: [{
      placeId: String,
      name: String,
      day: Number
    }]
  }],
  // Activity Log for tracking user states on map/itineraries
  activityLog: [{
    placeId: String,
    status: { type: String, enum: ['scheduled', 'experienced', 'missed'] },
    updatedAt: { type: Date, default: Date.now }
  }],
  lastActive: { type: Date, default: Date.now },
  points: { type: Number, default: 0 },
  rank: { type: String, default: 'Đồng' },
  rankTier: { type: String, default: 'I' },
  claimedQuests: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
