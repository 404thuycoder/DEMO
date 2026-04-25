/**
 * WanderViệt Shared UI Logic
 * Theme, Toast, Notifications, Rank Badges, Common Modals
 */

window.WanderUI = (function () {
  'use strict';

  const STORAGE_THEME = 'wander_theme';

  // ─── Global Fetch Interceptor for Suspension ─────────────────────────────
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
    
    try {
      // Bỏ qua các endpoint đăng nhập/đăng ký để form auth tự xử lý và hiện lỗi trực tiếp
      if (url.includes('/login') || url.includes('/register') || url.includes('/create')) {
        return response;
      }

      const clone = response.clone();
      const data = await clone.json();
      if (response.status === 403 && data && data.message && data.message.includes('bị khóa')) {
        showSuspendedModal();
      }
    } catch(e) { }
    return response;
  };

  function showSuspendedModal() {
    let modal = document.getElementById('wander-suspended-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'wander-suspended-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(12px);';
      modal.innerHTML = `
        <div style="background:var(--bg-elevated,#1e293b);border-radius:24px;width:min(400px,90vw);padding:2.5rem 2rem;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.5);border:1px solid rgba(244,63,94,0.4);">
          <div style="font-size:3.5rem;margin-bottom:1rem;filter:drop-shadow(0 0 12px rgba(244,63,94,0.5));">🔒</div>
          <h2 style="color:#f43f5e;margin:0 0 1rem 0;font-size:1.6rem;font-weight:700;">Tài khoản bị khóa</h2>
          <p style="color:var(--text-muted,#94a3b8);margin:0 0 2rem 0;line-height:1.6;font-size:0.95rem;">Tài khoản của bạn đã bị quản trị viên khóa do phát hiện dấu hiệu vi phạm chính sách của WanderViệt. Vui lòng đăng xuất.</p>
          <button onclick="WanderUI.forceLogout,
    trackQuestActivity: function(key, value) {
      try {
        var data = JSON.parse(localStorage.getItem('wv_quest_activity') || '{}');
        data[key] = Math.max(data[key] || 0, value || 1);
        localStorage.setItem('wv_quest_activity', JSON.stringify(data));
      } catch(e) {}
    }()" style="background:#f43f5e;color:white;border:none;padding:0.9rem 2rem;border-radius:12px;font-weight:600;font-size:1.05rem;cursor:pointer;width:100%;transition:all 0.2s;box-shadow:0 8px 24px rgba(244,63,94,0.3);">Đăng Xuất Ngay</button>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
  }

  function forceLogout() {
    localStorage.removeItem('wander_token');
    localStorage.removeItem('wander_session');
    sessionStorage.clear();
    // Chuyển hướng về trang chủ và mở form đăng nhập
    window.location.href = '/?login=true';
  }


  // ─── Theme ───────────────────────────────────────────────────────────────
  function setTheme(theme, syncWithBackend = false) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
    if (syncWithBackend) {
      const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token');
      if (token) {
        fetch('/api/auth/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
          body: JSON.stringify({ theme })
        }).catch(err => console.debug('Sync theme failed:', err));
      }
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark', true);
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved) {
      setTheme(saved);
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }

  // ─── Toast ───────────────────────────────────────────────────────────────
  function getToastContainer() {
    let c = document.getElementById('wander-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'wander-toast-container';
      c.style.cssText = 'position:fixed;bottom:2rem;right:2rem;display:flex;flex-direction:column;gap:0.75rem;z-index:99999;pointer-events:none;';
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type = 'info') {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `wander-toast wander-toast--${type}`;
    toast.innerHTML = `<div class="wander-toast__content">${message}</div><button class="wander-toast__close">&times;</button>`;
    container.appendChild(toast);
    toast.querySelector('.wander-toast__close').onclick = () => toast.remove();
    setTimeout(() => {
      toast.classList.add('wander-toast--fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // ─── Button Loading ───────────────────────────────────────────────────────
  function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.classList.add('btn-loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
    }
  }

  // ─── Notifications ────────────────────────────────────────────────────────
  async function fetchNotifications() {
    const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token');
    if (!token) return { success: false };
    try {
      const res = await fetch('/api/notifications', { headers: { 'x-auth-token': token } });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  }

  async function updateNotificationBadge() {
    const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/unread-count', { headers: { 'x-auth-token': token } });
      const json = await res.json();
      const badge = document.querySelector('[data-notif-badge]');
      if (badge) {
        if (json.count > 0) {
          badge.textContent = json.count > 20 ? '20+' : json.count;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (e) { /* ignore */ }
  }

  function createNotificationDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'wander-notif-drawer';
    drawer.className = 'wander-notif-drawer';
    drawer.innerHTML = `
      <div class="wander-notif-drawer__header">
        <h3>Thông báo</h3>
        <button class="wander-notif-drawer__close" onclick="WanderUI.toggleNotificationDrawer()">&times;</button>
      </div>
      <div class="wander-notif-drawer__body" id="wander-notif-body">
        <div class="wander-notif-loading">Đang tải...</div>
      </div>
    `;
    document.body.appendChild(drawer);
    return drawer;
  }

  async function renderNotifications() {
    const body = document.getElementById('wander-notif-body');
    if (!body) return;
    const json = await fetchNotifications();
    if (!json.success || !json.data || !json.data.length) {
      body.innerHTML = '<div class="wander-notif-empty">Không có thông báo mới</div>';
      return;
    }
    body.innerHTML = json.data.map(notif => `
      <div class="wander-notif-item wander-notif-item--${notif.type} ${notif.isRead ? '' : 'is-unread'}"
           onclick="WanderUI.markAsRead('${notif._id}', '${notif.link}')">
        <div class="wander-notif-item__icon"></div>
        <div class="wander-notif-item__content">
          <div class="wander-notif-item__title">${notif.title}</div>
          <div class="wander-notif-item__message">${notif.message}</div>
          <div class="wander-notif-item__time">${new Date(notif.createdAt).toLocaleDateString('vi-VN')}</div>
        </div>
      </div>
    `).join('');
  }

  function toggleNotificationDrawer() {
    const drawer = document.getElementById('wander-notif-drawer') || createNotificationDrawer();
    const isOpen = drawer.classList.contains('is-open');
    if (!isOpen) {
      renderNotifications();
      drawer.style.display = 'flex';
      requestAnimationFrame(() => drawer.classList.add('is-open'));
    } else {
      drawer.classList.remove('is-open');
      setTimeout(() => { drawer.style.display = 'none'; }, 300);
    }
  }

  async function markAsRead(id, link) {
    const token = localStorage.getItem('wander_token') || localStorage.getItem('wander_admin_token');
    await fetch(`/api/notifications/read/${id}`, { method: 'PUT', headers: { 'x-auth-token': token } });
    updateNotificationBadge();
    if (link) window.location.href = link;
    else renderNotifications();
  }

  // ─── Rank Badges ──────────────────────────────────────────────────────────
  function getRankIcon(rank) {
    if (!rank) return '🏅';
    if (rank.includes('Đồng')) return '🥉';
    if (rank.includes('Bạc')) return '🥈';
    if (rank.includes('Vàng')) return '🥇';
    if (rank.includes('Bạch Kim')) return '💎';
    if (rank.includes('Kim Cương')) return '💠';
    if (rank.includes('Huyền Thoại')) return '👑';
    return '🏅';
  }

  function getRankBadgeHTML(rank, tier) {
    if (!rank) return '';
    const tierKey = (tier === 'I' || tier === '1') ? '1' :
                    (tier === 'II' || tier === '2') ? '2' :
                    (tier === 'III' || tier === '3') ? '3' : '1';
    let rankClass = 'rank-bronze-1';
    if (rank.includes('Đồng')) rankClass = `rank-bronze-${tierKey}`;
    else if (rank.includes('Bạch Kim')) rankClass = `rank-platinum-${tierKey}`;
    else if (rank.includes('Bạc')) rankClass = `rank-silver-${tierKey}`;
    else if (rank.includes('Vàng')) rankClass = `rank-gold-${tierKey}`;
    else if (rank.includes('Kim Cương')) rankClass = `rank-diamond-${tierKey}`;
    else if (rank.includes('Huyền Thoại')) rankClass = 'rank-legendary';
    return `<div class="rank-badge-container"><div class="rank-sprite ${rankClass}"></div><span class="rank-text">${rank}${tier ? ' ' + tier : ''}</span></div>`;
  }

  // ─── Leaderboard ──────────────────────────────────────────────────────────
  function showLeaderboard() {
    let modal = document.getElementById('wander-leaderboard-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'wander-leaderboard-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);';
      modal.innerHTML = `
        <div style="background:var(--bg-elevated,#1e293b);border-radius:24px;width:min(480px,94vw);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.4);border:1px solid var(--border,rgba(255,255,255,0.1));">
          <div style="padding:1.5rem;border-bottom:1px solid var(--border,rgba(255,255,255,0.1));display:flex;align-items:center;justify-content:space-between;">
            <h3 style="margin:0;font-size:1.2rem;font-weight:700;">🏆 Bảng Xếp Hạng</h3>
            <button onclick="document.getElementById('wander-leaderboard-modal').style.display='none'" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-muted);">✕</button>
          </div>
          <div id="wander-lb-body" style="flex:1;overflow-y:auto;padding:1rem;"></div>
        </div>`;
      modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    const body = document.getElementById('wander-lb-body');
    body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">Đang tải...</div>';
    const token = localStorage.getItem('wander_token') || '';
    fetch('/api/auth/leaderboard', { headers: { 'x-auth-token': token } })
      .then(r => r.json())
      .then(json => {
        if (!json.success || !json.leaderboard || !json.leaderboard.length) {
          body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">Chưa có dữ liệu bảng xếp hạng.</div>';
          return;
        }
        const RANK_ICONS = { 'Đồng': '🥉', 'Bạc': '🥈', 'Vàng': '🥇', 'Bạch Kim': '💎', 'Kim Cương': '💠', 'Huyền Thoại': '👑' };
        body.innerHTML = json.leaderboard.slice(0, 100).map((u, i) => {
          const pos = i + 1;
          const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`;
          const rankIcon = RANK_ICONS[u.rank] || '🏅';
          const name = u.displayName || u.name || 'Ẩn danh';
          const tierStr = (u.rankTier && u.rankTier !== '') ? ' ' + u.rankTier : '';
          return `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.85rem 0.5rem;border-radius:12px;border-bottom:1px solid var(--border,rgba(255,255,255,0.07));" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
            <span style="min-width:32px;text-align:center;font-size:${pos <= 3 ? '1.4rem' : '0.9rem'};font-weight:700;">${medal}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">${rankIcon} ${u.rank || 'Đồng'}${tierStr}</div>
            </div>
            <span style="font-weight:700;color:var(--primary,#3b82f6);font-size:0.9rem;">${u.points || 0} XP</span>
          </div>`;
        }).join('');
      })
      .catch(() => { body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--danger,#ef4444);">Lỗi tải dữ liệu.</div>'; });
  }

  // ─── Visual Search ────────────────────────────────────────────────────────
  function openVisualSearch() {
    let overlay = document.getElementById('wander-visual-search-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'wander-visual-search-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(12px);';
      overlay.innerHTML = `
        <div style="background:var(--bg-elevated,#1e293b);border-radius:24px;width:min(480px,94vw);padding:2rem;box-shadow:0 24px 64px rgba(0,0,0,0.3);text-align:center;">
          <h3 style="margin:0 0 1rem;font-size:1.2rem;">📷 Tìm kiếm bằng hình ảnh</h3>
          <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem;">Tải ảnh địa điểm lên và AI sẽ gợi ý điểm đến phù hợp</p>
          <label style="display:block;border:2px dashed var(--border,rgba(255,255,255,0.2));border-radius:16px;padding:2rem;cursor:pointer;transition:border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border,rgba(255,255,255,0.2))'">
            <input type="file" accept="image/*,.heic,.heif,.avif,.bmp,.tiff" id="visual-search-file" style="display:none;" onchange="WanderUI._handleVisualSearch(this)">
            <div style="font-size:3rem;">🌄</div>
            <div style="font-weight:600;margin-top:0.5rem;">Nhấn để chọn ảnh</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem;">Hỗ trợ: JPG, PNG, WEBP, HEIC, AVIF...</div>
          </label>
          <div id="visual-search-result" style="margin-top:1rem;min-height:40px;"></div>
          <button onclick="document.getElementById('wander-visual-search-overlay').style.display='none'" style="margin-top:1rem;background:none;border:1px solid var(--border,rgba(255,255,255,0.2));border-radius:8px;padding:0.5rem 1.5rem;cursor:pointer;color:var(--text-muted);">Đóng</button>
        </div>`;
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  }

  function _handleVisualSearch(input) {
    const result = document.getElementById('visual-search-result');
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    const reader = new FileReader();
    
    // Preview the uploaded image immediately
    result.innerHTML = `
      <div style="margin:1.5rem 0;text-align:center;animation:fadeIn 0.3s ease;">
        <div style="position:relative;display:inline-block;">
          <img src="${URL.createObjectURL(file)}" id="visual-search-preview" style="max-width:100%;max-height:200px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);border:2px solid var(--primary);">
          <div class="visual-search-spinner" style="position:absolute;top:50%;left:50%;margin-left:-20px;margin-top:-20px;"></div>
        </div>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-top:1rem;">⏳ AI đang phân tích hình ảnh của bạn...</p>
      </div>`;
    
    reader.onload = function(e) {
      const base64 = e.target.result;
      const token = localStorage.getItem('wander_token') || '';
      
      fetch('/api/vision/search', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token 
        }, 
        body: JSON.stringify({ image: base64 }) 
      })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.matches && data.matches.length > 0) {
          let html = `
            <div style="text-align:left;animation:fadeIn 0.4s ease;">
              <div style="background:linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1));padding:1.25rem;border-radius:16px;border:1px solid rgba(16,185,129,0.2);margin-bottom:1.5rem;">
                <p style="margin:0;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:#10b981;font-weight:800;">Phân tích từ AI:</p>
                <p style="margin:0.25rem 0 0.5rem;font-size:1.15rem;font-weight:800;">${data.identifiedName}</p>
                <p style="margin:0;font-size:0.85rem;font-style:italic;color:var(--text-muted);line-height:1.4;">"${data.analysis?.vibeDescription || 'Cảm nhận được không gian đặc trưng của Việt Nam.'}"</p>
              </div>
              <p style="font-weight:700;margin-bottom:1rem;font-size:0.9rem;display:flex;align-items:center;gap:0.5rem;">
                <span style="color:var(--primary);">✨</span> Điểm đến tương đồng nhất:
              </p>
              <div style="display:flex;flex-direction:column;gap:0.75rem;">
          `;
          
          data.matches.forEach(m => {
            html += `
              <div class="visual-result-card" onclick="WanderUI._goToPlace('${m.id}')">
                <img src="${m.image}" class="visual-result-card__img" alt="">
                <div class="visual-result-card__info">
                  <div class="visual-result-card__name">${m.name}</div>
                  <div class="visual-result-card__meta">📍 ${m.province || m.region}</div>
                  <div class="visual-result-card__score">Độ tương đồng: ${Math.min(100, m.relevanceScore * 5)}%</div>
                </div>
                <div class="visual-result-card__arrow">→</div>
              </div>
            `;
          });
          
          html += '</div></div>';
          result.innerHTML = html;
        } else {
          result.innerHTML = `
            <div style="padding:2rem;text-align:center;">
              <div style="font-size:2.5rem;margin-bottom:1rem;">🤔</div>
              <div style="color:var(--text-muted);font-size:0.9rem;">WanderViệt chưa tìm được điểm đến nào giống hệt ảnh này. Bạn thử một tấm ảnh khác rõ hơn nhé!</div>
            </div>`;
        }
      })
      .catch(err => { 
        console.error(err);
        result.innerHTML = '<div style="color:var(--danger,#ef4444);font-size:0.9rem;padding:1rem;background:rgba(239,68,68,0.1);border-radius:12px;">❌ Lỗi kết nối máy chủ AI. Vui lòng thử lại sau.</div>'; 
      });
    };
    
    reader.onerror = () => {
      result.innerHTML = '<div style="color:var(--danger,#ef4444);">Lỗi đọc file hình ảnh.</div>';
    };
    
    reader.readAsDataURL(file);
  }

  function _goToPlace(id) {
    // Close modal
    const overlay = document.getElementById('wander-visual-search-overlay');
    if (overlay) overlay.style.display = 'none';
    
    // Open place modal (assuming it's defined in main.js or globally)
    if (typeof openPlaceModal === 'function') {
      openPlaceModal(id);
    } else {
      window.location.href = `places.html?id=${id}`;
    }
  }

  // ─── Component Injection ──────────────────────────────────────────────────
  function injectCommonComponents() {
    if (document.getElementById('modal-auth')) return;

    const components = `
      <div class="modal-backdrop" data-modal-backdrop hidden></div>

      <div class="modal" id="modal-auth" data-modal="auth" role="dialog" aria-modal="true" aria-labelledby="auth-title" hidden>
        <div class="modal__inner">
          <div class="modal__header">
            <h2 id="auth-title" class="modal__title">Tài khoản WanderViệt</h2>
            <button type="button" class="modal__close" data-modal-close aria-label="Đóng">×</button>
          </div>
          <div class="modal__body">
            <p class="modal__lede">Hệ thống bảo mật WanderViệt. Đăng nhập để đồng bộ lịch trình và ưu đãi của bạn.</p>
            <div class="auth-tabs" role="tablist" style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem">
              <button type="button" class="auth-tab is-active" role="tab" data-auth-tab="login" aria-selected="true" style="padding:0.4rem; font-size:0.9rem">Đăng nhập</button>
              <button type="button" class="auth-tab" role="tab" data-auth-tab="register" aria-selected="false" style="padding:0.4rem; font-size:0.9rem">Đăng ký mới</button>
            </div>
            <form class="auth-panel" data-auth-panel="login">
              <label class="field"><span class="field-label">Email</span><input type="email" name="email" required autocomplete="email" /></label>
              <label class="field"><span class="field-label">Mật khẩu</span><input type="password" name="password" required autocomplete="current-password" /></label>
              <button type="submit" class="btn btn--primary btn--block">Đăng nhập</button>
              <p class="auth-msg" data-auth-msg-login role="status"></p>
            </form>
            <form class="auth-panel" data-auth-panel="register" hidden>
              <label class="field"><span class="field-label">Họ tên</span><input type="text" name="name" required autocomplete="name" /></label>
              <label class="field"><span class="field-label">Email</span><input type="email" name="email" required autocomplete="email" /></label>
              <label class="field"><span class="field-label">Mật khẩu</span><input type="password" name="password" required autocomplete="new-password" minlength="4" /></label>
              <input type="hidden" name="isBusiness" value="false" />
              <button type="submit" class="btn btn--primary btn--block">Tạo tài khoản Khách hàng</button>
              <p class="auth-msg" data-auth-msg-register role="status"></p>
            </form>
          </div>
        </div>
      </div>

      <div class="modal" id="modal-settings" data-modal="settings" role="dialog" aria-modal="true" aria-labelledby="settings-title" hidden>
        <div class="modal__inner modal__inner--wide">
          <div class="modal__header">
            <h2 id="settings-title" class="modal__title">⚙️ Cài đặt hệ thống</h2>
            <button type="button" class="modal__close" data-modal-close aria-label="Đóng">×</button>
          </div>
          <div class="modal__body settings-layout">
            <div class="settings-sidebar">
              <button class="settings-nav-btn is-active" data-settings-tab="profile">👤 Hồ sơ</button>
              <button class="settings-nav-btn" data-settings-tab="security">🔒 Bảo mật</button>
              <button class="settings-nav-btn" data-settings-tab="appearance">🌓 Giao diện</button>
              <button class="settings-nav-btn" data-settings-tab="notifications">🔔 Thông báo</button>
              <button class="settings-nav-btn" data-settings-tab="privacy">🔐 Quyền & Riêng tư</button>
            </div>
            <div class="settings-main">
              <div class="settings-panel is-active" data-settings-panel="profile">
                <h3>Hồ sơ cá nhân</h3>
                <form data-profile-form-v2>
                  <div class="avatar-upload-wrap">
                    <div class="avatar-upload-preview" data-avatar-preview>
                      <img src="" alt="Ảnh đại diện" data-avatar-preview-img hidden />
                      <span data-avatar-preview-initial>?</span>
                    </div>
                    <div class="avatar-upload-actions">
                      <label class="avatar-file-label" for="avatar-file-input">Chọn ảnh</label>
                      <input id="avatar-file-input" type="file" name="avatarFile" accept="image/*" data-avatar-file-input class="visually-hidden" />
                      <button type="button" class="btn btn--ghost btn--small" data-avatar-remove>Xóa ảnh</button>
                    </div>
                  </div>
                  <label class="field"><span class="field-label">Họ tên hiển thị</span><input type="text" name="displayName" /></label>
                  <label class="field"><span class="field-label">Số điện thoại</span><input type="tel" name="phone" /></label>
                  <label class="field"><span class="field-label">Ghi chú</span><textarea name="notes" rows="2"></textarea></label>
                  <button type="submit" class="btn btn--primary btn--block">Lưu hồ sơ</button>
                </form>
              </div>
              <div class="settings-panel" data-settings-panel="security" hidden>
                <h3>Tài khoản & Bảo mật</h3>
                <form data-password-form-v2>
                  <label class="field"><span class="field-label">Mật khẩu cũ</span><input type="password" name="oldPassword" required /></label>
                  <label class="field"><span class="field-label">Mật khẩu mới</span><input type="password" name="newPassword" required minlength="6" /></label>
                  <button type="submit" class="btn btn--primary">Đổi mật khẩu</button>
                  <p data-password-status-v2 role="status" style="margin-top:0.5rem; font-size:0.9rem"></p>
                </form>
              </div>
              <div class="settings-panel" data-settings-panel="appearance" hidden>
                <h3>Tùy chỉnh Giao diện</h3>
                <div class="appearance-grid">
                  <div class="theme-option" data-theme-set="light">
                    <div class="theme-preview theme-preview--light"></div>
                    <span>Sáng (Light)</span>
                  </div>
                  <div class="theme-option is-active" data-theme-set="dark">
                    <div class="theme-preview theme-preview--dark"></div>
                    <span>Tối (Dark)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="slide-drawer" id="modal-place" data-modal="place" role="dialog" aria-modal="true" aria-labelledby="place-title" hidden>
        <div class="slide-drawer__inner slide-drawer__inner--wide">
          <div class="slide-drawer__header">
            <button type="button" class="slide-drawer__close" data-modal-close aria-label="Đóng">×</button>
          </div>
          <div class="slide-drawer__body"><div data-place-detail></div></div>
        </div>
      </div>

      <div class="chat-fab-wrap">
        <button type="button" class="chat-fab" data-chat-toggle aria-expanded="false" aria-controls="chat-panel">
          <span aria-hidden="true">💬</span>
        </button>
        <div id="chat-panel" class="chat-panel" data-chat-panel hidden>
          <div class="chat-panel__head">
            <div class="chat-panel__head-left">
              <strong>Trợ lý WanderViệt</strong>
            </div>
            <div class="chat-panel__head-actions">
              <div class="chat-lang-switcher" title="Chọn ngôn ngữ">
                <button type="button" class="btn-icon-sm chat-lang-btn">🌐 <span class="current-lang-code">VI</span></button>
                <div class="chat-lang-dropdown">
                  <button type="button" data-lang="auto">Auto (Tự nhận diện)</button>
                  <button type="button" data-lang="vi">Tiếng Việt (VI)</button>
                  <button type="button" data-lang="en">English (EN)</button>
                  <button type="button" data-lang="jp">日本語 (JP)</button>
                  <button type="button" data-lang="kr">한국어 (KR)</button>
                  <button type="button" data-lang="fr">Français (FR)</button>
                </div>
              </div>
              <button type="button" class="btn-icon-sm" data-chat-new-btn title="Đoạn chat mới">➕</button>
              <button type="button" class="btn-icon-sm" data-chat-history-btn title="Lịch sử chat">🕒</button>
              <button type="button" class="chat-panel__close" data-chat-toggle aria-label="Đóng chat">×</button>
            </div>
          </div>
          <div class="chat-log" data-chat-log role="log"></div>
          <form class="chat-form" data-chat-form>
            <input type="text" data-chat-input placeholder="Hỏi về du lịch Việt Nam…" autocomplete="off" />
            <button type="submit" class="btn btn--primary btn--small">Gửi</button>
          </form>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = components;
    while (wrapper.firstChild) {
      document.body.appendChild(wrapper.firstChild);
    }
  }

  function initNavigation() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    const hash = window.location.hash;
    
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      const hrefBase = href.split('#')[0];
      const hrefHash = href.includes('#') ? '#' + href.split('#')[1] : '';
      
      let isActive = false;
      if (href === page || (page === 'index.html' && href === 'index.html')) {
        isActive = true;
      } else if (hrefBase === page && (!hrefHash || hrefHash === hash)) {
        isActive = true;
      } else if (page === 'index.html' && hrefBase === 'index.html') {
        // Handle cases where we are on index.html but link points to index.html#something
        if (!hrefHash || hrefHash === hash) isActive = true;
      }

      if (isActive) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ─── Auth UI Sync (Global) ────────────────────────────────────────────────
  function syncAuthUI() {
    const token = localStorage.getItem("wander_token");
    const authBtns = document.querySelectorAll("[data-auth-hide]");
    const profileTrays = document.querySelectorAll("[data-auth-show]");
    const userNameEl = document.querySelector("[data-user-name]");
    const userAvatarImg = document.querySelector("[data-user-avatar]");
    const userInitial = document.querySelector("[data-user-initial]");
    const headerRankEl = document.getElementById('header-user-rank');

    if (!token) {
      authBtns.forEach(el => el.style.display = "flex");
      profileTrays.forEach(el => el.style.display = "none");
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const payload = JSON.parse(decodeURIComponent(escape(atob(base64 + padding))));
      const u = payload.user || payload.account || payload;
      const role = (u.role || "").toLowerCase();
      
      // Portal Guard
      if (role !== 'user' && role !== 'traveler' && role !== 'admin' && role !== 'superadmin') {
        localStorage.removeItem("wander_token");
        authBtns.forEach(el => el.style.display = "flex");
        profileTrays.forEach(el => el.style.display = "none");
        return;
      }

      // Show profile, hide auth
      authBtns.forEach(el => el.style.display = "none");
      profileTrays.forEach(el => {
        el.style.display = "flex";
        el.removeAttribute('hidden');
      });

      const dis = u.name || u.email || "User";
      if (userNameEl) userNameEl.textContent = dis;
      if (userInitial) userInitial.textContent = dis.charAt(0).toUpperCase();

      // Fetch full details
      fetch('/api/auth/user/me', { headers: { 'x-auth-token': token } })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.user) {
            const user = d.user;
            const fullDis = user.displayName || user.name || user.email || "User";
            if (userNameEl) {
              userNameEl.innerHTML = fullDis.replace(/</g, '&lt;') + '<span>' + (user.email || "").replace(/</g, '&lt;') + '</span>';
            }
            if (userAvatarImg && user.avatar) {
              userAvatarImg.src = user.avatar;
              userAvatarImg.style.display = 'block';
              userAvatarImg.removeAttribute('hidden');
              if (userInitial) userInitial.style.display = 'none';
            }
            // Update rank text if it's currently showing user name
            const rankText = document.querySelector('#header-user-rank .rank-text');
            if (rankText) rankText.innerText = fullDis;
          }
        }).catch(() => {});

      // Fetch Rank
      if (headerRankEl) {
        fetch('/api/auth/user/rank', { headers: { 'x-auth-token': token } })
          .then(r => r.json())
          .then(rankData => {
            if (rankData.success) {
              headerRankEl.innerHTML = getRankBadgeHTML(rankData.rank, rankData.rankTier);
              const rankText = headerRankEl.querySelector('.rank-text');
              if (rankText) {
                rankText.innerText = window.wanderCurrentUserName || dis;
                rankText.style.fontSize = '0.9rem';
              }
              const sprite = headerRankEl.querySelector('.rank-sprite');
              if (sprite) {
                sprite.style.transform = 'scale(0.55)';
                sprite.style.margin = '-18px';
              }
              headerRankEl.style.display = 'inline-flex';
            }
          }).catch(() => {});
      }
    } catch (e) {
      console.error("Auth sync error", e);
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  injectCommonComponents();
  initNavigation();
  updateNotificationBadge();
  syncAuthUI();
  
  window.addEventListener('hashchange', initNavigation);
  setInterval(updateNotificationBadge, 60000);
  initTheme();

  // ─── Inject CSS & Filters ──────────────────────────────────────────────────
  (function injectSharedStyles() {
    if (!document.getElementById('rank-filter-svg')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'rank-filter-svg';
      svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
      svg.setAttribute('version', '1.1');
      svg.innerHTML = `
        <defs>
          <filter id="remove-black" color-interpolation-filters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0 
                                                 0 1 0 0 0 
                                                 0 0 1 0 0 
                                                 2.5 2.5 2.5 0 -1.5" />
          </filter>
        </defs>`;
      document.body.appendChild(svg);
    }

    if (document.getElementById('wander-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'wander-shared-styles';
    style.textContent = `
      .wander-toast {
        pointer-events: auto; min-width: 300px; padding: 1rem 1.25rem; border-radius: 14px;
        background: rgba(30,41,59,0.95); backdrop-filter: blur(20px);
        color: #f1f5f9; box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center;
        justify-content: space-between; gap: 1rem;
        animation: wander-toast-in 0.4s cubic-bezier(0.18,0.89,0.32,1.28);
        font-family: system-ui, sans-serif; font-size: 0.9rem;
      }
      .wander-toast--success { border-left: 4px solid #10b981; }
      .wander-toast--error   { border-left: 4px solid #ef4444; }
      .wander-toast--info    { border-left: 4px solid #3b82f6; }
      .wander-toast--warning { border-left: 4px solid #f59e0b; }
      .wander-toast__close   { background: none; border: none; cursor: pointer; opacity: 0.6; font-size: 1.2rem; color: inherit; flex-shrink:0; }
      .wander-toast--fade-out { opacity: 0; transform: translateX(20px); transition: all 0.4s ease; }
      @keyframes wander-toast-in { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

      .rank-badge-container { display: inline-flex; align-items: center; gap: 8px; }
      .rank-sprite {
        width: 80px; height: 80px;
        background-size: contain; background-repeat: no-repeat; background-position: center;
        flex-shrink: 0; display: inline-block; position: relative;
        filter: url(#remove-black) drop-shadow(0 0 2px rgba(0,0,0,0.8)) drop-shadow(0 0 8px rgba(0,0,0,0.5));
      }
      .rank-text { font-weight: 700; font-size: 0.9rem; letter-spacing: 0.5px; color: var(--text); }

      .rank-bronze-1, .rank-bronze-2, .rank-bronze-3 { background-image: url('assets/img/rank_bronze.png'); }
      .rank-silver-1, .rank-silver-2, .rank-silver-3 { background-image: url('assets/img/rank_silver.png'); }
      .rank-gold-1, .rank-gold-2, .rank-gold-3 { background-image: url('assets/img/rank_gold.png'); }
      .rank-platinum-1, .rank-platinum-2, .rank-platinum-3 { background-image: url('assets/img/rank_platinum.png'); }
      .rank-diamond-1, .rank-diamond-2, .rank-diamond-3 { background-image: url('assets/img/rank_diamond.png'); }
      .rank-legendary {
        background-image: url('assets/img/rank-sprites.png');
        background-size: 256px 170.5px;
        background-position: -181px -106px;
        width: 80px; height: 80px;
        filter: url(#remove-black) drop-shadow(0 0 4px rgba(0,0,0,0.9)) drop-shadow(0 0 15px rgba(168, 85, 247, 0.7));
        -webkit-mask-image: radial-gradient(circle at 50% 45%, black 45%, transparent 68%);
        mask-image: radial-gradient(circle at 50% 45%, black 45%, transparent 68%);
        clip-path: inset(0 0 18% 0);
        transform: scale(1.6);
        transform-origin: center 40%;
      }

      .wander-notif-drawer {
        position: fixed; top: 0; right: 0; width: 380px; height: 100vh;
        background: var(--bg-elevated, #1e293b); box-shadow: -10px 0 40px rgba(0,0,0,0.3);
        z-index: 10000; display: none; flex-direction: column;
        transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
        border-left: 1px solid var(--border, rgba(255,255,255,0.1));
      }
      .wander-notif-drawer.is-open { transform: translateX(0); }
      .wander-notif-drawer__header { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border, rgba(255,255,255,0.1)); }
      .wander-notif-drawer__close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); }
      .wander-notif-drawer__body { flex: 1; overflow-y: auto; padding: 0.5rem; }
      .wander-notif-item { padding: 1rem; border-radius: 12px; cursor: pointer; transition: background 0.2s; display: flex; gap: 0.75rem; margin-bottom: 0.5rem; }
      .wander-notif-item:hover { background: rgba(255,255,255,0.05); }
      .wander-notif-item.is-unread { background: rgba(59,130,246,0.08); }
      .wander-notif-item__title { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.2rem; }
      .wander-notif-item__message { font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; }
      .wander-notif-item__time { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem; }
      .wander-notif-badge {
        position: absolute; top: -5px; right: -5px; background: #ef4444;
        color: #fff; font-size: 10px; font-weight: 700; width: 18px; height: 18px;
        border-radius: 50%; display: none; align-items: center; justify-content: center;
        border: 2px solid var(--bg, #0f172a);
      }

      .btn-loading { position: relative; color: transparent !important; pointer-events: none; }
      .btn-loading::after {
        content: ""; position: absolute;
        width: 1.1rem; height: 1.1rem;
        top: calc(50% - 0.55rem); left: calc(50% - 0.55rem);
        border: 2px solid rgba(255,255,255,0.3); border-radius: 50%;
        border-top-color: #fff; animation: wander-spin 0.6s linear infinite;
      }
      @keyframes wander-spin { to { transform: rotate(360deg); } }
      #header-user-rank {
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        flex-shrink: 0;
      }
      #header-user-rank .rank-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 150px;
      }
      .user-bubble {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: nowrap;
      }
    `;
    document.head.appendChild(style);
  })();

  return {
    setTheme,
    toggleTheme,
    showToast,
    setButtonLoading,
    toggleNotificationDrawer,
    updateNotificationBadge,
    markAsRead,
    showLeaderboard,
    getRankBadgeHTML,
    getRankIcon,
    openVisualSearch,
    _handleVisualSearch,
    _goToPlace,
    syncAuthUI,
    forceLogout
  };
})();
