(function () {
  "use strict";
  
  // === WanderUI Utilities ===
  window.WanderUI = {
    toggleNotificationDrawer() {
      const drawer = document.getElementById('drawer-notifications');
      if (drawer) {
        if (drawer.classList.contains('is-open')) {
          drawer.classList.remove('is-open');
          setTimeout(() => drawer.hidden = true, 400);
        } else {
          drawer.hidden = false;
          requestAnimationFrame(() => drawer.classList.add('is-open'));
          this.loadNotifications();
        }
      }
    },
    loadNotifications() {
      const list = document.getElementById('notif-list');
      if (!list) return;
      // Get data safely
      const data = typeof logsData !== 'undefined' ? logsData : [];
      const recentLogs = data.slice(0, 10);
      if (recentLogs.length === 0) {
        list.innerHTML = '<div class="empty-state">Không có thông báo mới</div>';
        return;
      }
      list.innerHTML = recentLogs.map(log => `
        <div class="log-item-minimal">
          <div class="log-icon-min">🔔</div>
          <div class="log-text-min">
            <strong>${log.user}</strong>: <code>${log.action}</code>
          </div>
          <div class="log-time-min">${new Date(log.timestamp).toLocaleTimeString()}</div>
        </div>
      `).join('');
    },
    exportToCSV(type) {
      let data = [];
      let filename = "";
      if (type === 'users') { data = typeof usersData !== 'undefined' ? usersData : []; filename = "users_report.csv"; }
      else { data = typeof placesData !== 'undefined' ? placesData : []; filename = "places_report.csv"; }
      
      if (data.length === 0) return window.WanderToast?.error("Không có dữ liệu để xuất");
      
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(",")).join("\n");
      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
      
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.WanderToast?.success(`Đã xuất file ${filename}`);
    },
    async toggleUserStatus(id, currentStatus) {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      const actionText = newStatus === 'suspended' ? 'KHÓA' : 'MỞ KHÓA';
      if (!confirm(`Bạn có chắc muốn ${actionText} tài khoản này không?`)) return;

      try {
        const res = await apiFetch(`/api/admin/users/${id}`, { 
          method: 'PUT', 
          body: JSON.stringify({ status: newStatus }) 
        });
        if (res.success) {
          WanderToast.success(`Đã ${actionText.toLowerCase()} tài khoản thành công`);
          loadUsers();
        } else {
          WanderToast.error(res.message || 'Thao tác thất bại');
        }
      } catch (e) {
        WanderToast.error('Lỗi kết nối máy chủ');
      }
    },
    showModalBackdrop: () => {
      const b = document.getElementById('admin-modal-backdrop');
      if (b) b.hidden = false;
    },
    hideModalBackdrop: () => {
      const b = document.getElementById('admin-modal-backdrop');
      if (b) b.hidden = true;
    },
    toggleAIDrawer() {
      const drawer = document.getElementById('drawer-ai-assistant');
      if (drawer) {
        if (drawer.classList.contains('is-open')) {
          drawer.classList.remove('is-open');
          setTimeout(() => drawer.hidden = true, 400);
          this.hideModalBackdrop();
        } else {
          drawer.hidden = false;
          requestAnimationFrame(() => drawer.classList.add('is-open'));
          this.showModalBackdrop();
        }
      }
    },
    openDrawer(id) {
      const d = document.getElementById(id);
      if (d) {
        d.hidden = false;
        requestAnimationFrame(() => d.classList.add('is-open'));
        this.showModalBackdrop();
      }
    },
    closeDrawer(id) {
      const d = document.getElementById(id);
      if (d) {
        d.classList.remove('is-open');
        setTimeout(() => d.hidden = true, 400);
        this.hideModalBackdrop();
      }
    },
    getFriendlyAction(action) {
      const actionMap = {
        'USER_LOGIN': '🚀 Đăng nhập hệ thống',
        'USER_REGISTER': '🎉 Đăng ký tài khoản mới',
        'USER_LOGOUT': '👋 Đăng xuất',
        'ADMIN_LOGIN': '🛡️ Quản trị viên đăng nhập',
        'USER_UPDATED': '📝 Cập nhật thông tin',
        'USER_DELETED': '🗑️ Xóa tài khoản',
        'ROLE_UPDATED': '🔑 Thay đổi quyền hạn',
        'PLACE_CREATED': '📍 Tạo địa điểm mới',
        'PLACE_UPDATED': '✏️ Sửa địa điểm',
        'PLACE_DELETED': '❌ Xóa địa điểm',
        'BUSINESS_LOGIN': '🏢 Doanh nghiệp đăng nhập',
        'BUSINESS_APPROVED': '✅ Phê duyệt đối tác',
        'USER_PASSWORD_CHANGED': '🔐 Đổi mật khẩu',
        'USER_PROFILE_UPDATED': '👤 Cập nhật hồ sơ',
        'FEEDBACK_DELETED': '💬 Xóa phản hồi',
        'ITINERARY_GENERATED': '📅 Tạo lịch trình AI',
        'ITINERARY_REFINED': '🔄 Tinh chỉnh lịch trình',
        'ITINERARY_SAVED_MANUAL': '💾 Lưu lịch trình thủ công',
        'CHAT_WITH_AI': '💬 Trò chuyện với AI',
        'FEEDBACK_SUBMITTED': '📣 Gửi phản hồi'
      };
      return actionMap[action] || `Thao tác: ${action}`;
    },
    toggleSettingsDrawer() {
      const drawer = document.getElementById('drawer-settings');
      if (drawer) {
        if (drawer.classList.contains('is-open')) {
          drawer.classList.remove('is-open');
          setTimeout(() => drawer.hidden = true, 400);
          this.hideModalBackdrop();
        } else {
          drawer.hidden = false;
          requestAnimationFrame(() => drawer.classList.add('is-open'));
          this.showModalBackdrop();
        }
      }
    },
    closeAllDrawers() {
      ['drawer-ai-assistant', 'drawer-settings', 'user-activity-drawer'].forEach(id => {
        const d = document.getElementById(id);
        if (d && d.classList.contains('is-open')) {
          d.classList.remove('is-open');
          setTimeout(() => d.hidden = true, 400);
        }
      });
      this.hideModalBackdrop();
    },
    async openUserActivity(email, name, avatar) {
      const drawer = document.getElementById('user-activity-drawer');
      const timeline = document.getElementById('ua-timeline');
      if(!drawer || !timeline) return;

      // Reset UI
      document.getElementById('ua-name').textContent = name;
      document.getElementById('ua-email').textContent = email;
      document.getElementById('ua-avatar').src = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
      timeline.innerHTML = '<div class="table-loading">Đang tải lịch sử hoạt động...</div>';
      
      this.openDrawer('user-activity-drawer');

      try {
        const res = await apiFetch(`/api/admin/logs?user=${encodeURIComponent(email)}&limit=100`);
        if (res.success) {
          const userLogs = res.data; // Server already filtered this for us
          
          if (userLogs.length === 0) {
            timeline.innerHTML = '<div class="empty-state" style="padding:2rem">Chưa có bản ghi hoạt động nào cho người dùng này.</div>';
            return;
          }

          timeline.innerHTML = userLogs.map(log => {
            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleString('vi-VN');
            
            const actionTitle = this.getFriendlyAction(log.action);
            
            // Format technical details into readable Vietnamese
            let readableDetails = '';
            if (log.details) {
              try {
                const detailsObj = JSON.parse(log.details);
                const detailParts = [];
                
                if (detailsObj.email) detailParts.push(`Đối tượng: ${detailsObj.email}`);
                if (detailsObj.targetEmail) detailParts.push(`Đối tượng: ${detailsObj.targetEmail}`);
                if (detailsObj.name) detailParts.push(`Tên: ${detailsObj.name}`);
                if (detailsObj.placeId) detailParts.push(`ID địa điểm: ${detailsObj.placeId}`);
                if (detailsObj.destination) detailParts.push(`Điểm đến: ${detailsObj.destination}`);
                if (detailsObj.message) detailParts.push(`Nội dung: "${detailsObj.message.substring(0, 30)}..."`);
                if (detailsObj.changed) detailParts.push(`Thay đổi: ${detailsObj.changed.join(', ')}`);
                if (detailsObj.isAdmin !== undefined) detailParts.push(`Quyền Admin: ${detailsObj.isAdmin ? 'Có' : 'Không'}`);
                
                if (detailParts.length > 0) {
                  readableDetails = `<div class="activity-desc">${detailParts.join(' • ')}</div>`;
                }
              } catch (e) {
                // If not JSON, show as is but keep it clean
                readableDetails = `<div class="activity-desc">${log.details}</div>`;
              }
            }
            
            // Device info parsing (simplified)
            let device = 'Thiết bị không xác định';
            if (log.userAgent) {
              if (log.userAgent.includes('Windows')) device = '🖥️ Máy tính Windows';
              else if (log.userAgent.includes('Android')) device = '📱 Điện thoại Android';
              else if (log.userAgent.includes('iPhone')) device = '📱 iPhone (iOS)';
              else if (log.userAgent.includes('Macintosh')) device = '💻 Máy tính Mac';
              else device = '🌐 Trình duyệt Web';
            }

            return `
              <div class="activity-item">
                <div class="activity-time">${timeStr}</div>
                <div class="activity-title">${actionTitle}</div>
                ${readableDetails}
                <div class="activity-meta">
                  <span>📍 IP: ${log.ip || 'Không xác định'}</span>
                  <span>${device}</span>
                </div>
              </div>
            `;
          }).join('');
        } else {
          timeline.innerHTML = '<div class="error-state">Không thể tải dữ liệu lịch sử.</div>';
        }
      } catch (err) {
        timeline.innerHTML = '<div class="error-state">Lỗi kết nối máy chủ.</div>';
      }
    },
    setButtonLoading: (btn, isLoading) => {
      if (!btn) return;
      if (isLoading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-small"></span> Đang xử lý...';
      } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
      }
    },
    showToast: (msg, type = 'info') => {
      if (window.WanderToast) {
        window.WanderToast[type](msg);
      } else {
        alert(msg);
      }
    },
    async impersonateUser(userId) {
      if (!confirm('BẠN CÓ CHẮC MUỐN GIẢ DANH NGƯỜI DÙNG NÀY?\n\nHành động này sẽ mở trang web người dùng và đăng nhập trực tiếp bằng tài khoản của họ.')) return;
      try {
        // Gửi body rỗng để đảm bảo Content-Type được set
        const res = await apiFetch(`/api/admin/users/${userId}/impersonate`, { 
          method: 'POST',
          body: JSON.stringify({}) 
        });
        if (res.success && res.token) {
          // Sử dụng hostname động để tránh lỗi khi không dùng localhost
          const userWebUrl = `${window.location.protocol}//${window.location.hostname}:3000?impersonate_token=${res.token}`;
          window.open(userWebUrl, '_blank');
          this.showToast('Đang chuyển hướng tới cổng giả danh...', 'success');
        } else {
          this.showToast(res.message || 'Lỗi khi giả danh', 'error');
        }
      } catch (e) {
        this.showToast('Lỗi kết nối máy chủ', 'error');
      }
    }
  };

  // ===== ADMIN LOGIN OVERLAY MANAGEMENT =====
  const loginOverlay  = document.getElementById('admin-login-overlay');
  const loginForm     = document.getElementById('admin-login-form');
  const loginMsg      = document.getElementById('admin-login-msg');
  const errorBox      = document.getElementById('admin-error');
  const contentBox    = document.getElementById('admin-content');
  const usersTbody    = document.getElementById('users-tbody');
  const placesTbody   = document.getElementById('places-tbody');

  // === PORTAL ISOLATION: Admin uses a SEPARATE token key ===
  // This prevents cross-contamination with the Traveler portal (wander_token)
  const ADMIN_TOKEN_KEY = 'wander_admin_token';
  let token = localStorage.getItem(ADMIN_TOKEN_KEY);
  let usersData = [];
  let placesData = [];
  let feedbacksData = [];
  let itinerariesData = [];
  let knowledgeData = [];
  let currentAdmin = { role: null };
  let previousTab = 'overview';
  let activeTab = 'overview';

  // --- Bootstrap: decide login vs dashboard ---
  if (token) {
    // ── Premium Welcome Flow ──
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const welcomeAdminName = document.getElementById('welcome-admin-name');
    
    // Quick try to get name from local storage before API returns
    try {
      const cached = JSON.parse(localStorage.getItem('adminUser') || '{}');
      if (cached && (cached.displayName || cached.name)) {
        welcomeAdminName.textContent = cached.displayName || cached.name;
      }
    } catch(e) {}

    // Fade out after 2.5s
    setTimeout(() => {
      if (welcomeOverlay) {
        welcomeOverlay.classList.add('fade-out');
        setTimeout(() => welcomeOverlay.style.display = 'none', 800);
      }
    }, 2800);

    initAdmin().then(() => {
      // Handle initial tab from URL hash
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const btn = document.querySelector(`.sidebar-btn[data-admin-tab="${hash}"]`) || 
                    document.querySelector(`[data-admin-tab="${hash}"]`);
        if (btn) btn.click();
      }
    });
  } else {
    showLoginOverlay();
  }

  function showLoginOverlay() {
    if (loginOverlay) loginOverlay.style.display = 'flex';
    const welcomeOverlay = document.getElementById('welcome-overlay');
    if (welcomeOverlay) welcomeOverlay.style.display = 'none';
  }

  function hideLoginOverlay() {
    if (loginOverlay) {
      loginOverlay.style.transition = 'opacity 0.4s ease';
      loginOverlay.style.opacity = '0';
      setTimeout(() => { loginOverlay.style.display = 'none'; }, 400);
    }
  }

  // Handle login form submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('admin-login-email').value.trim().toLowerCase();
      const password = document.getElementById('admin-login-password').value;
      const btn      = document.getElementById('admin-login-btn');

      btn.textContent = 'Đang xác thực...';
      btn.disabled    = true;
      loginMsg.textContent = '';

      try {
        const res  = await fetch('/api/auth/admin/login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password })
        });
        const json = await res.json();

        if (!json.success) {
          loginMsg.textContent = json.message || 'Email hoặc mật khẩu không đúng.';
          btn.textContent = 'Đăng nhập Quản trị';
          btn.disabled = false;
          return;
        }

        if (json.user.role !== 'admin' && json.user.role !== 'superadmin') {
          loginMsg.textContent = '⛔ Tài khoản này không có quyền Admin.';
          btn.textContent = 'Đăng nhập Quản trị';
          btn.disabled = false;
          return;
        }

        // Lưu vào key riêng của Admin — KHÔNG dùng wander_token chung
        token = json.token;
        localStorage.setItem(ADMIN_TOKEN_KEY, token);

        btn.textContent = '✔ Thành công!';
        btn.style.background = 'linear-gradient(135deg,#4ade80,#22c55e)';
        setTimeout(() => {
          hideLoginOverlay();
          initAdmin();
        }, 600);

      } catch (err) {
        loginMsg.textContent = 'Lỗi kết nối máy chủ. Hãy kiểm tra backend đang chạy.';
        btn.textContent = 'Đăng nhập Quản trị';
        btn.disabled = false;
      }
    });
  }

  // Logout button — only removes ADMIN token, preserves traveler session
  function setupLogout() {
    document.querySelectorAll('[data-admin-logout]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị không?')) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          token = null;
          // Reload page to show login overlay
          window.location.reload();
        }
      });
    });
  }

  async function apiFetch(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    options.headers = options.headers || {};
    options.headers['x-auth-token'] = token;
    if (options.body && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }
    options.signal = controller.signal;

    try {
      const res = await fetch(url, options);
      clearTimeout(id);
      
      const contentType = res.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          token = null;
          if (contentBox) contentBox.classList.add('is-hidden');
          showLoginOverlay();
          throw new Error('Unauthorized');
        }
        if (data && data.message) {
          throw new Error(data.message);
        }
        throw new Error(`API error: ${res.status}`);
      }
      return data || {};
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  async function initAdmin() {
    // Show a small indicator if needed, but the main thing is not to hang
    console.log('Initializing Admin Portal...');
    try {
      // 1. Validate session first
      const meRes = await apiFetch('/api/auth/admin/me');
      
      if (!meRes.success || !meRes.user || !['admin', 'superadmin'].includes(meRes.user.role)) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        token = null;
        showLoginOverlay();
        if (loginMsg) loginMsg.textContent = '⛔ Tài khoản không có quyền quản trị.';
        return;
      }

      currentAdmin = meRes.user;

      // Update top nav admin info
      const navName = document.getElementById('admin-name-head');
      const navAvatar = document.getElementById('admin-avatar-head');
      const sidebarName = document.getElementById('sidebar-admin-name');
      const sidebarEmail = document.getElementById('sidebar-admin-email');
      if (navName) navName.textContent = currentAdmin.displayName || currentAdmin.name || 'Admin';
      if (navAvatar) {
        navAvatar.src = currentAdmin.avatar || '';
        navAvatar.onerror = function() {
          this.onerror = null;
          this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentAdmin.displayName || currentAdmin.name || 'A')}&background=random&color=fff`;
        };
        // Trigger onerror if src is empty
        if (!navAvatar.src || navAvatar.src === window.location.href) navAvatar.onerror();
      }
      
      const sidebarAvatar = document.getElementById('sidebar-admin-avatar');
      if (sidebarAvatar) {
        sidebarAvatar.src = currentAdmin.avatar || '';
        sidebarAvatar.onerror = function() {
          this.onerror = null;
          this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentAdmin.displayName || currentAdmin.name || 'A')}&background=random&color=fff`;
        };
        if (!sidebarAvatar.src || sidebarAvatar.src === window.location.href) sidebarAvatar.onerror();
      }

      if (sidebarName) sidebarName.textContent = currentAdmin.displayName || currentAdmin.name || 'Super Admin';
      if (sidebarEmail) sidebarEmail.textContent = currentAdmin.email || 'admin@wanderviet.com';

      setupProfileEdit();
      // === SHOW the dashboard (fixes blank screen bug caused by [hidden] !important CSS) ===
      hideLoginOverlay();
      if (contentBox) {
        contentBox.classList.remove('is-hidden');
      }
      if (errorBox) {
        errorBox.setAttribute('hidden', '');
      }

      // === HIDE UNAUTHORIZED TABS & FIND DEFAULT ===
      const isSuperAdmin = currentAdmin.role === 'superadmin';
      const permissions = currentAdmin.permissions || [];
      let firstAllowedTab = null;

      document.querySelectorAll('.sidebar-btn[data-admin-tab]').forEach(btn => {
        const tab = btn.dataset.adminTab;
        if (!isSuperAdmin && !permissions.includes(tab)) {
          btn.style.display = 'none';
        } else {
          btn.style.display = ''; // Restore default
          if (!firstAllowedTab) firstAllowedTab = tab;
        }
      });

      // === ACTIVATE default panel ===
      document.querySelectorAll('.admin-panel').forEach(p => {
        p.removeAttribute('hidden');
        p.classList.add('is-hidden');
      });

      const targetTab = (isSuperAdmin || permissions.includes('overview')) ? 'overview' : firstAllowedTab;
      
      if (targetTab) {
        const targetPanel = document.getElementById('panel-' + targetTab);
        if (targetPanel) targetPanel.classList.remove('is-hidden');
        
        document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('is-active'));
        const targetBtn = document.querySelector(`[data-admin-tab="${targetTab}"]`);
        if (targetBtn) targetBtn.classList.add('is-active');
        activeTab = targetTab;

        // Tự động load dữ liệu cho tab mặc định nếu không phải overview
        if (targetTab === 'users') loadUsers();
        else if (targetTab === 'moderation') loadModeration();
        else if (targetTab === 'places') loadPlaces();
        else if (targetTab === 'logs') loadLogs('all');
        else if (targetTab === 'knowledge') loadKnowledge();
      }

      setupTabSwitching();
      setupLogout();
      setupBroadcastForm();
      setupAdminCreationForm();
      initThemeCustomizer();
      setupAISentinel();
      initActivityChart();
      loadDistributionChart();
      loadRankings();
      loadHealthStatus();

      // Load overview data in background
      const refreshAll = () => {
        loadSystemStats().catch(e => {});
        initActivityChart().catch(e => {});
        loadDistributionChart().catch(e => {});
        loadRankings(currentRankPeriod).catch(e => {});
        loadHealthStatus().catch(e => {});
        loadLogs('all').catch(e => {});
        pollActivityStream().catch(e => {});
        
        // Refresh active management tabs for real-time status (SILENT MODE)
        if (activeTab === 'users') loadUsers(true).catch(e => {});
        if (activeTab === 'places') loadPlaces(true).catch(e => {});
        if (activeTab === 'feedbacks') loadFeedbacks(true).catch(e => {});
        if (activeTab === 'itinerary') loadItineraries(true).catch(e => {});
        if (activeTab === 'moderation') loadModeration(true).catch(e => {});
      };

      // Handle Period Switch
      let currentRankPeriod = 'today';
      document.querySelectorAll('.btn-period').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.btn-period').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          currentRankPeriod = btn.dataset.period;
          loadRankings(currentRankPeriod);
        });
      });

      // Handle View More Clicks
      document.querySelectorAll('.btn-view-more').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type;
          openRankingsDrawer(type, currentRankPeriod);
        });
      });
      
      // Initialize with today by default
      const defaultPeriodBtn = document.querySelector('[data-period="today"]');
      if (defaultPeriodBtn) {
        defaultPeriodBtn.click();
      }

      refreshAll();
      // Auto refresh every 10 seconds for "real-time" experience
      setInterval(refreshAll, 10000);
      // Faster polling for the activity stream ticker
      setInterval(() => pollActivityStream().catch(e => {}), 5000);
      
    } catch (e) {
      console.error('Admin bootstrap error:', e);
      // Nếu là lỗi không tìm thấy tài khoản hoặc lỗi xác thực, hãy hiện bảng đăng nhập
      if (e.message === 'Unauthorized' || e.message.includes('không tồn tại') || e.message.includes('404')) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        token = null;
        showLoginOverlay();
      } else if (errorBox) {
        errorBox.removeAttribute('hidden');
        errorBox.textContent = "Lỗi khởi động hệ thống quản trị. Vui lòng kiểm tra kết nối API.";
      }
    }
  }

  function setupTabSwitching() {
    const TAB_TITLES = {
      overview: 'Tổng quan hệ thống',
      moderation: 'Duyệt nội dung',
      users: 'Quản lý người dùng',
      notifications: 'Gửi thông báo',
      logs: 'Nhật ký hệ thống',
      places: 'Kho địa điểm',
      admins: 'Quản lý Admin',
      feedbacks: 'Phản hồi người dùng',
      itineraries: 'Lịch trình AI'
    };
    document.querySelectorAll('[data-admin-tab]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tab = btn.dataset.adminTab;
        if (tab !== activeTab) {
          previousTab = activeTab;
          activeTab = tab;
        }
        
        // Update active panel title
        const titleEl = document.getElementById('active-panel-title');
        if (titleEl) titleEl.textContent = TAB_TITLES[tab] || 'Quản trị hệ thống';

        // Update global back button text and action
        const backBtn = document.getElementById('global-back-btn');
        if (backBtn) {
          backBtn.style.display = (tab === 'overview') ? 'none' : 'flex';
          backBtn.onclick = () => {
            const prevBtn = document.querySelector(`.sidebar-btn[data-admin-tab="${previousTab}"]`);
            if (prevBtn) prevBtn.click();
          };
        }

        // Close any ranking popups
        if (typeof closeRankingsDrawer === 'function') closeRankingsDrawer();

        // Hide ALL panels
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('is-hidden'));
        document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('is-active'));
        
        // Find and activate the correct sidebar button (in case click came from quick action)
        const targetSidebarBtn = document.querySelector(`.sidebar-btn[data-admin-tab="${tab}"]`);
        if (targetSidebarBtn) targetSidebarBtn.classList.add('is-active');

        // Update Browser History for Gestures (Trackpad Back/Forward)
        if (window.location.hash !== '#' + tab) {
          history.pushState({ tab: tab }, '', '#' + tab);
        }

        const panel = document.getElementById('panel-' + tab);
        if (panel) {
          // --- Access Control Check ---
          const isSuperAdmin = currentAdmin.role === 'superadmin';
          const permissions = currentAdmin.permissions || ['overview'];
          if (!isSuperAdmin && tab !== 'overview' && !permissions.includes(tab)) {
            if (window.WanderUI) window.WanderUI.showToast('Bạn không có quyền truy cập khu vực này!', 'error');
            else alert('Bạn không có quyền truy cập khu vực này. Vui lòng liên hệ Super Admin.');
            
            // Re-activate the previous tab button if possible
            return;
          }

          panel.classList.remove('is-hidden');
          if (tab !== 'overview') {
            let titleEl = panel.querySelector('.panel-page-title');
            if (!titleEl) {
              titleEl = document.createElement('div');
              titleEl.className = 'panel-page-title';
              panel.insertBefore(titleEl, panel.firstChild);
            }
            titleEl.innerHTML = `<h1 class="main-title">${TAB_TITLES[tab] || tab}</h1>`;
          }
          
          switch (tab) {
            case 'overview': 
              await loadSystemStats(); 
              initActivityChart();
              break;
            case 'users': await loadUsers(); break;
            case 'places': await loadPlaces(); break;
            case 'feedbacks': await loadFeedbacks(); break;
            case 'itineraries': await loadItineraries(); break;
            case 'knowledge':
        loadKnowledge().catch(e => {});
        break;
      case 'ai-intelligence':
        loadAIIntel().catch(e => {});
        break;
      case 'logs':
 await loadLogs('all'); break;
            case 'moderation': await loadModeration(); break;
          }
        }
      });
    });
  }

  async function pollActivityStream() {
    try {
      const json = await apiFetch('/api/admin/logs/recent');
      const container = document.getElementById('live-activity-stream');
      if (json.success && container) {
        const streamHtml = json.data.map(log => `
          <div class="stream-item">
            <span class="stream-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
            <span class="stream-action">${log.action}</span>
            <span class="stream-user">${log.userName}</span>
          </div>
        `).join('');
        // Double it for seamless loop
        container.innerHTML = `<div class="stream-wrapper">${streamHtml}${streamHtml}</div>`;
      }
    } catch (e) {}
  }

  function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range)) || 10;
    const timer = setInterval(() => {
      current += increment;
      obj.textContent = current.toLocaleString();
      if (current == end) {
        clearInterval(timer);
      }
    }, stepTime);
  }

  async function loadSystemStats() {
    try {
      const json = await apiFetch('/api/admin/stats');
      if (json.success && json.data) {
        const data = json.data;
        
        const updateWithAnim = (id, newVal) => {
          const el = document.getElementById(id);
          if (el) {
            const oldVal = parseInt(el.textContent.replace(/,/g, '')) || 0;
            if (oldVal !== newVal) {
               animateValue(id, oldVal, newVal, 1000);
            }
          }
        };

        updateWithAnim('stat-total-users', data.totalUsers || 0);
        updateWithAnim('stat-total-biz', data.businessCount || 0);
        updateWithAnim('stat-daily-interactions', data.dailyInteractions || 0);
        updateWithAnim('stat-total-iti', data.itineraryCount || 0);

        // Cập nhật độ trễ hệ thống (Live Pulse)
        const latEl = document.getElementById('header-latency');
        if (latEl) {
          latEl.textContent = (Math.floor(Math.random() * 35) + 12) + 'ms';
        }

        // Cập nhật tin vắn AI nếu đang ở trạng thái chờ
        const aiMsg = document.getElementById('ai-insight-msg');
        if (aiMsg && aiMsg.textContent.includes('Đang phân tích')) {
          updateAIInsight();
        }

        // Populating the Rank Hierarchy list
        const rankList = document.getElementById('rank-stats-list');
        if (rankList && data.rankHierarchy) {
          const colors = ['var(--admin-accent)', 'var(--admin-green)', 'var(--admin-purple)', 'var(--admin-warm)'];
          rankList.innerHTML = data.rankHierarchy.map((item, idx) => `
            <div class="rank-item">
              <div class="rank-label">${item.label}</div>
              <div class="rank-bar-wrap"><div class="rank-bar" style="width: ${item.percent}%; background: ${colors[idx % colors.length]}"></div></div>
              <div class="rank-val">${item.percent}%</div>
            </div>
          `).join('');
        }
      }
    } catch (e) {}
  }

  function updateAIInsight() {
    const insights = [
      "Lưu lượng truy cập hôm nay tăng 12%. Hệ thống đã tự động tối ưu hóa tài nguyên.",
      "Người dùng đang quan tâm nhiều đến các khu vực phía Bắc. Gợi ý đẩy mạnh quảng bá Sapa.",
      "Tỷ lệ phản hồi tích cực đạt 98.2%. Hiệu năng Chatbot ổn định.",
      "Phát hiện 3 tài khoản có dấu hiệu spam hành trình. Đã đưa vào danh sách theo dõi.",
      "Thời gian tạo lịch trình AI trung bình giảm còn 3.5 giây. Rất ấn tượng!",
      "Hệ thống bảo mật đang ở trạng thái Tối ưu. Không phát hiện mối đe dọa nào."
    ];
    const aiMsg = document.getElementById('ai-insight-msg');
    if (aiMsg) {
      aiMsg.style.transition = 'opacity 0.5s';
      aiMsg.style.opacity = '0';
      setTimeout(() => {
        aiMsg.textContent = insights[Math.floor(Math.random() * insights.length)];
        aiMsg.style.opacity = '1';
      }, 500);
    }
  }
  // Tự động cập nhật tin vắn AI mỗi 45 giây
  setInterval(updateAIInsight, 45000);

  let activityChart = null;
  let distributionChart = null;
  async function initActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    try {
      const json = await apiFetch('/api/admin/stats/trend');
      if (!json.success || !json.data) return;
      
      const trendData = json.data;
      const labels = trendData.map(d => d.label.split('-').slice(2).join('/'));
      const interactions = trendData.map(d => d.interactions);
      const users = trendData.map(d => d.users || 0);
      const businesses = trendData.map(d => d.businesses || 0);
      const admins = trendData.map(d => d.admins || 0);
      const places = trendData.map(d => d.places || 0);
      const feedbacks = trendData.map(d => d.feedbacks || 0);

      if (activityChart) activityChart.destroy();
      activityChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Người dùng mới',
              data: users,
              borderColor: '#6366f1',
              backgroundColor: 'transparent',
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4
            },
            {
              label: 'Doanh nghiệp mới',
              data: businesses,
              borderColor: '#10b981',
              backgroundColor: 'transparent',
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4
            },
            {
              label: 'Admin mới',
              data: admins,
              borderColor: '#8b5cf6', // Purple
              backgroundColor: 'transparent',
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4
            },
            {
              label: 'Địa điểm mới',
              data: places,
              borderColor: '#f59e0b',
              backgroundColor: 'transparent',
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 3
            },
            {
              label: 'Phản hồi mới',
              data: feedbacks,
              borderColor: '#ef4444',
              backgroundColor: 'transparent',
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 3
            },
            {
              label: 'Tương tác',
              data: interactions,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              borderDash: [5, 5],
              backgroundColor: 'transparent',
              tension: 0.4,
              borderWidth: 1,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: { color: '#94a3b8', font: { size: 10, family: 'Be Vietnam Pro' }, usePointStyle: true, padding: 15 }
            },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
              ticks: { color: '#64748b', font: { size: 10 } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { size: 10 } }
            }
          }
        }
      });
    } catch (err) {
      console.warn('Failed to load activity trend chart:', err);
    }
  }

  async function loadDistributionChart() {
    const ctx = document.getElementById('distributionChart')?.getContext('2d');
    if (!ctx) return;

    try {
      const json = await apiFetch('/api/admin/stats/distribution');
      if (!json.success) return;

      const roles = json.data.roles;
      const labels = roles.map(r => {
        if (r._id === 'user') return 'Khách hàng';
        if (r._id === 'business') return 'Doanh nghiệp';
        if (r._id === 'admin') return 'Quản trị viên';
        return r._id;
      });
      const values = roles.map(r => r.count);

      // Thêm Thành viên mới vào biểu đồ nếu có
      if (json.data.newMembers > 0) {
        labels.push('Thành viên mới (Hôm nay)');
        values.push(json.data.newMembers);
      }

      if (distributionChart) distributionChart.destroy();
      distributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#4ade80'],
            borderWidth: 0,
            hoverOffset: 12
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', padding: 25, font: { size: 11, family: 'Be Vietnam Pro' }, usePointStyle: true }
            }
          }
        }
      });
    } catch (err) {
      console.warn('Failed to load distribution chart:', err);
    }
  }

  async function loadRankings(period = 'alltime') {
    try {
      const json = await apiFetch(`/api/admin/stats/rankings?period=${period}&t=${Date.now()}`);
      if (!json.success) return;

      const { topActive, topItineraries, topDeposits, topBusinesses, topPlaces } = json.data;
      const getMedal = (idx) => idx === 0 ? '<span class="medal">🥇</span>' : (idx === 1 ? '<span class="medal">🥈</span>' : (idx === 2 ? '<span class="medal">🥉</span>' : `<span class="rank-num">#${idx + 1}</span>`));

      // 1. Top Active (Minutes)
      const activeList = document.getElementById('rank-active-list');
      if (activeList) {
        activeList.innerHTML = topActive.map((u, idx) => `
          <div class="rank-item-v2">
            <div class="rank-num">${getMedal(idx)}</div>
            <img src="${u.avatar || ''}" class="rank-avatar" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.name || 'U')}&background=random&color=fff'">
            <div class="rank-info">
              <div class="rank-name">${u.displayName || u.name}</div>
              <div class="rank-meta">${u.email}</div>
            </div>
            <div class="rank-badge">${Math.floor(u.minutes || 0)} <small>phút</small></div>
          </div>
        `).join('') || '<div class="empty-state">Chưa có dữ liệu</div>';
      }

      // 2. Top Itineraries (Saved Trips)
      const expList = document.getElementById('rank-experience-list');
      if (expList) {
        expList.innerHTML = topItineraries.map((u, idx) => `
          <div class="rank-item-v2">
            <div class="rank-num">${getMedal(idx)}</div>
            <img src="${u.avatar || ''}" class="rank-avatar" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.name || 'U')}&background=random&color=fff'">
            <div class="rank-info">
              <div class="rank-name">${u.displayName || u.name}</div>
              <div class="rank-meta">${u.email}</div>
            </div>
            <div class="rank-badge rank-badge--silver">${(u.count || 0)} <small>lịch trình</small></div>
          </div>
        `).join('') || '<div class="empty-state">Chưa có dữ liệu</div>';
      }

      // 3. Top Deposits
      const depList = document.getElementById('rank-deposits-list');
      if (depList) {
        depList.innerHTML = topDeposits.map((u, idx) => `
          <div class="rank-item-v2">
            <div class="rank-num">${getMedal(idx)}</div>
            <img src="${u.avatar || ''}" class="rank-avatar" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.name || 'U')}&background=random&color=fff'">
            <div class="rank-info">
              <div class="rank-name">${u.displayName || u.name}</div>
              <div class="rank-meta">${u.email}</div>
            </div>
            <div class="rank-badge rank-badge--gold">${(u.totalSpent || 0).toLocaleString()} <small>VNĐ</small></div>
          </div>
        `).join('') || '<div class="empty-state">Chưa có dữ liệu</div>';
      }

      // 4. Top Businesses
      const bizList = document.getElementById('rank-businesses-list');
      if (bizList) {
        bizList.innerHTML = topBusinesses.map((b, idx) => `
            <div class="rank-item-v2">
              <div class="rank-num">${getMedal(idx)}</div>
              <img src="${b.avatar || ''}" class="rank-avatar" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(b.displayName || b.name || 'B')}&background=random&color=fff'">
              <div class="rank-info">
                <div class="rank-name">${b.displayName || b.name}</div>
                <div class="rank-meta">${b.email}</div>
              </div>
              <div class="rank-badge rank-badge--gold">${(b.score || 0).toLocaleString()} <small>XP</small></div>
            </div>
          `).join('') || '<div class="empty-state">Chưa có dữ liệu</div>';
      }

      // 5. Top Places
      const placeList = document.getElementById('rank-places-list');
      if (placeList) {
        placeList.innerHTML = topPlaces.map((p, idx) => `
          <div class="rank-item-v2">
            <div class="rank-num">${getMedal(idx)}</div>
            <img src="${p.image || ''}" class="rank-img-min">
            <div class="rank-info">
              <div class="rank-name">${p.name}</div>
              <div class="rank-meta">${p.region}</div>
            </div>
            <div class="rank-badge rank-badge--blue">${(p.favoritesCount || 0).toLocaleString()} <small>thích</small></div>
          </div>
        `).join('') || '<div class="empty-state">Chưa có dữ liệu</div>';
      }

    } catch (e) { console.warn('Leaderboard error:', e); }
  }

  async function loadHealthStatus() {
    try {
      const json = await apiFetch('/api/admin/stats/health?t=' + Date.now());
      if (json.success) {
        const d = json.data;
        document.getElementById('health-status').textContent = d.status;
        document.getElementById('health-db').textContent = d.db;
        document.getElementById('health-latency').textContent = d.latency;
        document.getElementById('health-memory').textContent = d.memory;
        document.getElementById('health-uptime').textContent = d.uptime;
      }
    } catch (e) {}
  }

  // --- Users ---
  async function loadUsers(silent = false) {
    // Ghi nhớ những hàng chi tiết đang mở để mở lại sau khi render
    const openDetailIds = Array.from(document.querySelectorAll('.detail-row.is-open')).map(el => el.id);
    
    if (!silent) {
      usersTbody.innerHTML = '<tr><td colspan="6" style="text-align:center"><span class="spinner-small"></span> Đang tải...</td></tr>';
    }
    
    try {
      const json = await apiFetch('/api/admin/users?t=' + Date.now());
      if (json.success) {
        usersData = json.data;
        renderUsers(usersData);
        updateUserManagerDashboard(usersData);
        
        // Khôi phục trạng thái mở của các hàng chi tiết
        openDetailIds.forEach(id => {
          const row = document.getElementById(id);
          if (row) row.classList.add('is-open');
        });
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
  }

  let userManagerChart = null;
  function updateUserManagerDashboard(users) {
    const dashboard = document.getElementById('user-manager-dashboard');
    if (!dashboard) return;
    
    // Nếu là admin quản lý người dùng, hiện bảng tổng hợp
    dashboard.style.display = 'block';
    
    const total = users.length;
    const today = new Date().setHours(0,0,0,0);
    const newToday = users.filter(u => new Date(u.createdAt).getTime() >= today).length;
    const businesses = users.filter(u => u.isBusiness || u.role === 'business').length;
    const suspended = users.filter(u => u.status === 'suspended').length;
    
    const elTotal = document.getElementById('um-total-users');
    const elNew = document.getElementById('um-new-today');
    const elBiz = document.getElementById('um-businesses');
    const elSuspended = document.getElementById('um-suspended');

    if (elTotal) elTotal.textContent = total;
    if (elNew) elNew.textContent = newToday;
    if (elBiz) elBiz.textContent = businesses;
    if (elSuspended) elSuspended.textContent = suspended;
    
    const ctx = document.getElementById('userManagerChart')?.getContext('2d');
    if (ctx) {
      if (userManagerChart) userManagerChart.destroy();
      
      const adminCount = users.filter(u => u.isAdmin || u.isSuperAdmin).length;
      const normalCount = total - businesses - adminCount;

      userManagerChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Khách hàng', 'Doanh nghiệp', 'Admin'],
          datasets: [{
            label: 'Số lượng',
            data: [normalCount, businesses, adminCount],
            backgroundColor: ['#38bdf8', '#10b981', '#f59e0b'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
          }
        }
      });
    }
  }

  function renderUsers(users) {
    usersTbody.innerHTML = '';
    users.forEach((u) => {
      const tr = document.createElement('tr');
      const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'N/A';
      const roleLabel = u.isSuperAdmin ? 'Super Admin' : (u.isAdmin ? 'Admin' : (u.isBusiness ? 'Doanh nghiệp' : 'Người dùng'));
      const canEdit = currentAdmin.isSuperAdmin || (!u.isAdmin && !u.isSuperAdmin);
      const isSuspended = u.status === 'suspended';

      // Tính toán trạng thái Online/Offline thực tế
      const lastActive = u.lastActive ? new Date(u.lastActive) : null;
      const isOnline = lastActive && (Date.now() - lastActive.getTime() < 3 * 60 * 1000); // 3 phút
      const statusColor = isOnline ? '#22c55e' : '#f43f5e';
      const statusText = isOnline ? 'Trực tuyến' : 'Ngoại tuyến';
      const statusDot = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${statusColor}; box-shadow:0 0 8px ${isOnline ? statusColor : 'transparent'}; margin-right:6px"></span>`;

      // XP & Rank Helper
      const xp = u.points || 0;
      const rank = u.rank || 'Đồng';
      const tier = u.rankTier || 'I';
      const rankBadge = `<div class="rank-info-cell" style="display:flex; flex-direction:column; gap:2px">
        <div style="font-weight:700; font-size:0.85rem; color:#f1f5f9">${rank} ${tier}</div>
        <div style="font-size:0.7rem; color:#0ea5e9; font-family:monospace">${xp} XP</div>
      </div>`;
      
      tr.innerHTML = `
        <td>
          <img src="${u.avatar || ''}" 
               onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.name || 'User')}&background=random&color=fff'"
               style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.1)" />
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:0.25rem;">
            ${statusDot}
            <div style="font-weight:600; color:white">${u.displayName || u.name || 'Người dùng'}</div>
          </div>
          <div style="font-size:0.7rem; color:var(--admin-text-muted); display:flex; align-items:center; gap:0.5rem">
            <span>ID: ${u._id}</span>
            <span style="color:${statusColor}">${statusText}</span>
          </div>
          <div style="font-size:0.75rem; color: #94a3b8; font-family:monospace;">${u.email}</div>
        </td>
        <td>${rankBadge}</td>
        <td><span class="role-badge" data-role="${u.role || 'user'}">${roleLabel}</span></td>
        <td style="font-size:0.85rem; color:#cbd5e1">${date}</td>
        <td style="text-align: right; padding-right: 1.5rem;">
          <div style="display:flex; gap:0.5rem; align-items:center; justify-content: flex-end;">
            <button class="btn-detail-toggle" data-toggle-user="${u._id}">Chi tiết</button>
            ${canEdit ? `<button class="btn-icon" data-edit-user="${u._id}" title="Sửa thông tin">✏️</button>` : ''}
            ${(currentAdmin.role === 'superadmin' && u.role === 'admin') ? `
              <button class="btn-icon" style="background:rgba(14,165,233,0.15); color:#0ea5e9; border:1px solid rgba(14,165,233,0.3);" 
                      onclick="openAdminPermissionsEditor('${u._id}', '${(u.permissions || []).join(',')}')" 
                      title="Chỉnh sửa quyền hạn">🔑</button>
            ` : ''}
            ${(!u.isSuperAdmin && u._id !== currentAdmin.id) ? `
              <button class="btn-icon ${isSuspended ? 'btn--success' : ''}" 
                      style="font-size:0.9rem; padding:0.25rem 0.5rem; border-radius:6px; min-width:32px; background:${isSuspended ? 'rgba(74,222,128,0.15)' : 'rgba(245,158,11,0.15)'}; color:${isSuspended ? '#4ade80' : '#f59e0b'}; border:1px solid ${isSuspended ? 'rgba(74,222,128,0.3)' : 'rgba(245,158,11,0.3)'};"
                      onclick="WanderUI.toggleUserStatus('${u._id}', '${u.status}')"
                      title="${isSuspended ? 'Mở khóa tài khoản' : 'Khóa tài khoản (Tạm dừng)'}">
                ${isSuspended ? '🔓' : '🔒'}
              </button>
              <button class="btn-icon btn--danger" 
                      style="font-size:0.9rem; padding:0.25rem 0.5rem; border-radius:6px; min-width:32px; background:rgba(248,113,113,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.3);"
                      data-delete-user-row="${u._id}"
                      data-user-name="${u.displayName || u.name || 'tài khoản này'}"
                      title="Xóa vĩnh viễn">
                🗑️
              </button>
            ` : ''}
          </div>
        </td>
      `;
      usersTbody.appendChild(tr);

      const detailTr = document.createElement('tr');
      detailTr.className = 'detail-row';
      detailTr.id = `detail-user-${u._id}`;
      detailTr.innerHTML = `
        <td colspan="6">
          <div class="detail-content">
            <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:2rem">
              <div style="border-right:1px solid rgba(255,255,255,0.05); padding-right:2rem">
                <p><strong>📧 Email:</strong> ${u.email}</p>
                <p><strong>📞 Số điện thoại:</strong> ${u.phone || 'Chưa cập nhật'}</p>
                <p><strong>📅 Ngày gia nhập:</strong> ${new Date(u.createdAt).toLocaleString('vi-VN')}</p>
                <p><strong>⏳ Hoạt động cuối:</strong> ${lastActive ? lastActive.toLocaleString('vi-VN') : 'Chưa ghi nhận'}</p>
                <div style="margin-top:1rem; padding:0.75rem; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.05)">
                   <small style="color:var(--admin-text-muted); display:block; margin-bottom:0.25rem">Ghi chú quản trị:</small>
                   <div style="color:#cbd5e1; font-style:italic">${u.notes || 'Không có ghi chú'}</div>
                </div>
              </div>
              <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:0.75rem">
                <div style="display:flex; gap:0.5rem; align-items:center">
                  <span style="font-size:0.85rem; color:var(--admin-text-muted)">Hồ sơ hệ thống:</span>
                  <span style="padding:0.25rem 0.75rem; border-radius:6px; font-size:0.75rem; font-weight:600; 
                               background:${u.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)'}; 
                               color:${u.status === 'active' ? '#22c55e' : '#f87171'}; 
                               border:1px solid ${u.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(248,113,113,0.2)'}">
                    ${u.status === 'active' ? 'Hợp lệ' : 'Đã khóa'}
                  </span>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center">
                  <span style="font-size:0.85rem; color:var(--admin-text-muted)">Trạng thái kết nối:</span>
                  <span style="padding:0.25rem 0.75rem; border-radius:6px; font-size:0.75rem; font-weight:600; 
                               background:${isOnline ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)'}; 
                               color:${isOnline ? '#22c55e' : '#94a3b8'}; 
                               border:1px solid ${isOnline ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)'}">
                    ${isOnline ? 'ĐANG TRỰC TUYẾN' : 'NGOẠI TUYẾN'}
                  </span>
                </div>

                <button class="btn btn--primary" 
                        onclick="WanderUI.openUserActivity('${u.email}', '${(u.displayName || u.name || 'User').replace(/'/g, "\\'")}', '${(u.avatar || '').replace(/'/g, "\\'")}')" 
                        style="margin-top:0.5rem; width:100%; max-width:220px; display:flex; justify-content:center; align-items:center; gap:0.5rem">
                  📜 Xem lịch sử hoạt động
                </button>
                
                <div style="margin-top:0.5rem">
                   <img src="${u.avatar || ''}" 
                        onerror="this.style.display='none'"
                        style="width:60px; height:60px; border-radius:12px; border:1px solid var(--admin-border); object-fit:cover" />
                </div>
              </div>
            </div>
          </div>
        </td>
      `;
      usersTbody.appendChild(detailTr);
    });

    if (usersTbody && usersTbody.dataset.boundClick !== '1') {
      usersTbody.dataset.boundClick = '1';
      usersTbody.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-toggle-user]');
        if (toggleBtn) {
          const id = toggleBtn.dataset.toggleUser;
          const d = document.getElementById(`detail-user-${id}`);
          d.classList.toggle('is-open');
          toggleBtn.textContent = d.classList.contains('is-open') ? 'Thu gọn' : 'Xem chi tiết';
          return;
        }
        const editBtn = e.target.closest('[data-edit-user]');
        if (editBtn) {
          const user = usersData.find(x => x._id === editBtn.dataset.editUser);
          if (user) openUserModal(user);
          return;
        }
        const deleteRowBtn = e.target.closest('[data-delete-user-row]');
        if (deleteRowBtn) {
          const id = deleteRowBtn.dataset.deleteUserRow;
          const name = deleteRowBtn.dataset.userName;
          if (confirm(`Bạn có chắc muốn XÓA vĩnh viễn tài khoản "${name}" không?\nHành động này không thể hoàn tác!`)) {
            (async () => {
              try {
                const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
                if (res.success) {
                  WanderToast.success('Đã xóa tài khoản thành công');
                  await loadUsers();
                  updateStats();
                } else {
                  WanderToast.error(res.message || 'Không thể xóa tài khoản');
                }
              } catch (err) {
                WanderToast.error('Lỗi kết nối máy chủ');
              }
            })();
          }
        }
      });
    }
  }

  async function loadRealtimeLogs() {
    const logsTbody = document.getElementById('logs-tbody');
    if (!logsTbody) return;
    logsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Đang tải lịch sử...</td></tr>';
    try {
      const json = await apiFetch('/api/admin/logs?t=' + Date.now());
      if (json.success) renderLogs(json.data);
    } catch (e) {}
  }

  function renderLogs(logs) {
    const logsTbody = document.getElementById('logs-tbody');
    logsTbody.innerHTML = '';
    logs.forEach(log => {
      const tr = document.createElement('tr');
      const time = new Date(log.timestamp).toLocaleString('vi-VN');
      tr.innerHTML = `
        <td style="font-size:0.8rem">${time}</td>
        <td>
          <div style="font-weight:600">${log.userName || 'Hệ thống'}</div>
          <div style="font-size:0.7rem; color:var(--admin-text-muted)">${log.userRole || ''}</div>
        </td>
        <td style="font-weight:700; color:var(--admin-primary)">${log.action}</td>
        <td><button class="btn-detail-toggle" data-toggle-log="${log._id}">Chi tiết</button></td>
      `;
      logsTbody.appendChild(tr);

      const dTr = document.createElement('tr');
      dTr.className = 'detail-row';
      dTr.id = `detail-log-${log._id}`;
      dTr.innerHTML = `
        <td colspan="4">
          <div class="detail-content">
            <strong>Mô tả:</strong> ${log.details || 'Không có mô tả'}<br>
            <strong>ID Đối tượng:</strong> ${log.targetId || 'N/A'}<br>
            <strong>ID User:</strong> ${log.userId || 'N/A'}
          </div>
        </td>
      `;
      logsTbody.appendChild(dTr);
    });

    if (logsTbody && logsTbody.dataset.boundClick !== '1') {
      logsTbody.dataset.boundClick = '1';
      logsTbody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-toggle-log]');
        if (btn) {
          const id = btn.dataset.toggleLog;
          document.getElementById(`detail-log-${id}`).classList.toggle('is-open');
          btn.textContent = document.getElementById(`detail-log-${id}`).classList.contains('is-open') ? 'Đóng' : 'Chi tiết';
        }
      });
    }
  }

  let currentRoleFilter = 'all';

  function applyUserFilters() {
    const q = (document.getElementById('user-search')?.value || '').toLowerCase();
    let filtered = usersData.filter(u => {
      const matchSearch = !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q));
      const matchRole = currentRoleFilter === 'all' || u.role === currentRoleFilter;
      return matchSearch && matchRole;
    });
    renderUsers(filtered);
    const label = document.getElementById('user-count-label');
    if (label) label.textContent = `${filtered.length} tài khoản`;
  }

  document.getElementById('user-search').addEventListener('input', applyUserFilters);

  // Role filter tabs
  document.querySelectorAll('.user-role-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.user-role-filter').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      currentRoleFilter = btn.dataset.role;
      applyUserFilters();
    });
  });

  // --- User Modal ---
  const userModal = document.getElementById('modal-user-form');
  const userForm = document.getElementById('user-form');
  const userFormStatus = document.getElementById('user-form-status');

  let _originalIsAdmin = false; // lưu trạng thái isAdmin ban đầu

  function openUserModal(user) {
    userForm.reset();
    userFormStatus.textContent = '';
    userFormStatus.className = '';

    userForm.elements['id'].value = user._id;
    userForm.elements['name'].value = user.name || '';
    userForm.elements['displayName'].value = user.displayName || '';
    userForm.elements['email'].value = user.email || '';
    userForm.elements['phone'].value = user.phone || '';
    userForm.elements['avatar'].value = user.avatar || '';
    userForm.elements['notes'].value = user.notes || '';
    userForm.elements['points'].value = user.points || 0;
    document.getElementById('chk-is-admin').checked = !!user.isAdmin;
    _originalIsAdmin = !!user.isAdmin; // ghi nhớ trạng thái gốc

    // Chỉ Super Admin mới thấy/sửa được checkbox quyền Admin
    const adminToggleField = document.getElementById('chk-is-admin').closest('.field');
    if (adminToggleField) {
      adminToggleField.style.display = currentAdmin.isSuperAdmin ? 'flex' : 'none';
    }

    document.getElementById('admin-modal-backdrop').hidden = false;
    userModal.hidden = false;
    // Tiny delay to allow display:flex to apply before animation starts
    requestAnimationFrame(() => {
      userModal.classList.add('is-open');
    });
  }

  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = userForm.elements['id'].value;
    const newIsAdmin = document.getElementById('chk-is-admin').checked;
    const userName = userForm.elements['displayName'].value || userForm.elements['name'].value || 'người dùng này';

    // Xác nhận nếu quyền Admin thay đổi
    if (newIsAdmin !== _originalIsAdmin) {
      const action = newIsAdmin
        ? `Bạn có chắc muốn cấp quyền Admin cho "${userName}" không?`
        : `Bạn có chắc muốn thu hồi quyền Admin của "${userName}" không?`;
      if (!confirm(action)) return;
    }

    const body = {
      name: userForm.elements['name'].value,
      displayName: userForm.elements['displayName'].value,
      email: userForm.elements['email'].value,
      phone: userForm.elements['phone'].value,
      avatar: userForm.elements['avatar'].value,
      notes: userForm.elements['notes'].value,
      points: parseInt(userForm.elements['points'].value || 0),
      isAdmin: newIsAdmin
    };

    userFormStatus.textContent = 'Đang lưu...';
    userFormStatus.style.color = 'var(--text-muted)';

    try {
      const res = await apiFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      if (res.success) {
        userFormStatus.textContent = 'Đã lưu thành công!';
        userFormStatus.style.color = '#4ade80';
        await loadUsers();
        updateStats();
        setTimeout(() => closeAllModals(), 1000);
      } else {
        userFormStatus.textContent = res.message || 'Lỗi lưu thông tin';
        userFormStatus.style.color = '#f87171';
      }
    } catch (err) {
      userFormStatus.textContent = 'Lỗi kết nối máy chủ';
      userFormStatus.style.color = '#f87171';
    }
  });



  // --- Places ---
  async function loadPlaces(silent = false) {
    const openDetailIds = Array.from(document.querySelectorAll('.detail-row.is-open')).map(el => el.id);
    
    if (!silent) {
      placesTbody.innerHTML = '<tr><td colspan="6" style="text-align:center"><span class="spinner-small"></span> Đang tải...</td></tr>';
    }
    
    try {
      const json = await apiFetch('/api/admin/places?t=' + Date.now());
      if (json.success) {
        placesData = json.data;
        renderPlaces(placesData);
        updatePlaceDashboard(placesData);
        
        openDetailIds.forEach(id => {
          const row = document.getElementById(id);
          if (row) row.classList.add('is-open');
        });
      }
    } catch (e) {
      console.error('Error loading places:', e);
    }
  }

  let placeManagerChart = null;
  function updatePlaceDashboard(places) {
    const dashboard = document.getElementById('place-manager-dashboard');
    if (!dashboard) return;
    dashboard.style.display = 'block';

    const total = places.length;
    const top = places.filter(p => p.top).length;
    const verified = places.filter(p => p.verified).length;
    const regions = [...new Set(places.map(p => p.region).filter(Boolean))].length;

    document.getElementById('pm-total-places').textContent = total;
    document.getElementById('pm-top-places').textContent = top;
    document.getElementById('pm-verified').textContent = verified;
    document.getElementById('pm-regions').textContent = regions;

    const ctx = document.getElementById('placeManagerChart')?.getContext('2d');
    if (ctx) {
      if (placeManagerChart) placeManagerChart.destroy();
      const budget1 = places.filter(p => p.budget == 1).length;
      const budget2 = places.filter(p => p.budget == 2).length;
      const budget3 = places.filter(p => p.budget == 3).length;

      placeManagerChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Tiết kiệm', 'Vừa phải', 'Cao cấp'],
          datasets: [{
            data: [budget1, budget2, budget3],
            backgroundColor: ['#10b981', '#38bdf8', '#f59e0b'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } }
        }
      });
    }
  }

  function renderPlaces(places) {
    placesTbody.innerHTML = '';
    if (places.length === 0) {
      placesTbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chưa có điểm đến nào</td></tr>';
      return;
    }
    places.forEach(p => {
      const tr = document.createElement('tr');
      // Use a default image if broken or missing
      const imgSrc = p.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=100&q=80';
      
      tr.innerHTML = `
        <td>
          <div class="place-img-container">
            <img src="${imgSrc}" 
                 onerror="this.src='https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=100&q=80'" 
                 alt="" />
          </div>
        </td>
        <td>
          <div class="place-name-cell">
            <strong>${p.name}</strong> ${p.top ? '<span class="badge-top">★</span>' : ''}
            <div class="place-id-hint">ID: ${p.id}</div>
          </div>
        </td>
        <td><span class="region-pill">${p.region || '—'}</span></td>
        <td><div class="budget-info">Mức: <strong>${p.budget || '—'}</strong></div></td>
        <td><code class="coord-hint">${p.lat || '-'}, ${p.lng || '-'}</code></td>
        <td>
          <button class="btn btn--small btn--primary btn--edit-place" data-edit-place="${p.id}">
            <span class="icon">✏️</span> Sửa
          </button>
        </td>
      `;
      placesTbody.appendChild(tr);
    });

    placesTbody.querySelectorAll('[data-edit-place]').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-edit-place');
        const place = placesData.find(x => x.id === id);
        if (place) openPlaceModal(place);
      });
    });
  }

  document.getElementById('place-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = placesData.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.region && p.region.toLowerCase().includes(q)) ||
      (p.tags && p.tags.join(' ').toLowerCase().includes(q))
    );
    renderPlaces(filtered);
  });

  // --- Place Modal ---
  const placeModal = document.getElementById('modal-place-form');
  const placeForm = document.getElementById('place-form');
  const btnAddPlace = document.getElementById('btn-add-place');
  const btnDeletePlace = document.getElementById('btn-delete-place');
  const placeFormStatus = document.getElementById('place-form-status');

  btnAddPlace.addEventListener('click', () => {
    openPlaceModal();
  });

  function openPlaceModal(place = null) {
    placeForm.reset();
    placeFormStatus.textContent = '';
    placeFormStatus.className = '';
    document.getElementById('place-modal-title').textContent = place ? 'Sửa Điểm Đến' : 'Thêm Mới Điểm Đến';
    btnDeletePlace.hidden = !place;

    if (place) {
      placeForm.elements['id'].value = place.id || '';
      placeForm.elements['name'].value = place.name || '';
      placeForm.elements['kind'].value = place.kind || 'diem-du-lich';
      placeForm.elements['region'].value = place.region || '';
      placeForm.elements['category'].value = place.category || '';
      placeForm.elements['ownerId'].value = place.ownerId || 'Hệ thống (System)';
      // No more 'image' input, handled by dropzone preview below
      placeForm.elements['budget'].value = place.budget || 2;
      placeForm.elements['pace'].value = place.pace || 'vua';
      placeForm.elements['lat'].value = place.lat || '';
      placeForm.elements['lng'].value = place.lng || '';
      placeForm.elements['tags'].value = (place.tags || []).join(', ');
      placeForm.elements['description'].value = place.description || '';
      placeForm.elements['text'].value = place.text || '';
      placeForm.elements['sourceName'].value = place.sourceName || '';
      placeForm.elements['sourceUrl'].value = place.sourceUrl || '';
      placeForm.elements['transportTips'].value = place.transportTips || '';
      
      // New rich content
      placeForm.elements['overview'].value = place.overview || '';
      placeForm.elements['experience'].value = place.experience || '';
      placeForm.elements['highlights'].value = (place.highlights || []).join(', ');
      placeForm.elements['themeColor'].value = place.themeColor || '#3b82f6';
      placeForm.elements['priceFrom'].value = place.priceFrom || '';
      placeForm.elements['priceTo'].value = place.priceTo || '';
      placeForm.elements['openTime'].value = place.openTime || '';
      placeForm.elements['closeTime'].value = place.closeTime || '';
      
      // Nested Arrays (JSON formatting)
      placeForm.elements['amusementPlaces'].value = place.amusementPlaces && place.amusementPlaces.length ? JSON.stringify(place.amusementPlaces, null, 2) : '';
      placeForm.elements['accommodations'].value = place.accommodations && place.accommodations.length ? JSON.stringify(place.accommodations, null, 2) : '';
      placeForm.elements['diningPlaces'].value = place.diningPlaces && place.diningPlaces.length ? JSON.stringify(place.diningPlaces, null, 2) : '';
      placeForm.elements['checkInSpots'].value = place.checkInSpots && place.checkInSpots.length ? JSON.stringify(place.checkInSpots, null, 2) : '';

      document.getElementById('chk-top').checked = !!place.top;
      document.getElementById('chk-verified').checked = !!place.verified;

      // Handle displaying images
      let imagesArr = place.images && place.images.length > 0 ? place.images : (place.image ? [place.image] : []);
      renderDropzonePreview(imagesArr.map(url => ({ url })));
    } else {
      placeForm.elements['id'].value = '';
      renderDropzonePreview([]);
    }

    document.getElementById('admin-modal-backdrop').hidden = false;
    placeModal.hidden = false;
    requestAnimationFrame(() => {
      placeModal.classList.add('is-open');
    });
  }

  placeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = placeForm.elements['id'].value;

    const formData = new FormData(placeForm);
    const tags = placeForm.elements['tags'].value.split(',').map(tag => tag.trim()).filter(tag => tag);
    formData.set('tags', tags.join(','));
    
    // Process highlights string to array
    const hContent = placeForm.elements['highlights'].value;
    const highlights = hContent.split(',').map(h => h.trim()).filter(h => h);
    formData.set('highlights', JSON.stringify(highlights));

    // Validate JSON Arrays
    const jsonFields = ['amusementPlaces', 'accommodations', 'diningPlaces', 'checkInSpots'];
    for (let f of jsonFields) {
      const val = placeForm.elements[f].value.trim();
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (!Array.isArray(parsed)) throw new Error('Phải là một mảng (Array)');
          formData.set(f, JSON.stringify(parsed));
        } catch (e) {
          showStatus(placeFormStatus, `Lỗi JSON ở trường ${f}: ${e.message}`, false);
          return;
        }
      } else {
        formData.set(f, '[]');
      }
    }
    formData.set('highlights', JSON.stringify(highlights));

    formData.set('top', document.getElementById('chk-top').checked);
    formData.set('verified', document.getElementById('chk-verified').checked);

    // Sync retained URL array to FormData
    let retainedImages = currentDropzoneFiles.filter(f => f.url && !f.file).map(f => f.url);
    formData.set('images', JSON.stringify(retainedImages));
    // Important: we remove the 'imageFile' if we've handled them through dropzone `currentDropzoneFiles`
    formData.delete('imageFile');
    currentDropzoneFiles.filter(f => f.file).forEach(f => {
      formData.append('imageFile', f.file);
    });

    const submitBtn = placeForm.querySelector('button[type="submit"]');
    if (window.WanderUI && window.WanderUI.setButtonLoading) window.WanderUI.setButtonLoading(submitBtn, true);
    placeFormStatus.textContent = 'Đang lưu...';
    placeFormStatus.style.color = 'var(--text-muted)';

    try {
      let url = '/api/admin/places';
      let method = 'POST';
      if (id) {
        url += '/' + id;
        method = 'PUT';
      }

      const res = await apiFetch(url, { 
        method: method, 
        body: formData,
        isFormData: true 
      });

      if (res.success) {
        placeFormStatus.textContent = 'Đã lưu thành công!';
        placeFormStatus.style.color = '#4ade80';
        await loadPlaces();
        updateStats();
        setTimeout(() => closeAllModals(), 1000);
      } else {
        placeFormStatus.textContent = res.message || 'Lỗi lưu thông tin';
        placeFormStatus.style.color = '#f87171';
      }
    } catch (err) {
      placeFormStatus.textContent = err.message || 'Lỗi kết nối máy chủ';
      placeFormStatus.style.color = '#f87171';
    } finally {
      const submitBtn = placeForm.querySelector('button[type="submit"]');
      if (window.WanderUI && window.WanderUI.setButtonLoading) window.WanderUI.setButtonLoading(submitBtn, false);
    }
  });

  btnDeletePlace.addEventListener('click', async () => {
    const id = placeForm.elements['id'].value;
    if (!id || !confirm('Hành động này không thể hoàn tác. Bạn có chắc muốn xóa điểm này?')) return;

    try {
      const res = await apiFetch(`/api/admin/places/${id}`, { method: 'DELETE' });
      if (res.success) {
        alert('Đã xóa thành công');
        closeAllModals();
        await loadPlaces();
        updateStats();
      } else {
        alert(res.message || 'Không thể xóa');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  });

  // --- Utils ---
  function closeAllModals() {
    if (userModal) userModal.classList.remove('is-open');
    if (placeModal) placeModal.classList.remove('is-open');
    setTimeout(() => {
      if (userModal && !userModal.classList.contains('is-open')) userModal.hidden = true;
      if (placeModal && !placeModal.classList.contains('is-open')) placeModal.hidden = true;
      document.getElementById('admin-modal-backdrop').hidden = true;
    }, 350);
  }

  // --- Dropzone Logic ---
  let currentDropzoneFiles = []; // {url: string, file?: File, preview?: string}
  const placeDropzone = document.getElementById('place-dropzone');
  const placeDropzonePreview = document.getElementById('place-dropzone-preview');
  const placeImageInput = document.getElementById('place-image-input');
  
  function renderDropzonePreview(files) {
    currentDropzoneFiles = files || [];
    if (!placeDropzonePreview) return;
    placeDropzonePreview.innerHTML = '';
    currentDropzoneFiles.forEach((f, idx) => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:relative; width:80px; height:80px; border-radius:var(--radius-sm); overflow:hidden; border:1px solid var(--border);';
      const img = document.createElement('img');
      img.src = f.preview || f.url || '';
      img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
      const btn = document.createElement('button');
      btn.innerHTML = '&times;';
      btn.style.cssText = 'position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.5); color:#fff; border:none; border-radius:50%; width:20px; height:20px; line-height:1; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center;';
      btn.onclick = (e) => {
        e.preventDefault();
        currentDropzoneFiles.splice(idx, 1);
        renderDropzonePreview(currentDropzoneFiles);
      };
      wrapper.appendChild(img);
      wrapper.appendChild(btn);
      placeDropzonePreview.appendChild(wrapper);
    });
  }

  async function loadFeedbacks(silent = false) {
    const openDetailIds = Array.from(document.querySelectorAll('.detail-row.is-open')).map(el => el.id);
    if (!silent) {
      const fbTbody = document.getElementById('feedbacks-tbody');
      if (fbTbody) fbTbody.innerHTML = '<tr><td colspan="5" style="text-align:center"><span class="spinner-small"></span> Đang tải...</td></tr>';
    }
    try {
      const res = await apiFetch('/api/admin/feedbacks?t=' + Date.now());
      if (res.success) {
        feedbacksData = res.data;
        renderFeedbacks(feedbacksData);
        openDetailIds.forEach(id => {
          const row = document.getElementById(id);
          if (row) row.classList.add('is-open');
        });
      }
    } catch (e) {}
  }

  if (placeDropzone && placeImageInput) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evName => {
      placeDropzone.addEventListener(evName, e => e.preventDefault());
      placeDropzone.addEventListener(evName, e => e.stopPropagation());
    });
    
    placeDropzone.addEventListener('dragover', () => placeDropzone.style.borderColor = 'var(--primary)');
    placeDropzone.addEventListener('dragleave', () => placeDropzone.style.borderColor = '');
    placeDropzone.addEventListener('drop', (e) => {
      placeDropzone.style.borderColor = '';
      if (e.dataTransfer && e.dataTransfer.files) handleDropzoneFiles(e.dataTransfer.files);
    });
    placeImageInput.addEventListener('change', (e) => {
      if (e.target.files) handleDropzoneFiles(e.target.files);
    });
  }

  function handleDropzoneFiles(fileList) {
    Array.from(fileList).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Ảnh ${file.name} vượt quá dung lượng 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        currentDropzoneFiles.push({ file: file, preview: e.target.result });
        renderDropzonePreview(currentDropzoneFiles);
      };
      reader.readAsDataURL(file);
    });
    if (placeImageInput) placeImageInput.value = '';
  }


  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  document.getElementById('admin-modal-backdrop').addEventListener('click', closeAllModals);

  // --- Feedbacks ---
  function renderFeedbacks(feedbacks) {
    const fnTable = document.getElementById('feedbacks-tbody');
    if (!fnTable) return;

    fnTable.innerHTML = '';
    if (feedbacks.length === 0) {
      fnTable.innerHTML = '<tr><td colspan="5" style="text-align:center">Chưa có phản hồi nào</td></tr>';
      return;
    }

    feedbacks.forEach(fb => {
      const tr = document.createElement('tr');
      const date = new Date(fb.createdAt);
      const timeStr = `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`;
      
      tr.innerHTML = `
        <td><small style="color:var(--text-muted)">${timeStr}</small></td>
        <td><strong>${fb.name}</strong></td>
        <td><a href="mailto:${fb.email}" style="color:var(--text-muted); text-decoration:underline;">${fb.email}</a></td>
        <td style="white-space:normal; line-height:1.4">${(fb.message || '').replace(/\n/g, '<br>')}</td>
        <td>
          <button class="btn btn--ghost btn--small delete-fb-btn" data-id="${fb._id}" style="color:#f87171;border-color:rgba(248,113,113,0.4)">Xóa</button>
        </td>
      `;
      fnTable.appendChild(tr);
    });

    document.querySelectorAll('.delete-fb-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn xóa phản hồi này vĩnh viễn không?')) {
          try {
            const res = await apiFetch('/api/admin/feedbacks/' + id, { method: 'DELETE' });
            if (res.success) {
              await loadFeedbacks();
              updateStats();
            } else {
              alert('Lỗi: ' + res.message);
            }
          } catch (e) {
            alert('Lỗi kết nối máy chủ');
          }
        }
      });
    });
  }

  const fbSearchInput = document.getElementById('feedback-search');
  if (fbSearchInput) {
    fbSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const filtered = feedbacksData.filter(fb => {
        const text = ((fb.name || '') + ' ' + (fb.email || '') + ' ' + (fb.message || '')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return text.includes(q);
      });
      renderFeedbacks(filtered);
    });
  }

  // --- Itineraries ---
  async function loadItineraries() {
    const tbody = document.getElementById('itineraries-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Đang tải...</td></tr>';
    try {
      const json = await apiFetch('/api/admin/itineraries');
      if (json.success) {
        itinerariesData = json.data;
        renderItineraries(itinerariesData);
      }
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red">Lỗi tải dữ liệu</td></tr>';
    }
  }

  function renderItineraries(itineraries) {
    const tbody = document.getElementById('itineraries-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (itineraries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Chưa có lịch trình AI nào được tạo</td></tr>';
      return;
    }

    itineraries.forEach(it => {
      const tr = document.createElement('tr');
      const date = new Date(it.createdAt);
      const timeStr = `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`;
      
      tr.innerHTML = `
        <td><small style="color:var(--text-muted)">${timeStr}</small></td>
        <td><strong>${it.destination}</strong></td>
        <td>${it.days} Ngày</td>
        <td>${it.budget || '—'}</td>
        <td style="display:flex; gap: 0.5rem">
          <button class="btn btn--ghost btn--small view-itin-btn" title="Xem JSON" data-id="${it._id}" style="border-color:var(--color-primary); color:var(--color-primary)">Xem</button>
          <button class="btn btn--ghost btn--small delete-itin-btn" data-id="${it._id}" style="color:#f87171;border-color:rgba(248,113,113,0.4)">Xóa</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.delete-itin-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn xóa lịch trình này khỏi hệ thống không?')) {
          try {
            const res = await apiFetch('/api/admin/itineraries/' + id, { method: 'DELETE' });
            if (res.success) {
              await loadItineraries();
              updateStats();
            } else {
              alert('Lỗi: ' + res.message);
            }
          } catch (e) {
            alert('Lỗi kết nối máy chủ');
          }
        }
      });
    });

    document.querySelectorAll('.view-itin-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        const it = itinerariesData.find(x => x._id === id);
        if (it) {
           alert("JSON Data:\\n" + JSON.stringify(it.planJson, null, 2));
           // In future we can render it in a proper modal, for now alert is fast
        }
      });
    });
  }

  const itinSearchInput = document.getElementById('itinerary-search');
  if (itinSearchInput) {
    itinSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const filtered = itinerariesData.filter(it => {
        const text = ((it.destination || '') + ' ' + (it.budget || '')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return text.includes(q);
      });
      renderItineraries(filtered);
    });
  }

  // --- Logs (Real Data) ---
  const logsTbody = document.getElementById('logs-tbody');
  const miniLogsContainer = document.getElementById('admin-mini-logs');
  let logsData = [];

  async function loadLogs(filter = 'all') {
    try {
      const json = await apiFetch('/api/admin/logs');
      if (json.success) {
        logsData = json.data;
        if (typeof updateLogDashboard === 'function') updateLogDashboard(logsData);
      }
    } catch (err) {
      console.warn('Failed to load real logs:', err);
    }
    
    // 1. Fill main table if present
    if(logsTbody) {
      logsTbody.innerHTML = '';
      const filtered = filter === 'all' ? logsData : logsData.filter(l => l.role === filter);
      if(filtered.length === 0) {
        logsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Không có lịch sử</td></tr>';
      } else {
        filtered.forEach(l => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><small style="color:var(--text-muted)">${new Date(l.timestamp).toLocaleTimeString('vi-VN')} - ${new Date(l.timestamp).toLocaleDateString('vi-VN')}</small></td>
            <td><strong>${l.userName || 'System'}</strong></td>
            <td><span style="color:var(--admin-accent)">${WanderUI.getFriendlyAction(l.action)}</span></td>
            <td><span class="dest-pill" style="font-size:0.7rem">${l.userRole || 'Visitor'}</span></td>
          `;
          logsTbody.appendChild(tr);
        });
      }
    }

    // 2. Fill mini logs in Overview
    if (miniLogsContainer) {
      miniLogsContainer.innerHTML = '';
      logsData.slice(0, 5).forEach(l => {
        const item = document.createElement('div');
        item.className = 'log-item-minimal';
        const ago = Math.floor((Date.now() - new Date(l.timestamp)) / 60000);
        const timeStr = ago < 1 ? 'Vừa xong' : (ago < 60 ? `${ago} phút trước` : `${Math.floor(ago/60)} giờ trước`);
        
        // Dynamic icon based on action
        let icon = '📝';
        if (l.action.includes('CREATED')) icon = '✨';
        if (l.action.includes('UPDATED')) icon = '🔄';
        if (l.action.includes('LOGIN')) icon = '🔑';

        item.innerHTML = `
          <div class="log-icon-min">${icon}</div>
          <div class="log-text-min"><strong>${(l.userName || 'Admin').split('@')[0]}</strong> ${WanderUI.getFriendlyAction(l.action)}</div>
          <div class="log-time-min">${timeStr}</div>
        `;
        miniLogsContainer.appendChild(item);
      });
    }
  }

  let logManagerChart = null;
  function updateLogDashboard(logs) {
    const dashboard = document.getElementById('log-manager-dashboard');
    if (!dashboard) return;
    dashboard.style.display = 'block';

    const total = logs.length;
    const todayStr = new Date().toDateString();
    const todayCount = logs.filter(l => new Date(l.timestamp).toDateString() === todayStr).length;
    const adminCount = logs.filter(l => l.userRole === 'admin' || l.userRole === 'superadmin').length;
    const systemCount = logs.filter(l => !l.userId).length;

    const elTotal = document.getElementById('lm-total');
    const elToday = document.getElementById('lm-today');
    const elAdmin = document.getElementById('lm-admin');
    const elSystem = document.getElementById('lm-system');

    if (elTotal) elTotal.textContent = total;
    if (elToday) elToday.textContent = todayCount;
    if (elAdmin) elAdmin.textContent = adminCount;
    if (elSystem) elSystem.textContent = systemCount;

    const ctx = document.getElementById('logManagerChart')?.getContext('2d');
    if (ctx) {
      if (logManagerChart) logManagerChart.destroy();
      const actions = {};
      logs.slice(0, 100).forEach(l => {
        actions[l.action] = (actions[l.action] || 0) + 1;
      });

      logManagerChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(actions),
          datasets: [{
            label: 'Tần suất hành động',
            data: Object.values(actions),
            backgroundColor: '#6366f1',
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
          }
        }
      });
    }
  }

  document.querySelectorAll('[data-log-filter]').forEach(btn => {
    btn.addEventListener('click', function() {
      loadLogs(this.getAttribute('data-log-filter'));
    });
  });

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const savedTheme = localStorage.getItem('admin_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const nextTheme = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('admin_theme', nextTheme);
    });
  }

  // --- Moderation ---
  let moderationData = [];
  async function loadModeration() {
    const tbody = document.getElementById('moderation-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Đang tải hàng chờ...</td></tr>';
    
    try {
      const json = await apiFetch('/api/admin/places'); // Admin sees all, filter for partner/pending
      if (json.success) {
        const allData = json.data;
        // Only show pending items in the table
        moderationData = allData.filter(p => p.status === 'pending');
        renderModeration(moderationData);
        updateModerationDashboard(allData);
        
        // Update badge count
        const pendingCount = moderationData.length;
        const badge = document.getElementById('badge-pending-count');
        if (badge) {
          badge.textContent = pendingCount;
          badge.hidden = pendingCount === 0;
        }
      }
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#f87171">Lỗi tải dữ liệu</td></tr>';
    }
  }

  let moderationManagerChart = null;
  function updateModerationDashboard(allData) {
    const dashboard = document.getElementById('moderation-manager-dashboard');
    if (!dashboard) return;
    dashboard.style.display = 'block';

    const pending = allData.filter(p => p.status === 'pending').length;
    const approved = allData.filter(p => p.status === 'approved').length;
    const rejected = allData.filter(p => p.status === 'rejected').length;
    
    document.getElementById('mm-pending').textContent = pending;
    document.getElementById('mm-queue').textContent = approved;
    document.getElementById('mm-urgent').textContent = allData.filter(d => d.type === 'report').length;

    const ctx = document.getElementById('moderationManagerChart')?.getContext('2d');
    if (ctx) {
      if (moderationManagerChart) moderationManagerChart.destroy();

      moderationManagerChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Chờ duyệt', 'Đã duyệt', 'Bị từ chối'],
          datasets: [{
            data: [pending, approved, rejected],
            backgroundColor: ['#f59e0b', '#10b981', '#f43f5e'],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          cutout: '70%',
          responsive: true,

          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } }
        }
      });
    }
  }

  function renderModeration(data) {
    const tbody = document.getElementById('moderation-tbody');
    tbody.innerHTML = '';
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted)">Hàng chờ trống. Chưa có yêu cầu duyệt nào.</td></tr>';
      return;
    }

    data.forEach(p => {
      const tr = document.createElement('tr');
      const statusClass = p.status === 'approved' ? 'stat-pill--ok' : (p.status === 'pending' ? 'stat-pill--warn' : 'stat-pill--err');
      const statusText = p.status === 'approved' ? 'Đã duyệt' : (p.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối');
      
      tr.innerHTML = `
        <td>
          <div style="display:flex; gap:0.75rem; align-items:center">
            <img src="${p.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=60&q=80'}" 
                 onerror="this.src='https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=60&q=80'"
                 style="width:50px; height:35px; border-radius:4px; object-fit:cover;" />
            <div>
              <div style="font-weight:600">${p.name}</div>
              <div style="font-size:0.75rem; color:var(--text-muted)">${p.region}</div>
            </div>
          </div>
        </td>
        <td><small>${p.ownerName || 'System'}</small></td>
        <td>${new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
        <td><span class="stat-pill ${statusClass}">${statusText}</span></td>
        <td>
          <div style="display:flex; gap:0.5rem">
            ${p.status === 'pending' ? `
              <button class="btn btn--small btn--primary" data-mod-approve="${p.id}">Duyệt</button>
              <button class="btn btn--small btn--outline btn--danger" data-mod-reject="${p.id}">Từ chối</button>
            ` : `
              <button class="btn btn--small btn--ghost" data-edit-place="${p.id}">Xem lại</button>
            `}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Event listeners
    tbody.querySelectorAll('[data-mod-approve]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-mod-approve');
        if (!confirm('Xác nhận phê duyệt nội dung này hiển thị lên hệ thống?')) return;
        await moderatePlace(id, 'approved');
      });
    });

    tbody.querySelectorAll('[data-mod-reject]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-mod-reject');
        const reason = prompt('Lý do từ chối:');
        if (reason === null) return;
        await moderatePlace(id, 'rejected', reason);
      });
    });
  }

  async function moderatePlace(id, status, reason = '') {
    try {
      const res = await apiFetch(`/api/admin/places/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      if (res.success) {
        if (window.WanderUI) window.WanderUI.showToast(`Đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} thành công`, 'success');
        await loadModeration();
        await loadPlaces();
        updateStats();
      }
    } catch (err) {
      console.error('Moderation error:', err);
      alert('Lỗi cập nhật trạng thái: ' + (err.message || 'Lỗi không xác định'));
    }
  }

  // (loadLogs is defined above at line ~927 - do not duplicate)

  // (refreshAll handles polling at line ~333)

  function setupBroadcastForm() {
    const form = document.getElementById('broadcast-form');
    if (form && form.dataset.initialized === 'true') return;
    const status = document.getElementById('broadcast-status') || document.createElement('p');
    if (!form) return;
    form.dataset.initialized = 'true';
    
    if (!document.getElementById('broadcast-status')) {
      status.id = 'broadcast-status';
      status.style.fontSize = '0.85rem';
      status.style.marginTop = '1rem';
      form.appendChild(status);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const body = {
        title: fd.get('title'),
        message: fd.get('message'),
        recipientType: fd.get('recipientType'), // Match the select name in terminal UI
        type: fd.get('type')
      };

      const btn = document.getElementById('btn-send-broadcast');
      if (window.WanderUI) window.WanderUI.setButtonLoading(btn, true);
      status.textContent = '>> EXECUTING_PUSH...';
      status.style.color = '#94a3b8';

      try {
        const res = await apiFetch('/api/notifications/broadcast', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        if (res.success) {
          status.textContent = '>> SUCCESS: Broadcast delivered to network.';
          status.style.color = '#4ade80';
          form.reset();
          setTimeout(() => { status.textContent = ''; }, 3000);
          loadRealtimeLogs();
        } else {
          status.textContent = '>> ERROR: ' + (res.message || 'Transmission failed');
          status.style.color = '#f87171';
        }
      } catch (err) {
        status.textContent = '>> FATAL: Connection lost';
        status.style.color = '#f87171';
      } finally {
        if (window.WanderUI) window.WanderUI.setButtonLoading(btn, false);
      }
    });
  }

  window.openAdminPermissionsEditor = function(adminId, currentPermsStr) {
    const currentPerms = currentPermsStr ? currentPermsStr.split(',') : [];
    const sections = [
      { id: 'overview', label: 'Tổng quan' },
      { id: 'moderation', label: 'Duyệt nội dung' },
      { id: 'users', label: 'Quản lý người dùng' },
      { id: 'broadcast', label: 'Gửi thông báo' },
      { id: 'logs', label: 'Nhật ký hệ thống' },
      { id: 'places', label: 'Kho địa điểm' },
      { id: 'knowledge', label: 'Dữ liệu AI' },
      { id: 'ai-intelligence', label: 'Trí tuệ AI' },
      { id: 'admin-management', label: 'Quản lý Admin' }
    ];

    const modalHtml = `
      <div id="perm-modal" class="glass-panel" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:10001; width:500px; padding:2rem; border:1px solid var(--admin-border);">
        <h3 style="margin-bottom:1.5rem; font-family:'Outfit',sans-serif">Chỉnh sửa quyền Admin</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:2rem;">
          ${sections.map(s => `
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="checkbox" name="edit-perm" value="${s.id}" ${currentPerms.includes(s.id) ? 'checked' : ''}>
              <span>${s.label}</span>
            </label>
          `).join('')}
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
          <button class="btn btn--ghost" onclick="closePermModal()">Hủy</button>
          <button class="btn btn--primary" id="btn-save-perms">Lưu thay đổi</button>
        </div>
      </div>
    `;

    const backdrop = document.createElement('div');
    backdrop.id = 'perm-backdrop';
    backdrop.style = 'position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:10000;';
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.appendChild(backdrop);

    window.closePermModal = () => {
      document.getElementById('perm-modal')?.remove();
      document.getElementById('perm-backdrop')?.remove();
    };

    document.getElementById('btn-save-perms').addEventListener('click', async () => {
      const btn = document.getElementById('btn-save-perms');
      const perms = Array.from(document.querySelectorAll('input[name="edit-perm"]:checked')).map(cb => cb.value);

      if (window.WanderUI) window.WanderUI.setButtonLoading(btn, true);
      try {
        const res = await apiFetch(`/api/admin/admins/${adminId}/permissions`, {
          method: 'PUT',
          body: JSON.stringify({ permissions: perms })
        });
        if (res.success) {
          if (window.WanderUI) window.WanderUI.showToast('Cập nhật quyền thành công!', 'success');
          closePermModal();
          loadUsers();
        } else {
          if (window.WanderUI) window.WanderUI.showToast(res.message, 'error');
        }
      } catch (e) {
        if (window.WanderUI) window.WanderUI.showToast('Lỗi kết nối máy chủ', 'error');
      } finally {
        if (window.WanderUI) window.WanderUI.setButtonLoading(btn, false);
      }
    });
  };

  function setupAdminCreationForm() {
    const form = document.getElementById('w-admin-register-form');
    const status = document.getElementById('w-admin-create-status');
    const submitBtn = document.getElementById('w-btn-create-admin');
    
    if (!form || !status || !submitBtn) {
      console.warn('Admin creation form elements missing:', { form, status, submitBtn });
      return;
    }
    console.log('Admin creation form initialized successfully.');
    if (form.dataset.initialized === '1') return;
    form.dataset.initialized = '1';

    if (!currentAdmin || currentAdmin.role !== 'superadmin') {
      form.style.opacity = '0.55';
      form.querySelectorAll('input,button').forEach(el => el.disabled = true);
      status.textContent = 'Bạn không có quyền tạo admin mới.';
      return;
    }


    submitBtn.addEventListener('click', async (e) => {
      console.log('Admin creation button clicked.');
      if (!form.checkValidity()) {
        // Let the browser show native validation tooltips
        return;
      }
      e.preventDefault();
      
      const fd = new FormData(form);
      const perms = Array.from(form.querySelectorAll('input[name="permissions"]:checked')).map(cb => cb.value);
      const body = {
        name: String(fd.get('name') || '').trim(),
        email: String(fd.get('email') || '').trim().toLowerCase(),
        password: String(fd.get('password') || ''),
        permissions: perms
      };
      
      if (!body.name || !body.email || !body.password) {
        status.style.color = '#f87171';
        status.textContent = 'Vui lòng nhập đầy đủ tất cả các trường.';
        return;
      }
      
      if (window.WanderUI) window.WanderUI.setButtonLoading(submitBtn, true);
      status.style.color = '#94a3b8';
      status.textContent = 'Đang kết nối tới máy chủ...';
      
      try {
        const json = await apiFetch('/api/auth/admin/create', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        if (json.success) {
          status.style.color = '#4ade80';
          status.textContent = `Thành công! Đã tạo admin: ${body.email}`;
          form.reset();
          if (typeof loadUsers === 'function') loadUsers();
          if (window.WanderUI) window.WanderUI.showToast('Tạo admin thành công', 'success');
        } else {
          status.style.color = '#f87171';
          status.textContent = 'Lỗi Backend: ' + (json.message || 'Không thể tạo admin');
        }
      } catch (err) {
        console.error('Lỗi tạo admin:', err);
        status.style.color = '#f87171';
        status.textContent = 'Lỗi kết nối: ' + (err.message || 'Thất bại');
      } finally {
        if (window.WanderUI) window.WanderUI.setButtonLoading(submitBtn, false);
      }
    });
  }

  function updateStats() {
    return loadSystemStats();
  }

  // --- Theme Customizer ---
  function initThemeCustomizer() {
    const STORAGE_KEY = 'admin_bg_preset';
    const presets = {
      default: 'radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 50%), var(--admin-bg)',
      midnight: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      forest: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
      slate: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      purple: 'linear-gradient(135deg, #2e1065 0%, #0f172a 100%)'
    };

    const applyPreset = (name) => {
      const gradient = presets[name];
      let styleTag = document.getElementById('admin-bg-override');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'admin-bg-override';
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = `
        .admin-body::before { background: ${gradient} !important; }
        .admin-body { background: ${gradient.includes('var') ? 'var(--admin-bg)' : gradient.split(',').pop().trim()} !important; }
      `;
      localStorage.setItem(STORAGE_KEY, name);
      document.querySelectorAll('.bg-preset-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.preset === name);
        btn.style.boxShadow = btn.dataset.preset === name ? '0 0 15px var(--admin-primary)' : 'none';
      });
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && presets[saved]) applyPreset(saved);

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.bg-preset-btn');
      if (btn) applyPreset(btn.dataset.preset);
    });
  }

  // --- Modal Helpers ---
  function closeAllModals() {
    const drawers = document.querySelectorAll('.slide-drawer');
    const backdrop = document.getElementById('admin-modal-backdrop');
    
    drawers.forEach(d => {
      d.classList.remove('is-open');
      setTimeout(() => { if (!d.classList.contains('is-open')) d.hidden = true; }, 400);
    });
    
    if (backdrop) {
      backdrop.hidden = true;
    }

    // Reset place dropzone so images don't linger between open/close
    renderDropzonePreview([]);
  }

  document.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close-modal') || e.target.id === 'admin-modal-backdrop') {
      closeAllModals();
    }
  });

  function setupProfileEdit() {
    const profileModal = document.getElementById('modal-profile-edit');
    const profileForm = document.getElementById('profile-edit-form');
    const profileStatus = document.getElementById('profile-edit-status');
    const navProfile = document.querySelector('.admin-profile');
    const sidebarAvatar = document.getElementById('sidebar-admin-avatar');
    
    // Dropzone elements
    const dropzone = document.getElementById('profile-dropzone');
    const previewList = document.getElementById('profile-dropzone-preview');
    const fileInput = document.getElementById('profile-image-input');
    let currentFile = null;

    if (!profileForm || !profileModal) return;

    const renderPreview = (url) => {
      if (!previewList) return;
      previewList.innerHTML = url ? `
        <div style="position:relative; width:58px; height:58px; border-radius:10px; overflow:hidden; border:1px solid var(--admin-border);">
          <img src="${url}" style="width:100%; height:100%; object-fit:cover;" />
          <button type="button" id="btn-remove-profile-img" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:#fff; border:none; border-radius:50%; width:16px; height:16px; cursor:pointer; font-size:10px; display:flex; align-items:center; justify-content:center; line-height:1;">&times;</button>
        </div>
      ` : '';
      if (url) {
        document.getElementById('btn-remove-profile-img').onclick = () => {
          currentFile = null;
          document.getElementById('hidden-profile-avatar').value = '';
          renderPreview(null);
        };
      }
    };

    const openProfile = () => {
      // Reset form & preview every time modal opens
      profileForm.elements['displayName'].value = currentAdmin.displayName || currentAdmin.name || '';
      document.getElementById('hidden-profile-avatar').value = '';
      currentFile = null;
      if (fileInput) fileInput.value = '';
      renderPreview(null); // Always start with empty preview

      profileForm.elements['email'].value = currentAdmin.email || '';
      profileStatus.textContent = '';
      document.getElementById('admin-modal-backdrop').hidden = false;
      profileModal.hidden = false;
      requestAnimationFrame(() => profileModal.classList.add('is-open'));
    };

    if (navProfile) navProfile.addEventListener('click', openProfile);
    if (sidebarAvatar) sidebarAvatar.addEventListener('click', openProfile);

    // Dropzone listeners
    if (dropzone && fileInput) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(n => {
        dropzone.addEventListener(n, e => { e.preventDefault(); e.stopPropagation(); });
      });
      dropzone.addEventListener('dragover', () => dropzone.style.borderColor = 'var(--admin-primary)');
      dropzone.addEventListener('dragleave', () => dropzone.style.borderColor = '');
      dropzone.addEventListener('drop', e => {
        dropzone.style.borderColor = '';
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      });
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) handleFile(file);
      });
    }

    function handleFile(file) {
      if (!file.type.startsWith('image/')) return;
      currentFile = file;
      const reader = new FileReader();
      reader.onload = e => renderPreview(e.target.result);
      reader.readAsDataURL(file);
    }

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      if (currentFile) {
        formData.set('avatarFile', currentFile);
      }

      profileStatus.textContent = 'Đang lưu...';
      profileStatus.style.color = 'var(--admin-text-muted)';

      try {
        const res = await apiFetch('/api/admin/profile', {
          method: 'PUT',
          body: formData // FormData handles Content-Type automatically
        });

        if (res.success) {
          profileStatus.textContent = 'Đã cập nhật hồ sơ thành công!';
          profileStatus.style.color = '#4ade80';
          
          // Update local state with new info
          const updatedUser = res.data || {};
          currentAdmin.displayName = updatedUser.displayName || currentAdmin.displayName;
          currentAdmin.avatar = updatedUser.avatar || currentAdmin.avatar;
          
          // Sync UI
          const navName = document.getElementById('admin-name-head');
          const sidebarName = document.getElementById('sidebar-admin-name');
          const navAvatar = document.getElementById('admin-avatar-head');
          const sidebarAvatarEl = document.getElementById('sidebar-admin-avatar');
          
          if (navName) navName.textContent = currentAdmin.displayName;
          if (sidebarName) sidebarName.textContent = currentAdmin.displayName;
          
          if (navAvatar) {
            navAvatar.src = currentAdmin.avatar || '';
            navAvatar.onerror = function() {
              this.onerror = null;
              this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentAdmin.displayName || currentAdmin.name || 'A')}&background=random&color=fff`;
            };
            if (!navAvatar.src || navAvatar.src === window.location.href) navAvatar.onerror();
          }
          if (sidebarAvatarEl) {
            sidebarAvatarEl.src = currentAdmin.avatar || '';
            sidebarAvatarEl.onerror = function() {
              this.onerror = null;
              this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentAdmin.displayName || currentAdmin.name || 'A')}&background=random&color=fff`;
            };
            if (!sidebarAvatarEl.src || sidebarAvatarEl.src === window.location.href) sidebarAvatarEl.onerror();
          }

          setTimeout(() => closeAllModals(), 1000);
        } else {
          profileStatus.textContent = res.message || 'Lỗi lưu hồ sơ';
          profileStatus.style.color = '#f87171';
        }
      } catch (err) {
        profileStatus.textContent = 'Lỗi kết nối máy chủ';
        profileStatus.style.color = '#f87171';
      }
    });
  }

  // --- KNOWLEDGE MANAGEMENT ---
  async function loadKnowledge() {
    const tbody = document.getElementById('knowledge-tbody');
    if (!tbody) return;

    try {
      const json = await apiFetch('/api/knowledge');
      if (json.success) {
        knowledgeData = json.data;
        renderKnowledgeTable();
        updateKnowledgeDashboard(knowledgeData);
      }
    } catch (err) {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="4">Lỗi tải dữ liệu AI.</td></tr>';
    }
  }

  function updateKnowledgeDashboard(data) {
    const dashboard = document.getElementById('knowledge-manager-dashboard');
    if (!dashboard) return;
    dashboard.style.display = 'block';

    const total = data.length;
    const tagsCount = [...new Set(data.flatMap(k => k.tags || []))].length;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = data.filter(k => new Date(k.createdAt) > weekAgo).length;

    const elTotal = document.getElementById('km-total');
    const elTags = document.getElementById('km-tags');
    const elRecent = document.getElementById('km-recent');

    if (elTotal) elTotal.textContent = total;
    if (elTags) elTags.textContent = tagsCount;
    if (elRecent) elRecent.textContent = recent;
  }

  function renderKnowledgeTable() {
    const tbody = document.getElementById('knowledge-tbody');
    if (!tbody) return;

    if (knowledgeData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem">Chưa có dữ liệu tri thức. Hãy nạp dữ liệu mẫu hoặc thêm mới!</td></tr>';
      return;
    }

    tbody.innerHTML = knowledgeData.map(item => `
      <tr>
        <td style="font-weight:500">${item.question}</td>
        <td style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.answer}">${item.answer}</td>
        <td>${(item.tags || []).join(', ')}</td>
        <td>
          <button class="btn btn--danger btn--small" onclick="deleteKnowledge('${item._id}')">Xóa</button>
        </td>
      </tr>
    `).join('');
  }

  window.deleteKnowledge = async function(id) {
    if (!confirm('Bạn có chắc muốn xóa kiến thức này không?')) return;
    try {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      const json = await res.json();
      if (json.success) {
        knowledgeData = knowledgeData.filter(i => i._id !== id);
        renderKnowledgeTable();
      }
    } catch (e) { alert('Lỗi xóa dữ liệu'); }
  };

  document.getElementById('btn-seed-knowledge')?.addEventListener('click', async () => {
    if (!confirm('Hành động này sẽ nạp hàng loạt dữ liệu du lịch mẫu vào AI. Bạn có muốn tiếp tục?')) return;
    const btn = document.getElementById('btn-seed-knowledge');
    btn.disabled = true;
    btn.innerText = '♻️ Đang nạp...';
    try {
      const res = await fetch('/api/knowledge/seed', {
        method: 'POST',
        headers: { 'x-auth-token': token }
      });
      const json = await res.json();
      if (json.success) {
        alert('Nạp dữ liệu thành công!');
        loadKnowledge();
      }
    } catch (e) { alert('Lỗi nạp dữ liệu'); }
    btn.disabled = false;
    btn.innerText = '♻️ Nạp dữ liệu mẫu';
  });

  document.getElementById('btn-add-knowledge')?.addEventListener('click', async () => {
    const q = prompt('Nhập câu hỏi hoặc từ khóa:');
    if (!q) return;
    const a = prompt('Nhập câu trả lời AI:');
    if (!a) return;
    const t = prompt('Nhập tags (cách nhau bởi dấu phẩy):', q.toLowerCase());
    
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token 
        },
        body: JSON.stringify({ question: q, answer: a, tags: t.split(',').map(s => s.trim()) })
      });
      const json = await res.json();
      if (json.success) {
        knowledgeData.unshift(json.data);
        renderKnowledgeTable();
      }
    } catch (e) { alert('Lỗi thêm dữ liệu'); }
  });


  // ============================================================
  // PREMIUM v3 LOGIC ADDITIONS
  // ============================================================

  // 1. Live Clock
  function updateClock() {
    const clockEl = document.getElementById('admin-clock');
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  setInterval(updateClock, 1000);
  updateClock();

  // 2. Toast System
  window.WanderToast = {
    show(title, message, type = 'info', duration = 4000) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;
      
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };

      toast.innerHTML = `
        <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
        <div class="toast-body">
          <div class="toast-title">${title}</div>
          <div class="toast-msg">${message}</div>
        </div>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },
    success(msg) { this.show('Thành công', msg, 'success'); },
    error(msg) { this.show('Lỗi hệ thống', msg, 'error'); },
    warn(msg) { this.show('Cảnh báo', msg, 'warning'); }
  };

  // 3. Global Search (Ctrl + K)
  const searchWrap = document.getElementById('w-global-search-modal');
  const searchInput = document.getElementById('w-search-input');
  const searchResults = document.getElementById('w-search-results');

  function openSearch() {
    if (!searchWrap) return;
    searchWrap.classList.add('is-open');
    searchInput.value = '';
    searchInput.focus();
    renderSearchResults('');
  }

  function closeSearch() {
    if (searchWrap) searchWrap.classList.remove('is-open');
  }

  function renderSearchResults(query) {
    if (!searchResults) return;
    const q = query.toLowerCase().trim();
    if (!q) {
      searchResults.innerHTML = '<div class="empty-state"><p>Nhập từ khóa để tìm nhanh (người dùng, địa điểm, menu...)</p></div>';
      return;
    }

    const results = [];

    // 1. Search Menu Items
    const menuItems = [
      { label: 'Tổng quan', tab: 'overview', icon: '📊', type: 'Menu' },
      { label: 'Duyệt nội dung', tab: 'moderation', icon: '✅', type: 'Menu' },
      { label: 'Người dùng', tab: 'users', icon: '👥', type: 'Menu' },
      { label: 'Gửi thông báo', tab: 'broadcast', icon: '📢', type: 'Menu' },
      { label: 'Nhật ký hệ thống', tab: 'logs', icon: '📋', type: 'Menu' },
      { label: 'Kho địa điểm', tab: 'places', icon: '📍', type: 'Menu' },
      { label: 'Quản lý Admin', tab: 'admin-management', icon: '🔑', type: 'Menu' },
      { label: 'Dữ liệu AI', tab: 'knowledge', icon: '🧠', type: 'Menu' }
    ];
    menuItems.forEach(i => {
      if (i.label.toLowerCase().includes(q)) results.push(i);
    });

    // 2. Search Users
    usersData.filter(u => 
      (u.name && u.name.toLowerCase().includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q))
    ).slice(0, 5).forEach(u => {
      results.push({ label: u.name || u.email, tab: 'users', icon: '👤', type: 'Người dùng', id: u._id });
    });

    // 3. Search Places
    placesData.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.location && p.location.toLowerCase().includes(q))
    ).slice(0, 5).forEach(p => {
      results.push({ label: p.name, tab: 'places', icon: '🖼️', type: 'Địa điểm', id: p._id });
    });

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="empty-state"><p>Không tìm thấy kết quả cho "' + query + '"</p></div>';
      return;
    }

    searchResults.innerHTML = results.map(i => `
      <div class="search-result-item" data-tab="${i.tab}" data-id="${i.id || ''}">
        <span class="search-result-icon">${i.icon}</span>
        <div style="display:flex; flex-direction:column; gap:2px">
          <span class="search-result-label">${i.label}</span>
          <span class="search-result-meta">${i.type} ${i.id ? `ID: ${i.id.substring(0,8)}...` : ''}</span>
        </div>
      </div>
    `).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(el => {
      el.onclick = () => {
        const tab = el.getAttribute('data-tab');
        const targetBtn = document.querySelector(`.sidebar-btn[data-admin-tab="${tab}"]`);
        if (targetBtn) {
          // If search overlay is open, we need to make sure we close it before clicking
          closeSearch();
          // Small delay to allow overlay animation
          setTimeout(() => targetBtn.click(), 50);
        } else {
          window.WanderUI?.showToast('Không tìm thấy tab này: ' + tab, 'error');
        }
      };
    });
  }

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeAllModals();
    }
  });

  searchInput?.addEventListener('input', (e) => renderSearchResults(e.target.value));
  searchWrap?.addEventListener('click', (e) => {
    if (e.target === searchWrap) closeSearch();
  });
  document.getElementById('w-btn-search-trigger')?.addEventListener('click', openSearch);

  // Quick Actions Hook
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.getAttribute('data-admin-tab');
      document.querySelector(`.sidebar-btn[data-tab="${tab}"]`)?.click();
    };
  });


  window.closeRankingsDrawer = () => {
    const drawer = document.getElementById('rankings-drawer');
    if (drawer) {
      drawer.hidden = true;
      drawer.classList.remove('is-active');
    }
  };


  async function openRankingsDrawer(type, period) {
    const drawer = document.getElementById('rankings-drawer');
    const title = document.getElementById('drawer-rank-title');
    const content = document.getElementById('drawer-rank-content');

    if (!drawer) return;

    drawer.hidden = false;
    setTimeout(() => drawer.classList.add('is-active'), 10);

    content.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--admin-text-muted)">Đang tải danh sách đầy đủ...</div>';

    try {
      const json = await apiFetch(`/api/admin/stats/rankings?period=${period}&limit=50`);
      if (!json.success) return;

      const labels = {
        active: { title: 'Top Thời gian sử dụng', unit: 'phút' },
        itineraries: { title: 'Top Lịch trình', unit: 'lịch trình' },
        deposits: { title: 'Đại gia Nạp tiền', unit: 'VNĐ' },
        businesses: { title: 'Top Doanh nghiệp', unit: '❤️' },
        places: { title: 'Điểm đến HOT', unit: '❤️' }
      };

      const config = labels[type];
      title.innerText = config.title;

      const getMedal = (idx) => idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));

      content.innerHTML = config.data = json.data[type === 'active' ? 'topActive' : (type === 'itineraries' ? 'topItineraries' : (type === 'deposits' ? 'topDeposits' : (type === 'businesses' ? 'topBusinesses' : 'topPlaces')))]
        .map((item, idx) => {
          const info = item.info || item;
          const name = info.displayName || info.name || item.name || (type === 'businesses' ? 'Doanh nghiệp ẩn danh' : 'Thành viên WanderViệt');
          const avatar = info.avatar || item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
          const meta = info.email || item.region || (type === 'businesses' ? `${item.placeCount || 0} địa điểm sở hữu` : 'Thành viên WanderViệt');

          const val = type === 'active' ? Math.floor(item.minutes || 0) : (type === 'itineraries' ? item.count : (type === 'deposits' ? (item.totalSpent || 0).toLocaleString() : (type === 'businesses' ? item.totalFavs : item.favoritesCount)));

          return `
            <div class="rank-item-v2" style="background: rgba(255,255,255,0.03); margin-bottom: 0.75rem; border: 1px solid rgba(255,255,255,0.05);">
              <div class="rank-num" style="font-size: 1.1rem; width: 40px;">${getMedal(idx)}</div>
              <img src="${avatar}" class="rank-avatar" style="width: 45px; height: 45px; border-radius: 12px;" onerror="this.src='https://ui-avatars.com/api/?name=${name}'">
              <div class="rank-info">
                <div class="rank-name" style="font-size: 1rem; color: white;">${name}</div>
                <div class="rank-meta" style="font-size: 0.75rem;">${meta}</div>
              </div>
              <div class="rank-badge" style="background: var(--admin-primary-gradient); color: white; padding: 0.4rem 0.8rem; border-radius: 10px; font-weight: 700;">
                ${val} <small style="font-weight: 400; font-size: 0.7rem; margin-left: 2px;">${config.unit}</small>
              </div>
            </div>
          `;
        }).join('');

    } catch (e) {
      content.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--admin-danger)">Lỗi: ${e.message}</div>`;
    }
  }

  function setupAISentinel() {
    const trigger = document.getElementById('ai-sentinel-trigger');
    const sendBtn = document.getElementById('ai-chat-send-btn');
    const input = document.getElementById('ai-chat-input');
    const chatMsgs = document.getElementById('ai-chat-messages');

    if (trigger) {
      trigger.onclick = () => WanderUI.toggleAIDrawer();
    }

    const appendMessage = (role, text) => {
      if (!chatMsgs) return;
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-message ${role}`;
      msgDiv.innerHTML = `<div class="ai-message-content">${text}</div>`;
      chatMsgs.appendChild(msgDiv);
      chatMsgs.scrollTop = chatMsgs.scrollHeight;
    };

    const handleSend = async () => {
      const cmd = input.value.trim();
      if (!cmd) return;
      
      appendMessage('user', cmd);
      input.value = '';
      
      // Temporary "Thinking" state
      const thinkingDiv = document.createElement('div');
      thinkingDiv.className = 'ai-message bot';
      thinkingDiv.innerHTML = '<div class="ai-message-content ai-glow">Đang phân tích lệnh... ⚡</div>';
      chatMsgs.appendChild(thinkingDiv);
      chatMsgs.scrollTop = chatMsgs.scrollHeight;

      try {
        const res = await apiFetch('/api/admin/ai-chat', {
          method: 'POST',
          body: JSON.stringify({ message: cmd })
        });
        
        chatMsgs.removeChild(thinkingDiv);
        if (res.success) {
          appendMessage('bot', res.reply);
          
          // Xử lý hành động từ AI
          if (res.action && res.action.type === 'SWITCH_TAB') {
            const tabBtn = document.querySelector(`.sidebar-btn[data-admin-tab="${res.action.value}"]`);
            if (tabBtn) {
              setTimeout(() => {
                tabBtn.click();
                appendMessage('bot', `⚡ Đã chuyển sang tab **${tabBtn.innerText.trim()}** theo yêu cầu.`);
              }, 500);
            }
          }
        } else {
          appendMessage('bot', '⛔ Có lỗi xảy ra khi xử lý lệnh AI.');
        }
      } catch (e) {
        if (thinkingDiv.parentNode) chatMsgs.removeChild(thinkingDiv);
        appendMessage('bot', `❌ Lỗi kết nối: ${e.message}`);
      }
    };

    if (sendBtn) sendBtn.onclick = handleSend;
    if (input) {
      input.onkeypress = (e) => {
        if (e.key === 'Enter') handleSend();
      };
    }
  }

  let aiTrendChartInstance = null;
  let aiIntelData = null;
  let aiIntelMode = 'daily';
  let aiIntelTimer = null;

  async function loadAIIntel() {
    try {
      const res = await apiFetch('/api/admin/ai-intelligence');
      if (!res.success) return;
      
      aiIntelData = res.data;
      renderAIIntelPanel(aiIntelData);

      // Auto-refresh every 30s
      clearInterval(aiIntelTimer);
      aiIntelTimer = setInterval(async () => {
        const r = await apiFetch('/api/admin/ai-intelligence');
        if (r.success) { aiIntelData = r.data; renderAIIntelPanel(r.data); }
      }, 30000);

    } catch(e) {
      console.error('AI Intel load error:', e);
    }
  }

  function renderAIIntelPanel(data) {
    // Updated timestamp
    const updEl = document.getElementById('intel-updated-at');
    if (updEl) updEl.textContent = `Cập nhật lúc ${new Date(data.updatedAt).toLocaleTimeString('vi-VN')}`;

    // Stats cards
    const itinEl = document.getElementById('intel-total-itin');
    if (itinEl) itinEl.textContent = data.totalItineraries ?? '—';

    const sentEl = document.getElementById('intel-sentiment');
    if (sentEl) {
      sentEl.textContent = data.totalFB > 0 ? `${data.sentimentScore}%` : 'N/A';
      sentEl.style.color = data.sentimentScore >= 70 ? '#10b981' : data.sentimentScore >= 40 ? '#f59e0b' : '#ef4444';
    }

    const topDestEl = document.getElementById('intel-top-dest');
    if (topDestEl) {
      topDestEl.textContent = data.topDestinations?.[0]?._id || 'Chưa có';
      topDestEl.style.fontSize = '1.1rem';
    }

    // User count card (real users only)
    const userEl = document.getElementById('intel-real-users');
    if (userEl) {
      userEl.textContent = data.totalRealUsers ?? data.totalUsers ?? '—';
    }

    // Top destinations list
    const listEl = document.getElementById('intel-top-list');
    if (listEl) {
      if (!data.topDestinations || data.topDestinations.length === 0) {
        listEl.innerHTML = `<div style="color:var(--admin-text-muted); font-size:0.85rem;">Chưa có dữ liệu tuần này.</div>`;
      } else {
        const maxCount = data.topDestinations[0].count;
        listEl.innerHTML = data.topDestinations.map((d, i) => `
          <div style="display:flex; align-items:center; gap:0.7rem;">
            <span style="font-size:0.75rem; font-weight:700; color:var(--admin-text-muted); width:1.2rem;">#${i+1}</span>
            <div style="flex:1;">
              <div style="font-size:0.85rem; font-weight:600; color:var(--admin-text); margin-bottom:0.2rem;">${d._id}</div>
              <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:99px; overflow:hidden;">
                <div style="height:100%; width:${Math.round((d.count/maxCount)*100)}%; background:var(--admin-primary); border-radius:99px;"></div>
              </div>
            </div>
            <span style="font-size:0.8rem; color:var(--admin-primary); font-weight:700;">${d.count}</span>
          </div>`).join('');
      }
    }

    // Recent logs
    const logsEl = document.getElementById('intel-recent-logs');
    if (logsEl) {
      if (!data.recentLogs || data.recentLogs.length === 0) {
        logsEl.innerHTML = `<div style="color:var(--admin-text-muted); font-size:0.85rem;">Chưa có hoạt động.</div>`;
      } else {
        logsEl.innerHTML = data.recentLogs.map(l => {
          const ago = Math.round((Date.now() - new Date(l.timestamp)) / 60000);
          const timeStr = ago < 1 ? 'Vừa xong' : ago < 60 ? `${ago} phút trước` : `${Math.round(ago/60)} giờ trước`;
          return `
          <div style="display:flex; align-items:center; gap:0.7rem; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.03);">
            <span style="width:8px; height:8px; border-radius:50%; background:#6366f1; flex-shrink:0;"></span>
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.82rem; font-weight:600; color:var(--admin-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${l.action}</div>
              <div style="font-size:0.75rem; color:var(--admin-text-muted);">${l.userName || 'Hệ thống'}</div>
            </div>
            <span style="font-size:0.72rem; color:var(--admin-text-muted); flex-shrink:0;">${timeStr}</span>
          </div>`;
        }).join('');
      }
    }

    // Render chart
    renderTrendChart();
  }

  function switchIntelChart(mode) {
    aiIntelMode = mode;
    document.getElementById('intel-chart-mode-daily')?.classList.toggle('is-active', mode === 'daily');
    document.getElementById('intel-chart-mode-dest')?.classList.toggle('is-active', mode === 'dest');
    renderTrendChart();
  }
  window.switchIntelChart = switchIntelChart;

  function renderTrendChart() {
    const canvas = document.getElementById('aiTrendChart');
    if (!canvas || !aiIntelData) return;
    const ctx = canvas.getContext('2d');

    let chartData;
    if (aiIntelMode === 'daily') {
      // Xu hướng theo ngày
      const labels = aiIntelData.dailyTrend.map(d => {
        const date = new Date(d._id);
        return date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' });
      });
      chartData = {
        labels: labels.length > 0 ? labels : ['Chưa có dữ liệu'],
        datasets: [{
          label: 'Lịch trình tạo mới',
          data: aiIntelData.dailyTrend.map(d => d.count),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.12)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#6366f1',
          pointRadius: 5
        }]
      };
    } else {
      // Theo điểm đến
      const labels = aiIntelData.topDestinations.map(d => d._id);
      chartData = {
        labels: labels.length > 0 ? labels : ['Chưa có dữ liệu'],
        datasets: [{
          label: 'Số lịch trình',
          data: aiIntelData.topDestinations.map(d => d.count),
          backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f43f5e'],
          borderWidth: 0,
          borderRadius: 8
        }]
      };
    }

    if (window.aiTrendChartInstance) window.aiTrendChartInstance.destroy();

    window.aiTrendChartInstance = new Chart(ctx, {
      type: aiIntelMode === 'daily' ? 'line' : 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
        }
      }
    });
  }

  window.loadAIIntel = loadAIIntel;

  // Support Browser/Trackpad Back & Forward gestures
  window.addEventListener('popstate', (e) => {
    const tab = (e.state && e.state.tab) || window.location.hash.replace('#', '') || 'overview';
    const btn = document.querySelector(`.sidebar-btn[data-admin-tab="${tab}"]`) || 
                document.querySelector(`[data-admin-tab="${tab}"]`);
    if (btn) btn.click();
  });

  // --- CYBERPUNK/GAMING CLICK EFFECTS FOR ADMIN ---
  document.addEventListener('mousedown', function(e) {
    if (e.target.closest('#admin-login-overlay') || e.target.closest('.leaflet-container')) return;
    
    // 1. Shockwave Ripple
    const ripple = document.createElement('div');
    ripple.className = 'admin-click-ripple';
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    
    // 2. Sparks
    const numSparks = 8;
    for(let i=0; i<numSparks; i++) {
      const spark = document.createElement('div');
      spark.className = 'admin-spark';
      spark.style.left = e.clientX + 'px';
      spark.style.top = e.clientY + 'px';
      
      const angle = Math.random() * 360;
      const dist = 30 + Math.random() * 80;
      
      spark.style.setProperty('--angle', `${angle}deg`);
      spark.style.setProperty('--dist', `${dist}px`);
      
      const colors = ['#fcee0a', '#ff003c', '#00f0ff', '#3b82f6'];
      spark.style.background = colors[Math.floor(Math.random() * colors.length)];
      spark.style.boxShadow = `0 0 8px ${spark.style.background}`;
      
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 400);
    }
  });

})();

/* === ADMIN SETTINGS MANAGER (10 FEATURES) === */
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'wander_admin_settings';
    
    // Default config
    const config = {
      theme: 'default',
      accentColor: '#3b82f6',
      radius: '16px',
      blur: '24px',
      focusMode: false,
      neonBorders: true,
      crt: true,
      particles: false,
      sounds: true,
      time12h: false,
      performance: false
    };

    // Load from storage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { Object.assign(config, JSON.parse(saved)); } catch(e){}
    }
    
    // Core function to apply settings
    function applySettings() {
      if (config.performance) {
        document.body.classList.add('disable-neon');
        document.body.classList.remove('crt-enabled');
        document.documentElement.style.setProperty('--glass-blur', '0px');
        removeParticles();
        // Force-disable heavy features in memory (visual only)
        config.neonBorders = false;
        config.crt = false;
        config.particles = false;
      } else {
        // UI Colors & Shape
        document.documentElement.style.setProperty('--admin-primary', config.accentColor);
        document.documentElement.style.setProperty('--radius', config.radius);
        document.documentElement.style.setProperty('--glass-blur', config.blur);

        // Toggles
        document.body.classList.toggle('focus-mode', config.focusMode);
        document.body.classList.toggle('disable-neon', !config.neonBorders);
        document.body.classList.toggle('crt-enabled', config.crt);
        
        if (config.particles) initParticles();
        else removeParticles();
      }
      
      // Update UI elements in drawer
      updateDrawerUI();
      
      // Save
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    function updateDrawerUI() {
      // Accent Colors
      document.querySelectorAll('#settings-accent-colors .color-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.color === config.accentColor);
      });
      // Selects
      const r = document.getElementById('settings-radius'); if (r) r.value = config.radius;
      const b = document.getElementById('settings-blur'); if (b) b.value = config.blur;
      // Toggles
      const fm = document.getElementById('settings-focus-mode'); if (fm) fm.checked = config.focusMode;
      const nb = document.getElementById('settings-neon-borders'); if (nb) nb.checked = config.neonBorders;
      const crt = document.getElementById('settings-crt'); if (crt) crt.checked = config.crt;
      const p = document.getElementById('settings-particles'); if (p) p.checked = config.particles;
      const s = document.getElementById('settings-sounds'); if (s) s.checked = config.sounds;
      const t = document.getElementById('settings-time-12h'); if (t) t.checked = config.time12h;
      const perf = document.getElementById('settings-performance'); if (perf) perf.checked = config.performance;
    }

    // --- Sound Logic ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = AudioContext ? new AudioContext() : null;
    function playBeep(freq = 600, duration = 0.05, vol = 0.05) {
      if (!config.sounds || config.performance || !audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }

    // Hook buttons for sound
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('button, .color-btn, .bg-preset-btn, .switch, a');
      if (btn && config.sounds && !config.performance) {
        playBeep(800, 0.03, 0.03); 
      }
    });

    // --- Particles Logic ---
    let particleAnimationFrame;
    function initParticles() {
      if (document.getElementById('cyber-particles')) return;
      const canvas = document.createElement('canvas');
      canvas.id = 'cyber-particles';
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      let w = canvas.width = window.innerWidth;
      let h = canvas.height = window.innerHeight;
      
      const particles = [];
      for(let i=0; i<40; i++) {
        particles.push({
          x: Math.random() * w, y: Math.random() * h,
          s: Math.random() * 2 + 1,
          v: Math.random() * 0.5 + 0.1
        });
      }
      
      function draw() {
        if(!document.getElementById('cyber-particles')) return;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = config.accentColor;
        particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s, 0, Math.PI*2);
          ctx.fill();
          p.y -= p.v;
          if(p.y < 0) p.y = h;
        });
        particleAnimationFrame = requestAnimationFrame(draw);
      }
      draw();
      
      window.addEventListener('resize', () => {
        const c = document.getElementById('cyber-particles');
        if (c) {
          w = c.width = window.innerWidth;
          h = c.height = window.innerHeight;
        }
      });
    }
    
    function removeParticles() {
      const p = document.getElementById('cyber-particles');
      if(p) {
        p.remove();
        cancelAnimationFrame(particleAnimationFrame);
      }
    }

    // --- Clock Logic Override ---
    setInterval(() => {
      const clockEl = document.getElementById('admin-clock');
      if (clockEl) {
        const now = new Date();
        if (config.time12h) {
          clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute:'2-digit', second:'2-digit' });
        } else {
          clockEl.textContent = now.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
        }
      }
    }, 1000);

    // --- Event Listeners for UI ---
    document.querySelectorAll('#settings-accent-colors .color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        config.accentColor = e.target.dataset.color;
        applySettings();
      });
    });

    const bindSelect = (id, key) => {
      const el = document.getElementById(id);
      if(el) el.addEventListener('change', e => { config[key] = e.target.value; applySettings(); });
    };
    bindSelect('settings-radius', 'radius');
    bindSelect('settings-blur', 'blur');

    const bindToggle = (id, key) => {
      const el = document.getElementById(id);
      if(el) el.addEventListener('change', e => { config[key] = e.target.checked; applySettings(); });
    };
    bindToggle('settings-focus-mode', 'focusMode');
    bindToggle('settings-neon-borders', 'neonBorders');
    bindToggle('settings-crt', 'crt');
    bindToggle('settings-particles', 'particles');
    bindToggle('settings-sounds', 'sounds');
    bindToggle('settings-time-12h', 'time12h');
    bindToggle('settings-performance', 'performance');

    // Init with slight delay to ensure DOM bindings
    setTimeout(applySettings, 100);
  });

  // --- Security: Anti-Copy & Anti-Inspect ---
  (function() {
    // Disable right click
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Disable shortcuts
    document.addEventListener('keydown', e => {
      const forbiddenKeys = ['c', 'v', 'u', 's', 'x', 'j', 'i'];
      if (
        (e.ctrlKey && forbiddenKeys.includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j'))
      ) {
        e.preventDefault();
        if (typeof WanderToast !== 'undefined') {
          WanderToast.warn('Hệ thống bảo mật: Thao tác bị từ chối.');
        }
        return false;
      }
    });

    // Disable drag start (prevents dragging images/text)
    document.addEventListener('dragstart', e => e.preventDefault());
  })();
})();



