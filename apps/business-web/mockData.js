// ============================================================
//  MOCK DATA — Hệ thống quản lý dịch vụ du lịch
//  File: mockData.js
//  Sử dụng: <script src="mockData.js"></script>
// ============================================================

// ─────────────────────────────────────────
//  1. DANH SÁCH DỊCH VỤ
// ─────────────────────────────────────────
const services = [
  {
    id: 'SVC001',
    name: 'Khách sạn 5 sao view biển Hạ Long',
    type: 'khách sạn',
    location: 'Hạ Long, Quảng Ninh',
    price: 2500000,
    unit: 'đêm',
    rating: 4.9,
    bookings: 45,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600'
  },
  {
    id: 'SVC002',
    name: 'Tour Hạ Long 2 ngày 1 đêm',
    type: 'tour',
    duration: 2,
    location: 'Hạ Long, Quảng Ninh',
    price: 1850000,
    unit: 'người',
    rating: 4.8,
    bookings: 32,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600'
  },
  {
    id: 'SVC003',
    name: 'Nhà hàng hải sản cao cấp Cát Bà',
    type: 'nhà hàng',
    location: 'Cát Bà, Hải Phòng',
    price: 500000,
    unit: 'người',
    rating: 4.7,
    bookings: 89,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'
  },
  {
    id: 'SVC004',
    name: 'Villa nghỉ dưỡng cao cấp ven biển',
    type: 'villa',
    location: 'Hạ Long, Quảng Ninh',
    price: 5500000,
    unit: 'đêm',
    rating: 0,
    bookings: 0,
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600'
  },
  {
    id: 'SVC005',
    name: 'Tour Sapa Trek 3 ngày 2 đêm',
    type: 'tour',
    duration: 3,
    location: 'Sa Pa, Lào Cai',
    price: 2200000,
    unit: 'người',
    rating: 4.9,
    bookings: 67,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=600'
  },
  {
    id: 'SVC006',
    name: 'Resort Phú Quốc 4 sao',
    type: 'khách sạn',
    location: 'Phú Quốc, Kiên Giang',
    price: 3200000,
    unit: 'đêm',
    rating: 4.6,
    bookings: 28,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=600'
  },
  {
    id: 'SVC007',
    name: 'Nhà hàng Ngon Sài Gòn',
    type: 'nhà hàng',
    location: 'Quận 1, TP.HCM',
    price: 350000,
    unit: 'người',
    rating: 4.5,
    bookings: 110,
    status: 'paused',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600'
  },
  {
    id: 'SVC008',
    name: 'Villa Hội An Heritage',
    type: 'villa',
    location: 'Hội An, Quảng Nam',
    price: 4800000,
    unit: 'đêm',
    rating: 0,
    bookings: 0,
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600'
  }
];

// ─────────────────────────────────────────
//  2. DANH SÁCH ĐƠN ĐẶT CHỖ
// ─────────────────────────────────────────
const bookings = [
  {
    id: '#HD1245',
    customerName: 'Nguyễn Văn A',
    serviceName: 'Tour Hạ Long 2 ngày 1 đêm',
    bookingDate: '31/05/2024',
    useDate: '15/06/2024',
    value: 3700000,
    status: 'confirmed'
  },
  {
    id: '#HD1244',
    customerName: 'Trần Thị B',
    serviceName: 'Khách sạn 5 sao view biển Hạ Long',
    bookingDate: '31/05/2024',
    useDate: '10/06/2024',
    value: 5000000,
    status: 'pending'
  },
  {
    id: '#HD1243',
    customerName: 'Lê Văn C',
    serviceName: 'Nhà hàng hải sản cao cấp Cát Bà',
    bookingDate: '30/05/2024',
    useDate: '01/06/2024',
    value: 1000000,
    status: 'confirmed'
  },
  {
    id: '#HD1242',
    customerName: 'Phạm Thị D',
    serviceName: 'Tour Hạ Long 2 ngày 1 đêm',
    bookingDate: '30/05/2024',
    useDate: '05/06/2024',
    value: 1850000,
    status: 'cancelled'
  },
  {
    id: '#HD1241',
    customerName: 'Hoàng Văn E',
    serviceName: 'Villa nghỉ dưỡng cao cấp ven biển',
    bookingDate: '29/05/2024',
    useDate: '20/06/2024',
    value: 5500000,
    status: 'pending'
  },
  {
    id: '#HD1240',
    customerName: 'Vũ Thị F',
    serviceName: 'Resort Phú Quốc 4 sao',
    bookingDate: '28/05/2024',
    useDate: '12/06/2024',
    value: 6400000,
    status: 'confirmed'
  },
  {
    id: '#HD1239',
    customerName: 'Đặng Văn G',
    serviceName: 'Tour Sapa Trek 3 ngày 2 đêm',
    bookingDate: '27/05/2024',
    useDate: '08/06/2024',
    value: 4400000,
    status: 'cancelled'
  }
];

