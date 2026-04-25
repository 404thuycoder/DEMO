const express = require('express');
const router = express.Router();
const Place = require('../models/Place');
const Feedback = require('../models/Feedback');
const { businessAuth } = require('./auth');
const upload = require('../middlewares/upload');
const logAction = require('../utils/logger');
const BusinessAccount = require('../models/BusinessAccount');
const { syncBusinessXP } = require('../utils/rankUtils');

// GET /api/business/reviews — feedbacks for this business's places
router.get('/reviews', businessAuth, async (req, res) => {
  try {
    const places = await Place.find({ ownerId: req.user.id }).select('name reviews').lean();
    
    // Flatten reviews and attach place name
    const feedbacks = [];
    places.forEach(p => {
      (p.reviews || []).forEach(r => {
        feedbacks.push({
          ...r,
          placeName: p.name,
          placeId: p._id
        });
      });
    });

    // Sort by date newest
    feedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: feedbacks, places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/business/analytics — time-series data for charts
router.get('/analytics', businessAuth, async (req, res) => {
  try {
    const places = await Place.find({ ownerId: req.user.id }).lean();
    const totalViews = places.reduce((s, p) => s + (p.favoritesCount || 0), 0);
    const totalReviews = places.reduce((s, p) => s + (p.reviewCount || 0), 0);
    const avgRating = places.length
      ? (places.reduce((s, p) => s + parseFloat(p.ratingAvg || 0), 0) / places.length).toFixed(1)
      : null;
    // Build simple 7-day simulated trend from actual totals
    const trend = Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      views: Math.round((totalViews / 7) * (0.7 + Math.random() * 0.6)),
      reviews: Math.round((totalReviews / 7) * (0.7 + Math.random() * 0.6))
    }));
    res.json({ success: true, data: { totalViews, totalReviews, avgRating, totalServices: places.length, places, trend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Middleware to verify business role
// 1. Get places owned by this specific business
router.get('/places', businessAuth, async (req, res) => {
  try {
    const places = await Place.find({ ownerId: req.user.id });
    res.json({ success: true, data: places });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1b. Get stats for business dashboard
router.get('/stats', businessAuth, async (req, res) => {
  try {
    const places = await Place.find({ ownerId: req.user.id });
    const totalViews = places.reduce((sum, p) => sum + (p.favoritesCount || 0), 0);
    const totalReviews = places.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
    const avgRating = places.length > 0
      ? (places.reduce((sum, p) => sum + parseFloat(p.ratingAvg || 0), 0) / places.length).toFixed(1)
      : null;
    res.json({
      success: true,
      data: {
        totalServices: places.length,
        totalViews,
        totalReviews,
        avgRating
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Create a new place (with image upload)
router.post('/places', businessAuth, upload.array('imageFile', 10), async (req, res) => {
  try {
    let imagesArr = [];
    
    // 1. Files uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imagesArr.push('/uploads/' + file.filename);
      });
    }
    
    // 2. URLs passed as text
    if (req.body.image) {
      imagesArr.push(req.body.image);
    }
    if (req.body.images) {
      let parsedImages = req.body.images;
      if (typeof parsedImages === 'string') {
        try { parsedImages = JSON.parse(parsedImages); } catch (e) { parsedImages = [parsedImages]; }
      }
      if (Array.isArray(parsedImages)) {
        imagesArr = imagesArr.concat(parsedImages);
      }
    }
    
    imagesArr = [...new Set(imagesArr)];

    // Parse amenities from JSON string
    let amenitiesArr = [];
    if (req.body.amenities) {
      try { amenitiesArr = JSON.parse(req.body.amenities); } catch(e) { amenitiesArr = [req.body.amenities]; }
    }

    let highlights = req.body.highlights || [];
    if (typeof highlights === 'string') {
      try { highlights = JSON.parse(highlights); } catch(e) { highlights = highlights.split(',').map(h => h.trim()).filter(Boolean); }
    }

    const parseJsonArray = (field) => {
      if (typeof req.body[field] === 'string') {
        try { return JSON.parse(req.body[field]); } catch (e) { return []; }
      }
      return req.body[field] || [];
    };

    const newPlace = new Place({
      ...req.body,
      id: 'biz-' + Date.now(),
      ownerId: req.user.id,
      image: imagesArr[0] || '',
      images: imagesArr,
      highlights: highlights,
      tags: typeof req.body.tags === 'string' ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : (req.body.tags || []),
      amenities: amenitiesArr,
      top: req.body.top === 'true',
      status: 'pending',
      source: 'partner',
      amusementPlaces: parseJsonArray('amusementPlaces'),
      accommodations: parseJsonArray('accommodations'),
      diningPlaces: parseJsonArray('diningPlaces'),
      checkInSpots: parseJsonArray('checkInSpots')
    });

    await newPlace.save();
    await syncBusinessXP(req.user.id);
    await logAction('PLACE_CREATED', `Đã thêm địa điểm: ${newPlace.name}`, req);
    res.json({ success: true, data: newPlace });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Update own place (with optional image upload)
router.put('/places/:id', businessAuth, upload.array('imageFile', 10), async (req, res) => {
  try {
    const place = await Place.findOne({ id: req.params.id, ownerId: req.user.id });
    if (!place) return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm hoặc bạn không có quyền sửa.' });

    let imagesArr = place.images && place.images.length > 0 ? [...place.images] : (place.image ? [place.image] : []);

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imagesArr.push('/uploads/' + file.filename);
      });
    }

    if (req.body.images !== undefined) {
      let parsedImages = req.body.images;
      if (typeof parsedImages === 'string') {
        try { parsedImages = JSON.parse(parsedImages); } catch (e) { parsedImages = [parsedImages]; }
      }
      if (Array.isArray(parsedImages)) {
        imagesArr = parsedImages;
        if (req.files && req.files.length > 0) {
           req.files.forEach(file => imagesArr.push('/uploads/' + file.filename));
        }
      }
    } else if (req.body.image !== undefined && !req.files) {
      imagesArr = [req.body.image];
    }

    imagesArr = [...new Set(imagesArr.filter(i => Boolean(i)))];

    let highlights = req.body.highlights;
    if (highlights !== undefined) {
      if (typeof highlights === 'string') {
        try { highlights = JSON.parse(highlights); } catch(e) { highlights = highlights.split(',').map(h => h.trim()).filter(Boolean); }
      }
    }

    const parseJsonArray = (field) => {
      if (typeof req.body[field] === 'string') {
        try { return JSON.parse(req.body[field]); } catch (e) { return undefined; }
      }
      return req.body[field];
    };

    const updates = {
      ...req.body,
      image: imagesArr[0] || '',
      images: imagesArr,
      tags: typeof req.body.tags === 'string' ? req.body.tags.split(',').map(t => t.trim()) : req.body.tags,
    };
    
    const amusementPlaces = parseJsonArray('amusementPlaces');
    if (amusementPlaces !== undefined) updates.amusementPlaces = amusementPlaces;
    
    const accommodations = parseJsonArray('accommodations');
    if (accommodations !== undefined) updates.accommodations = accommodations;
    
    const diningPlaces = parseJsonArray('diningPlaces');
    if (diningPlaces !== undefined) updates.diningPlaces = diningPlaces;
    
    const checkInSpots = parseJsonArray('checkInSpots');
    if (checkInSpots !== undefined) updates.checkInSpots = checkInSpots;

    if (highlights !== undefined) updates.highlights = highlights;
    
    // If a business updates an approved place, it goes back to pending for re-review
    if (req.user.role === 'business') {
      updates.status = 'pending';
    }

    Object.assign(place, updates);
    await place.save();
    await syncBusinessXP(req.user.id);
    await logAction('PLACE_UPDATED', `Đã cập nhật địa điểm: ${place.name}`, req);
    res.json({ success: true, data: place });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Delete own place
router.delete('/places/:id', businessAuth, async (req, res) => {
  try {
    const place = await Place.findOneAndDelete({ id: req.params.id, ownerId: req.user.id });
    if (!place) return res.status(404).json({ success: false, message: 'Không thể xóa (Không tìm thấy hoặc sai quyền).' });
    await syncBusinessXP(req.user.id);
    res.json({ success: true, message: 'Đã xóa thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Get business leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topBusinesses = await BusinessAccount.find()
      .sort({ points: -1 })
      .limit(20)
      .select('name displayName points avatar')
      .lean();
    res.json({ success: true, data: topBusinesses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
