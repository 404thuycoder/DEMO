/* ============================================================
   biz-extend.js — Extended Business Dashboard Functionality
   Xử lý: navigation views, analytics, messages, promo form, CSV export
   ============================================================ */
(function () {
  'use strict';
  var API = '';
  var token = localStorage.getItem('wander_business_token');

  // ─── Helper ───────────────────────────────────────────────
  function apiFetch(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['x-auth-token'] = token;
    if (options.body && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }
    return fetch(url, options).then(function (r) { return r.json(); });
  }

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtDate(d) {
    if (!d) return '';
    var dt = new Date(d);
    return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function timeAgo(d) {
    if (!d) return '';
    var diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
    if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
    return Math.floor(diff / 86400) + ' ngày trước';
  }

  // ─── View Navigation ──────────────────────────────────────
  var VIEWS = {
    dashboard: { el: 'dashboard-view', label: 'Tổng quan' },
    services:  { el: 'dashboard-view', label: 'Dịch vụ của tôi' },
    analytics: { el: 'analytics-view', label: 'Thống kê chi tiết', load: loadAnalytics },
    messages:  { el: 'messages-view',  label: 'Tin nhắn khách hàng', load: loadMessages }
  };

  function showView(viewKey) {
    // Hide all views
    document.querySelectorAll('.biz-view').forEach(function (v) {
      v.style.display = 'none';
    });
    // Mark all nav items inactive
    document.querySelectorAll('[data-view]').forEach(function (a) {
      a.classList.remove('is-active');
    });

    var cfg = VIEWS[viewKey];
    if (!cfg) return;

    // Show target view
    var targetEl = document.getElementById(cfg.el);
    if (targetEl) targetEl.style.display = '';

    // Update active nav
    var navItem = document.querySelector('[data-view="' + viewKey + '"]');
    if (navItem) navItem.classList.add('is-active');

    // Update breadcrumb
    var bc = document.getElementById('biz-breadcrumb');
    if (bc) bc.textContent = 'Bảng điều khiển đối tác / ' + cfg.label;

    // Load data if needed
    if (cfg.load) cfg.load();
  }

  // Bind nav clicks
  document.querySelectorAll('[data-view]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      showView(a.getAttribute('data-view'));
    });
  });

  // ─── Analytics ────────────────────────────────────────────
  var analyticsData = null;

  function loadAnalytics() {
    var tbody = document.getElementById('analytics-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#94a3b8;">Đang tải...</td></tr>';

    apiFetch(API + '/api/business/analytics')
      .then(function (json) {
        if (!json.success) throw new Error(json.message || 'Lỗi');
        analyticsData = json.data;
        var d = json.data;

        // Fill stats
        var set = function (id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
        set('an-views',    (d.totalViews   || 0).toLocaleString('vi-VN'));
        set('an-reviews',  (d.totalReviews || 0).toLocaleString('vi-VN'));
        set('an-services', (d.totalServices|| 0).toLocaleString('vi-VN'));
        set('an-rating',   d.avgRating ? d.avgRating + '/5' : '—');

        // Fill table
        if (tbody) {
          if (!d.places || d.places.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#94a3b8;">Chưa có dịch vụ nào.</td></tr>';
          } else {
            tbody.innerHTML = d.places.map(function (p) {
              var statusBadge = p.status === 'approved'
                ? '<span style="background:rgba(16,185,129,0.15);color:#34d399;padding:0.2rem 0.55rem;border-radius:6px;font-size:0.72rem;font-weight:600;">✅ Đã duyệt</span>'
                : p.status === 'pending'
                ? '<span style="background:rgba(245,158,11,0.15);color:#fbbf24;padding:0.2rem 0.55rem;border-radius:6px;font-size:0.72rem;font-weight:600;">⏳ Chờ duyệt</span>'
                : '<span style="background:rgba(239,68,68,0.15);color:#f87171;padding:0.2rem 0.55rem;border-radius:6px;font-size:0.72rem;font-weight:600;">❌ Từ chối</span>';
              return '<tr>' +
                '<td><strong>' + esc(p.name) + '</strong><br><small style="color:#94a3b8;">' + esc(p.region || '') + '</small></td>' +
                '<td>' + (p.favoritesCount || 0).toLocaleString('vi-VN') + '</td>' +
                '<td>' + (p.reviewCount || 0).toLocaleString('vi-VN') + '</td>' +
                '<td>' + (p.ratingAvg ? '⭐ ' + p.ratingAvg : '—') + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '</tr>';
            }).join('');
          }
        }
      })
      .catch(function (err) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#f87171;">Lỗi tải dữ liệu: ' + esc(err.message) + '</td></tr>';
      });
  }

  // ─── CSV Export ───────────────────────────────────────────
  var btnExport = document.getElementById('btn-export-csv');
  if (btnExport) {
    btnExport.addEventListener('click', function () {
      if (!analyticsData || !analyticsData.places || analyticsData.places.length === 0) {
        alert('Chưa có dữ liệu để xuất. Hãy tải trang thống kê trước.');
        return;
      }
      var rows = [['Tên dịch vụ', 'Khu vực', 'Lượt xem', 'Đánh giá', 'Rating TB', 'Trạng thái']];
      analyticsData.places.forEach(function (p) {
        rows.push([
          p.name || '',
          p.region || '',
          p.favoritesCount || 0,
          p.reviewCount || 0,
          p.ratingAvg || '',
          p.status || ''
        ]);
      });
      var csv = rows.map(function (r) {
        return r.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
      }).join('\n');
      var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'bao-cao-dich-vu-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // ─── Promo Form ───────────────────────────────────────────
  var promoForm = document.getElementById('promo-form');
  if (promoForm) {
    promoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var title   = (document.getElementById('promo-title')   || {}).value || '';
      var message = (document.getElementById('promo-message') || {}).value || '';
      var statusEl = document.getElementById('promo-status');
      if (!title || !message) {
        if (statusEl) { statusEl.textContent = '⚠️ Vui lòng điền đủ tiêu đề và nội dung.'; statusEl.style.color = '#f59e0b'; }
        return;
      }
      var btn = promoForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Đang gửi...'; }

      apiFetch(API + '/api/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title: title, message: message, recipientType: 'ALL' })
      })
      .then(function (json) {
        if (json.success) {
          if (statusEl) { statusEl.textContent = '✅ Đã gửi thông báo thành công!'; statusEl.style.color = '#34d399'; }
          promoForm.reset();
          setTimeout(function () { if (statusEl) statusEl.textContent = ''; }, 4000);
        } else {
          if (statusEl) { statusEl.textContent = '❌ ' + (json.message || 'Gửi thất bại.'); statusEl.style.color = '#f87171'; }
        }
      })
      .catch(function () {
        if (statusEl) { statusEl.textContent = '❌ Lỗi kết nối máy chủ.'; statusEl.style.color = '#f87171'; }
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = '📨 Gửi thông báo'; }
      });
    });
  }

  // ─── Messages / Reviews ───────────────────────────────────
  function loadMessages() {
    var list = document.getElementById('messages-list');
    var countEl = document.getElementById('messages-count');
    if (list) list.innerHTML = '<div style="text-align:center;padding:3rem;color:#94a3b8;">Đang tải phản hồi...</div>';

    apiFetch(API + '/api/business/reviews')
      .then(function (json) {
        if (!json.success) throw new Error(json.message || 'Lỗi');
        var reviews = json.data || [];
        if (countEl) countEl.textContent = reviews.length + ' phản hồi';

        if (!list) return;
        if (reviews.length === 0) {
          list.innerHTML = '<div style="text-align:center;padding:3rem;color:#94a3b8;"><div style="font-size:2rem;margin-bottom:0.75rem;">📭</div>Chưa có phản hồi nào từ khách hàng.</div>';
          return;
        }

        list.innerHTML = reviews.map(function (r) {
          var initials = (r.name || 'Ẩn')[0].toUpperCase();
          var colors = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#0ea5e9'];
          var color = colors[initials.charCodeAt(0) % colors.length];
          return '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.25rem;display:flex;gap:1rem;align-items:flex-start;">' +
            '<div style="width:40px;height:40px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;">' + initials + '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.4rem;flex-wrap:wrap;">' +
                '<strong style="font-size:0.9rem;">' + esc(r.name || 'Khách ẩn danh') + '</strong>' +
                '<span style="font-size:0.75rem;color:#94a3b8;">' + (r.email && r.email !== 'Không cung cấp' ? esc(r.email) : '') + '</span>' +
                '<span style="margin-left:auto;font-size:0.75rem;color:#94a3b8;">' + timeAgo(r.createdAt) + '</span>' +
              '</div>' +
              '<p style="margin:0;font-size:0.875rem;color:#cbd5e1;line-height:1.6;">' + esc(r.message) + '</p>' +
            '</div>' +
          '</div>';
        }).join('');
      })
      .catch(function (err) {
        if (list) list.innerHTML = '<div style="text-align:center;padding:3rem;color:#f87171;">Lỗi tải dữ liệu: ' + esc(err.message) + '</div>';
      });
  }

  // ─── User landing page: load real stats ──────────────────
  // (Only runs on port 3000 / user portal)
  function loadPublicStats() {
    var statEls = {
      users:   document.querySelector('.stat-number[data-stat="users"]'),
      places:  document.querySelector('.stat-number[data-stat="places"]'),
      reviews: document.querySelector('.stat-number[data-stat="reviews"]')
    };
    if (!statEls.users && !statEls.places) return; // Not on user landing page

    fetch(API + '/api/public/stats')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (!json.success) return;
        var d = json.data;
        if (statEls.users  && d.userCount  !== undefined) statEls.users.textContent  = (d.userCount  || 0).toLocaleString('vi-VN') + '+';
        if (statEls.places && d.placeCount !== undefined) statEls.places.textContent = (d.placeCount || 0).toLocaleString('vi-VN') + '+';
        if (statEls.reviews && d.feedbackCount !== undefined) statEls.reviews.textContent = (d.feedbackCount || 0).toLocaleString('vi-VN') + '+';
      })
      .catch(function () { /* fail silently on user page */ });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadPublicStats();
  });

})();