// ─────────────────────────────────────────
//  3. CÁC HÀM TRUY VẤN DỮ LIỆU
// ─────────────────────────────────────────

/** Lấy toàn bộ dịch vụ */
function getAllServices() {
  return services;
}

/** Lấy dịch vụ đang hoạt động */
function getActiveServices() {
  return services.filter(s => s.status === 'active');
}

/** Lấy dịch vụ đang chờ duyệt */
function getPendingServices() {
  return services.filter(s => s.status === 'pending');
}

/** Lấy dịch vụ đã tạm dừng */
function getPausedServices() {
  return services.filter(s => s.status === 'paused');
}

/** Lấy toàn bộ đơn đặt chỗ */
function getBookings() {
  return bookings;
}

/** Lấy đơn đặt chỗ theo trạng thái */
function getBookingsByStatus(status) {
  return bookings.filter(b => b.status === status);
}

/** Lấy dịch vụ theo loại */
function getServicesByType(type) {
  return services.filter(s => s.type === type);
}

// ─────────────────────────────────────────
//  4. HÀM RENDER CARD DỊCH VỤ
// ─────────────────────────────────────────

const STATUS_LABEL = {
  active:  { text: 'Đang hoạt động', cls: 's-green' },
  pending: { text: 'Chờ duyệt',       cls: 's-yellow' },
  paused:  { text: 'Tạm dừng',        cls: 's-gray' }
};

const BOOKING_STATUS_LABEL = {
  confirmed: { text: 'Đã xác nhận',  cls: 'st-green' },
  pending:   { text: 'Chờ xác nhận', cls: 'st-yellow' },
  cancelled: { text: 'Đã hủy',       cls: 'st-red' }
};

/**
 * Render danh sách card dịch vụ vào một container
 * @param {HTMLElement|string} container - DOM element hoặc CSS selector
 * @param {Array} data - Mảng dịch vụ (mặc định: tất cả)
 */
function renderServiceCards(container, data = getAllServices()) {
  const el = typeof container === 'string'
    ? document.querySelector(container)
    : container;
  if (!el) return;

  const fmt = new Intl.NumberFormat('vi-VN');

  el.innerHTML = data.map(svc => {
    const st = STATUS_LABEL[svc.status] || STATUS_LABEL.paused;
    const stars = svc.rating > 0
      ? `⭐ ${svc.rating} (${svc.bookings})`
      : '⭐ Chưa có đánh giá';
    return `
      <div class="svc-card" data-id="${svc.id}">
        <div class="svc-img">
          <img src="${svc.image}" alt="${svc.name}" loading="lazy">
          <div class="svc-status ${st.cls}">${st.text}</div>
        </div>
        <div class="svc-body">
          <div class="svc-name">${svc.name}</div>
          <div class="svc-loc">📍 ${svc.location}</div>
          <div class="svc-price">${fmt.format(svc.price)} <span>VND / ${svc.unit}</span></div>
          <div class="svc-meta">
            <span>${stars}</span>
            <span>Đã đặt: ${svc.bookings}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

/**
 * Render bảng đơn đặt chỗ vào một container
 * @param {HTMLElement|string} container - DOM element hoặc CSS selector
 * @param {Array} data - Mảng đơn đặt (mặc định: tất cả)
 */
function renderBookingsTable(container, data = getBookings()) {
  const el = typeof container === 'string'
    ? document.querySelector(container)
    : container;
  if (!el) return;

  const fmt = new Intl.NumberFormat('vi-VN');

  el.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Mã đơn</th>
          <th>Khách hàng</th>
          <th>Dịch vụ</th>
          <th>Ngày đặt</th>
          <th>Ngày sử dụng</th>
          <th>Giá trị</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(b => {
          const st = BOOKING_STATUS_LABEL[b.status] || BOOKING_STATUS_LABEL.pending;
          return `
            <tr>
              <td>${b.id}</td>
              <td>${b.customerName}</td>
              <td>${b.serviceName}</td>
              <td>${b.bookingDate}</td>
              <td>${b.useDate}</td>
              <td>${fmt.format(b.value)} VND</td>
              <td><span class="st ${st.cls}">${st.text}</span></td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// Export cho môi trường Node/module (nếu cần)
if (typeof module !== 'undefined') {
  module.exports = {
    services, bookings,
    getAllServices, getActiveServices, getPendingServices,
    getPausedServices, getBookings, getBookingsByStatus,
    getServicesByType, renderServiceCards, renderBookingsTable
  };
}
