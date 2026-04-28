const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AdminAccount = require('../models/AdminAccount');
const BusinessAccount = require('../models/BusinessAccount');
const logAction = require('../utils/logger');
const { calculateRank } = require('../utils/rankUtils');

const JWT_SECRET = process.env.JWT_SECRET || 'wander-viet-secret-key-123';
const DEFAULT_ADMIN_EMAIL = 'admin@wanderviet.com';
const DEFAULT_ADMIN_PASSWORD = 'password@2006';

const signPortalToken = (account, portal, role) => {
  const payload = {
    id: account.id || account._id.toString(),
    email: account.email,
    name: account.name,
    displayName: account.displayName || account.name,
    role,
    status: account.status || 'active',
    portal
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const verifyPortalToken = (expectedPortal) => async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ success: false, message: 'Không có token, từ chối quyền truy cập' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const account = decoded.account || decoded.user || decoded; // Handle old and new formats
    if (!account || !account.id) return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    
    if (expectedPortal && account.portal !== expectedPortal) {
      return res.status(403).json({ success: false, message: 'Token không thuộc portal này' });
    }

    const modelMap = { 'user': User, 'business': BusinessAccount, 'admin': AdminAccount };
    const Model = modelMap[account.portal || expectedPortal];
    
    if (Model) {
      const freshAccount = await Model.findByIdAndUpdate(account.id, { lastActive: new Date() }, { returnDocument: 'after' });
      if (!freshAccount) return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại' });
      if (freshAccount.status === 'suspended') return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
      
      req.user = {
        id: freshAccount.id,
        email: freshAccount.email,
        role: freshAccount.role,
        status: freshAccount.status,
        displayName: freshAccount.displayName || freshAccount.name,
        name: freshAccount.name,
        portal: account.portal
      };
    } else {
      req.user = {
        id: account.id,
        email: account.email,
        role: account.role,
        status: account.status,
        displayName: account.displayName || account.name,
        name: account.name,
        portal: account.portal
      };
    }
    
    next();
  } catch (_err) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
};

const auth = verifyPortalToken('user');
const businessAuth = verifyPortalToken('business');
const adminTokenAuth = verifyPortalToken('admin');
const sharedAuth = verifyPortalToken(null);

async function ensureDefaultAdmin() {
  await AdminAccount.deleteMany({ email: 'root@wanderviet.com' });
  await AdminAccount.updateMany(
    { email: { $ne: DEFAULT_ADMIN_EMAIL }, role: 'superadmin' },
    { $set: { role: 'admin' } }
  );
  let admin = await AdminAccount.findOne({ email: DEFAULT_ADMIN_EMAIL });
  const hashed = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  if (!admin) {
    admin = new AdminAccount({
      name: 'Super Admin',
      displayName: 'Super Admin',
      email: DEFAULT_ADMIN_EMAIL,
      password: hashed,
      role: 'superadmin',
      status: 'active'
    });
    await admin.save();
    return;
  }
  admin.password = hashed;
  admin.role = 'superadmin';
  admin.status = 'active';
  if (!admin.name) admin.name = 'Super Admin';
  if (!admin.displayName) admin.displayName = 'Super Admin';
  await admin.save();
}

// USER portal: đăng ký
router.post('/user/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || '').toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    if (user) return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    user = new User({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      displayName: name,
      role: 'user',
      status: 'active'
    });
    await user.save();
    const token = signPortalToken(user, 'user', 'user');
    await logAction(user.email, 'user', 'USER_REGISTER', { user: { id: user.id, email: user.email, displayName: user.name, role: user.role } }, req.ip, req.headers['user-agent']);
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: 'user', avatar: user.avatar, status: user.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// USER portal: đăng nhập
router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase(), role: 'user' });
    if (!user) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    if (user.status === 'suspended') return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    const token = signPortalToken(user, 'user', 'user');
    await logAction(user.email, 'user', 'USER_LOGIN', { user: { id: user.id, email: user.email, displayName: user.displayName || user.name, role: user.role } }, req.ip, req.headers['user-agent']);
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: 'user', avatar: user.avatar, status: user.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/user/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy thông tin rank của user
router.get('/user/rank', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { rank, tier, nextThreshold } = calculateRank(user.points || 0);
    res.json({
      success: true,
      points: user.points || 0,
      rank: user.rank || rank,
      rankTier: user.rankTier || tier,
      nextThreshold: nextThreshold,
      claimedQuests: user.claimedQuests || [],
      // Profile fields for quest tracking
      avatar: user.avatar || '',
      displayName: user.displayName || '',
      name: user.name || '',
      phone: user.phone || ''
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy log hoạt động (để tính toán quest)
router.get('/user/activity', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, activityLog: user.activityLog || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cộng XP cho user (Duplicate logic removed, use the one at the end of file)


// BUSINESS portal: đăng ký/đăng nhập/me
router.post('/business/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || '').toLowerCase();
    // Bỏ check trùng lặp để 1 email tạo nhiều tài khoản
    let account = new BusinessAccount({
      name,
      displayName: name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      status: 'active'
    });
    await account.save();
    await logAction(account.email, 'business', 'BUSINESS_REGISTER', { email: account.email, id: account._id }, req.ip, req.headers['user-agent']);
    const token = signPortalToken(account, 'business', 'business');
    res.json({ success: true, token, user: { id: account.id, email: account.email, name: account.name, role: 'business', status: account.status, avatar: account.avatar } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/business/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const accounts = await BusinessAccount.find({ email: String(email || '').toLowerCase() });
    if (!accounts || accounts.length === 0) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    
    let matchedAccount = null;
    for (const acc of accounts) {
      const isMatch = await bcrypt.compare(password, acc.password);
      if (isMatch) {
        if (acc.status === 'suspended') {
          return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
        }
        matchedAccount = acc;
        break;
      }
    }
    
    if (!matchedAccount) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    const token = signPortalToken(matchedAccount, 'business', 'business');
    await logAction(matchedAccount.email, 'business', 'BUSINESS_LOGIN', { email: matchedAccount.email, id: matchedAccount._id }, req.ip, req.headers['user-agent']);
    res.json({ success: true, token, user: { id: matchedAccount.id, email: matchedAccount.email, name: matchedAccount.name, role: 'business', status: matchedAccount.status, avatar: matchedAccount.avatar } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/business/me', businessAuth, async (req, res) => {
  try {
    const account = await BusinessAccount.findById(req.user.id).select('-password');
    if (!account) return res.status(404).json({ success: false, message: 'Tài khoản doanh nghiệp không tồn tại' });
    res.json({ success: true, user: { ...account.toObject(), role: 'business' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN portal: đăng ký/đăng nhập/me
router.post('/admin/register', async (_req, res) => {
  return res.status(403).json({ success: false, message: 'Vui lòng dùng chức năng tạo Admin từ dashboard Super Admin' });
});

router.post('/admin/create', adminTokenAuth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Chỉ Super Admin mới được tạo tài khoản admin mới' });
    }
    const { name, email, password, permissions } = req.body;
    const normalizedEmail = String(email || '').toLowerCase();
    let account = await AdminAccount.findOne({ email: normalizedEmail });
    if (account) return res.status(400).json({ success: false, message: 'Email admin đã tồn tại' });
    account = new AdminAccount({
      name,
      displayName: name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      status: 'active',
      permissions: permissions || ['overview']
    });
    await account.save();
    await logAction(req.user.email, req.user.role, 'ADMIN_CREATED', { newAdminEmail: account.email }, req.ip, req.headers['user-agent']);
    res.json({ success: true, user: { id: account.id, email: account.email, name: account.name, role: account.role, status: account.status, avatar: account.avatar } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    await ensureDefaultAdmin();
    const { email, password } = req.body;
    const account = await AdminAccount.findOne({ email: String(email || '').toLowerCase() });
    if (!account) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    if (account.status === 'suspended') return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    const token = signPortalToken(account, 'admin', account.role);
    await logAction(account.email, account.role, 'ADMIN_LOGIN', { email: account.email, role: account.role }, req.ip, req.headers['user-agent']);
    res.json({ success: true, token, user: { id: account.id, email: account.email, name: account.name, role: account.role, status: account.status, avatar: account.avatar } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy danh sách toàn bộ Admin (cho Super Admin)
router.get('/admin/list', adminTokenAuth, async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const admins = await AdminAccount.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/admin/me', adminTokenAuth, async (req, res) => {
  try {
    const account = await AdminAccount.findById(req.user.id).select('-password');
    if (!account) return res.status(404).json({ success: false, message: 'Tài khoản admin không tồn tại' });
    res.json({ success: true, user: { ...account.toObject(), role: account.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Backward compatibility endpoints
router.post('/register', (req, res, next) => {
  req.url = '/user/register';
  next();
});
router.post('/login', (req, res, next) => {
  req.url = '/user/login';
  next();
});
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    
    // Đảm bảo các trường rank có giá trị mặc định
    if (!user.rank) user.rank = 'Đồng';
    if (!user.rankTier) user.rankTier = 'I';
    if (!user.points) user.points = 0;
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cấu hình Rank/XP
const RANK_CONFIG = [
  { rank: 'Đồng', tier: 'I', min: 0 },
  { rank: 'Đồng', tier: 'II', min: 100 },
  { rank: 'Đồng', tier: 'III', min: 200 },
  { rank: 'Bạc', tier: 'I', min: 300 },
  { rank: 'Bạc', tier: 'II', min: 500 },
  { rank: 'Bạc', tier: 'III', min: 700 },
  { rank: 'Vàng', tier: 'I', min: 1000 },
  { rank: 'Vàng', tier: 'II', min: 1300 },
  { rank: 'Vàng', tier: 'III', min: 1600 },
  { rank: 'Bạch Kim', tier: 'I', min: 2000 },
  { rank: 'Bạch Kim', tier: 'II', min: 2400 },
  { rank: 'Bạch Kim', tier: 'III', min: 2800 },
  { rank: 'Kim Cương', tier: 'I', min: 3200 },
  { rank: 'Kim Cương', tier: 'II', min: 3700 },
  { rank: 'Kim Cương', tier: 'III', min: 4200 },
  { rank: 'Huyền Thoại', tier: '', min: 5000 }
];

function getRankDetails(points) {
  let current = RANK_CONFIG[0];
  let next = null;
  for (let i = 0; i < RANK_CONFIG.length; i++) {
    if (points >= RANK_CONFIG[i].min) {
      current = RANK_CONFIG[i];
      next = RANK_CONFIG[i+1] || null;
    } else {
      break;
    }
  }
  return { current, next };
}

// Lấy thông tin Rank của User
router.get('/user/rank', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('points rank rankTier claimedQuests');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const { current, next } = getRankDetails(user.points || 0);
    
    res.json({
      success: true,
      points: user.points || 0,
      rank: user.rank || current.rank,
      rankTier: user.rankTier || current.tier,
      nextThreshold: next ? next.min : null,
      claimedQuests: user.claimedQuests || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cộng XP và thăng hạng
router.post('/user/add-xp', auth, async (req, res) => {
  try {
    const { xp, questId, reason } = req.body;
    if (typeof xp !== 'number') return res.status(400).json({ success: false, message: 'XP invalid' });

    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Tránh cộng trùng quest
    if (questId && user.claimedQuests.includes(questId)) {
      return res.status(400).json({ success: false, message: 'Quest already claimed' });
    }

    user.points = (user.points || 0) + xp;
    if (questId) user.claimedQuests.push(questId);

    // Tính toán lại hạng
    const { current } = getRankDetails(user.points);
    user.rank = current.rank;
    user.rankTier = current.tier;

    await user.save();
    
    // Log hoạt động
    await logAction(user.email, user.role, 'USER_XP_ADDED', { xp, questId, reason, newPoints: user.points }, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      points: user.points,
      rank: user.rank,
      rankTier: user.rankTier,
      message: `Đã cộng ${xp} XP! Hạng hiện tại: ${user.rank} ${user.rankTier}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cập nhật hồ sơ user
router.put('/profile', auth, async (req, res) => {
  try {
    const { displayName, notes, avatar, phone, preferences } = req.body;
    
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (displayName !== undefined) user.displayName = displayName;
    if (notes !== undefined) user.notes = notes;
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone;
    if (preferences !== undefined) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();
    await logAction(user.email, user.role, 'USER_PROFILE_UPDATED', { changed: Object.keys(req.body) }, req.ip, req.headers['user-agent']);
    res.json({ success: true, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Đổi mật khẩu user
router.put('/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu' });
    }
    
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch && oldPassword !== user.password) { // Dự phòng pass lưu md5/plain-text cũ
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng' });
    }

    // Mã hóa và lưu mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    await logAction(user.email, user.role, 'USER_PASSWORD_CHANGED', {}, req.ip, req.headers['user-agent']);
    
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Lấy bảng xếp hạng người dùng
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'user' })
      .select('name displayName avatar points rank rankTier')
      .sort({ points: -1 })
      .limit(100);
    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tải bảng xếp hạng' });
  }
});

module.exports = { router, auth, businessAuth, adminTokenAuth, sharedAuth, JWT_SECRET };
