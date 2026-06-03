// src/pages/BookingDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './css/BookingDetail.css';
import axiosInstance from '../api/axiosInstance';
import { getMyBookingById } from '../api/bookingApi';

const vnd = (n) => Number(n || 0).toLocaleString('vi-VN');

const TYPE_LABEL = {
  'Meeting Room':   'Phòng họp',
  'Private Office': 'Phòng làm việc riêng',
  'Coworking':      'Coworking',
  'Virtual Office': 'Văn phòng ảo',
  'Studio':         'Studio',
  'Training Room':  'Phòng đào tạo',
  'Phòng họp':      'Phòng họp',
  'Phòng làm việc': 'Phòng làm việc riêng',
};

function normalizeBooking(raw) {
  if (!raw) return null;
  const roomName      = raw.roomName      || raw.room?.name            || '—';
  const roomImageUrl  = raw.roomImageUrl  || raw.room?.imageUrl        || raw.imageUrl || null;
  const workspaceType = raw.workspaceType || raw.room?.workspaceType   || raw.roomType || '';
  const capacity      = raw.capacity      || raw.room?.capacity        || null;
  const amenities     = raw.amenities     || raw.room?.amenities       || 'TV, Máy chiếu, Whiteboard, WiFi';
  const buildingName  = raw.buildingName  || raw.room?.buildingName    || raw.room?.location || null;
  const floor         = raw.floor         || raw.room?.floor           || null;
  const area          = raw.area          || raw.room?.area            || null;
  const roomCode      = raw.roomCode      || raw.room?.roomCode        || raw.room?.code || null;
  const pricePerHour  = raw.pricePerHour  || raw.room?.price           || raw.unitPrice || 0;
  const bookingDate   = raw.bookingDate   || raw.date                  || null;
  const startTime     = raw.startTime     || null;
  const endTime       = raw.endTime       || null;
  const totalAmount   = raw.totalAmount   || 0;
  const durationHours = raw.durationHours || null;
  const customerName  = raw.customerName  || raw.userName  || raw.user?.name  || '—';
  const customerPhone = raw.customerPhone || raw.userPhone || raw.user?.phone || '—';
  const customerEmail = raw.customerEmail || raw.userEmail || raw.user?.email || '—';
  const paymentMethod = raw.paymentMethod || null;
  const paymentStatus = raw.paymentStatus || null;
  const transactionId = raw.transactionId || raw.transactionCode || null;
  const paidAt        = raw.paidAt        || raw.paymentTime     || null;
  const bookingId     = raw.bookingId     || raw.id              || null;
  const bookingCode   = raw.bookingCode   || raw.code            || null;
  const status        = raw.status        || null;
  return {
    bookingId, bookingCode, status,
    roomName, roomImageUrl, workspaceType, capacity, amenities,
    buildingName, floor, area, roomCode, pricePerHour,
    bookingDate, startTime, endTime, totalAmount, durationHours,
    customerName, customerPhone, customerEmail,
    paymentMethod, paymentStatus, transactionId, paidAt,
  };
}

function parseTime(dateStr, timeStr) {
  if (!timeStr) return null;
  if (timeStr.includes('T')) return new Date(timeStr);
  if (dateStr) return new Date(`${dateStr}T${timeStr}`);
  return null;
}

function formatTimeStr(dateStr, timeStr) {
  if (!timeStr) return '—';
  if (timeStr.length <= 8 && !timeStr.includes('T')) return timeStr.slice(0, 5);
  const d = parseTime(dateStr, timeStr);
  if (!d) return '—';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateStr(dateStr, timeStr) {
  if (dateStr) return new Date(dateStr).toLocaleDateString('vi-VN');
  if (timeStr?.includes('T')) return new Date(timeStr).toLocaleDateString('vi-VN');
  return '—';
}

function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    + ', ' + d.toLocaleDateString('vi-VN');
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <span
      className={`bd-copy-btn${copied ? ' bd-copy-btn--copied' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <span>✓</span>
      ) : (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <rect x="4" y="4" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1.5 9.5V2A1.5 1.5 0 013 .5h7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

export default function BookingDetail() {
  const { bookingId } = useParams();
  const { state }     = useLocation();
  const navigate      = useNavigate();

  const [booking,     setBooking]    = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState('');
  const [cancelling,  setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (state?.booking) {
      setBooking(normalizeBooking(state.booking));
      setLoading(false);
      return;
    }
    const id = bookingId || state?.bookingId;
    if (!id) { setError('Không tìm thấy mã đặt phòng.'); setLoading(false); return; }
    getMyBookingById(id)
      .then(raw => {console.log("BOOKING DETAIL =", raw);
        setBooking(normalizeBooking(raw));
        })
      .catch(() => setError('Không thể tải thông tin đặt phòng.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, state?.bookingId]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await axiosInstance.put(`/bookings/${booking.bookingId}/cancel`);
      setBooking(prev => ({ ...prev, status: 'CANCELLED' }));
      setShowConfirm(false);
    } catch {
      setError('Hủy đặt phòng thất bại. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  /* ── Loading / Error states ── */
  if (loading) return (
    <div className="bd-loading-wrap">
      <div className="bd-spinner" />
      <p>Đang tải thông tin...</p>
    </div>
  );
  if (error && !booking) return (
    <div className="bd-error-wrap">
      <p className="bd-error-msg">{error}</p>
      <button className="bd-btn bd-btn--outline" onClick={() => navigate(-1)}>Quay lại</button>
    </div>
  );

  /* ── Computed values ── */
  const dateStr  = booking.bookingDate;
  const startStr = booking.startTime;
  const endStr   = booking.endTime;

  const startDisplay = formatTimeStr(dateStr, startStr);
  const endDisplay   = formatTimeStr(dateStr, endStr);
  const dateDisplay  = formatDateStr(dateStr, startStr);

  let duration = booking.durationHours;
  if (!duration && startStr && endStr) {
    const s = parseTime(dateStr, startStr);
    const e = parseTime(dateStr, endStr);
    if (s && e) duration = Math.ceil((e - s) / 3600000);
  }
  duration = duration || 1;

  const pricePerHour = Number(booking.pricePerHour || 0);
  const subtotal     = booking.totalAmount || pricePerHour * duration;
  const serviceFee   = 0;
  const total        = subtotal + serviceFee;

  const typeLabel = TYPE_LABEL[booking.workspaceType] || booking.workspaceType || '';
  const canCancel = [
    'PENDING_PAYMENT',
    'CONFIRMED'
].includes(booking.status);

  const STATUS = {
      PENDING_PAYMENT: {
          text: 'Chờ thanh toán',
          cls: 'bd-badge--pending'
      },
      CONFIRMED: {
          text: 'Đã xác nhận',
          cls: 'bd-badge--confirmed'
      },
      COMPLETED: {
          text: 'Hoàn thành',
          cls: 'bd-badge--completed'
      },
      CANCELLED: {
          text: 'Đã hủy',
          cls: 'bd-badge--cancelled'
      },
  };

  const bStatus = STATUS[booking.status] || { text: booking.status || '—', cls: '' };

  const methodLabel =
    booking.paymentMethod === 'CASH' ? 'Tiền mặt' :
    booking.paymentMethod === 'MOMO' ? 'Ví MoMo' :
    booking.paymentMethod === 'BANK' ? 'Chuyển khoản' :
    booking.paymentMethod ? 'Ví điện tử' : '—';

  const amenitiesStr = Array.isArray(booking.amenities)
    ? booking.amenities.join(', ')
    : booking.amenities || '';

  // Hàm lấy trạng thái thanh toán dựa trên booking.status
  const getPaymentStatusDisplay = () => {
    if (booking.status === 'CONFIRMED') {
      return { text: 'Đã thanh toán', cls: 'bd-pay--paid' };
    }
    if (booking.status === 'CANCELLED') {
      return { text: 'Đã hủy thanh toán', cls: 'bd-pay--cancelled' };
    }
    if (booking.status === 'PENDING_PAYMENT') {
      return { text: 'Chưa thanh toán', cls: 'bd-pay--unpaid' };
    }
    if (booking.status === 'EXPIRED') {
      return { text: 'Hết hạn thanh toán', cls: 'bd-pay--expired' };
    }
    return { text: 'Chưa cập nhật', cls: 'bd-pay--pending' };
  };

  const paymentStatusDisplay = getPaymentStatusDisplay();

  return (
    <>
      {/* Breadcrumb */}
      <div className="bd-breadcrumb">
        <p className="bd-breadcrumb__text">
          <span className="bd-bc-link" onClick={() => navigate('/')}>Trang chủ</span>
          {' > '}
          <span className="bd-bc-link" onClick={() => navigate(-1)}>Đặt phòng</span>
          {' > '}
          <span>Chi tiết đặt phòng</span>
        </p>
      </div>

      <div className="bd-page">
        <div className="bd-layout">

          {/* ========== LEFT MAIN CARD ========== */}
          <div className="bd-main-card">

            {/* Card Header */}
            <div className="bd-card-header">
              <div>
                <h1 className="bd-card-title">Chi tiết đặt phòng</h1>
                <div className="bd-booking-code-row">
                  <span className="bd-label-muted">Mã đặt phòng:</span>
                  <span className="bd-booking-code">{booking.bookingCode || booking.bookingId}</span>
                  <CopyBtn text={booking.bookingCode || String(booking.bookingId)} />
                </div>
              </div>
              <div className="bd-header-actions">
                {canCancel ? (
                  <>
                    <button className="bd-btn bd-btn--outline-blue"
                      onClick={() => navigate(`/booking/edit/${booking.bookingId}`)}>
                      Chỉnh sửa
                    </button>
                    <button className="bd-btn bd-btn--danger-outline" onClick={() => setShowConfirm(true)}>
                      Hủy đặt phòng
                    </button>
                  </>
                ) : (
                  <span className={`bd-badge ${bStatus.cls}`}>{bStatus.text}</span>
                )}
              </div>
            </div>

            {error && <div className="bd-alert-inline">{error}</div>}

            {/* ── Thông tin phòng ── */}
            <div className="bd-section">
              <h2 className="bd-section-title">Thông tin phòng</h2>
              <div className="bd-room-info">
                {booking.roomImageUrl ? (
                  <img className="bd-room-img" src={booking.roomImageUrl} alt={booking.roomName} />
                ) : (
                  <div className="bd-room-img bd-room-img--placeholder" />
                )}
                <div className="bd-room-details">
                  <div className="bd-room-name-row">
                    <h3 className="bd-room-name">{booking.roomName}</h3>
                    {typeLabel && <span className="bd-room-badge">{typeLabel}</span>}
                  </div>
                  <div className="bd-room-meta-grid">
                    {booking.capacity && (
                      <div className="bd-meta-item">
                        <i className="fa-solid fa-user-group bd-meta-icon" />
                        <span className="bd-meta-label">Sức chứa:</span>
                        <span className="bd-meta-value">{booking.capacity} người</span>
                      </div>
                    )}
                    {amenitiesStr && (
                      <div className="bd-meta-item bd-meta-item--full">
                        <i className="fa-solid fa-wifi bd-meta-icon" />
                        <span className="bd-meta-label">Tiện ích:</span>
                        <span className="bd-meta-value">{amenitiesStr}</span>
                      </div>
                    )}
                    {booking.buildingName && (
                      <div className="bd-meta-item">
                        <span className="bd-meta-label">Tòa nhà:</span>
                        <span className="bd-meta-bold">{booking.buildingName}</span>
                      </div>
                    )}
                    {booking.floor && (
                      <div className="bd-meta-item">
                        <span className="bd-meta-label">Tầng:</span>
                        <span className="bd-meta-bold">{booking.floor}</span>
                      </div>
                    )}
                    {booking.area && (
                      <div className="bd-meta-item">
                        <span className="bd-meta-label">Diện tích:</span>
                        <span className="bd-meta-bold">{booking.area} m²</span>
                      </div>
                    )}
                    {booking.roomCode && (
                      <div className="bd-meta-item">
                        <span className="bd-meta-label">Mã phòng:</span>
                        <span className="bd-meta-bold">{booking.roomCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bd-divider" />

            {/* ── Thời gian đặt ── */}
            <div className="bd-section">
              <h2 className="bd-section-title">Thời gian đặt</h2>
              <div className="bd-time-grid">
                <div className="bd-time-item">
                  <div className="bd-time-label">
                    <i className="fa-regular fa-calendar" style={{ marginRight: 6 }} />
                    Ngày
                  </div>
                  <div className="bd-time-value">{dateDisplay}</div>
                </div>
                <div className="bd-time-item">
                  <div className="bd-time-label">
                    <i className="fa-regular fa-clock" style={{ marginRight: 6 }} />
                    Thời gian
                  </div>
                  <div className="bd-time-value">
                    {startDisplay} - {endDisplay} ({duration} giờ)
                  </div>
                </div>
              </div>
            </div>

            <div className="bd-divider" />

            {/* ── Thông tin khách hàng ── */}
            <div className="bd-section">
              <h2 className="bd-section-title">Thông tin khách hàng</h2>
              <div className="bd-info-grid">
                <div className="bd-info-row">
                  <span className="bd-info-label">Tên khách hàng</span>
                  <span className="bd-info-value">{booking.customerName}</span>
                </div>
                <div className="bd-info-row">
                  <span className="bd-info-label">SDT</span>
                  <span className="bd-info-value">{booking.customerPhone}</span>
                </div>
                <div className="bd-info-row">
                  <span className="bd-info-label">Email</span>
                  <span className="bd-info-value">{booking.customerEmail}</span>
                </div>
              </div>
            </div>

            <div className="bd-divider" />

            {/* ── Thông tin thanh toán ── */}
            <div className="bd-section">
              <h2 className="bd-section-title">Thông tin thanh toán</h2>
              <div className="bd-info-grid">
                <div className="bd-info-row">
                  <span className="bd-info-label">Phương thức thanh toán</span>
                  <span className="bd-info-value">{methodLabel || '—'}</span>
                </div>
                <div className="bd-info-row">
                  <span className="bd-info-label">Trạng thái thanh toán</span>
                  <span className={`bd-pay-badge ${paymentStatusDisplay.cls}`}>
                    {paymentStatusDisplay.text}
                  </span>
                </div>
                {booking.transactionId && (
                  <div className="bd-info-row">
                    <span className="bd-info-label">Mã giao dịch</span>
                    <span className="bd-info-value bd-txn-row">
                      {booking.transactionId}
                      <CopyBtn text={booking.transactionId} />
                    </span>
                  </div>
                )}
                {booking.paidAt && (
                  <div className="bd-info-row">
                    <span className="bd-info-label">Thời gian thanh toán</span>
                    <span className="bd-info-value">{formatDateTime(booking.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
          {/* END LEFT */}

          {/* ========== RIGHT SIDEBAR ========== */}
          <aside className="bd-summary-card">
            <h2 className="bd-summary-title">Thông tin thanh toán</h2>
            <div className="bd-summary-rows">
              <div className="bd-summary-row">
                <span className="bd-summary-label">Đơn giá</span>
                <span className="bd-summary-value">{vnd(pricePerHour)}đ/giờ</span>
              </div>
              <div className="bd-summary-row">
                <span className="bd-summary-label">Thời gian</span>
                <span className="bd-summary-value">{duration} giờ</span>
              </div>
              <div className="bd-summary-row">
                <span className="bd-summary-label">Tạm tính</span>
                <span className="bd-summary-value">{vnd(subtotal)}đ</span>
              </div>
              <div className="bd-summary-row">
                <span className="bd-summary-label">Phí dịch vụ hệ thống</span>
                <span className="bd-summary-value bd-summary-free">Miễn phí</span>
              </div>
            </div>
            <div className="bd-summary-divider" />
            <div className="bd-summary-total-row">
              <span className="bd-summary-total-label">Tổng tiền</span>
              <span className="bd-summary-total-value">{vnd(total)}đ</span>
            </div>
          </aside>

        </div>
      </div>

      {/* Modal xác nhận hủy */}
      {showConfirm && (
        <div className="bd-overlay" onClick={() => setShowConfirm(false)}>
          <div className="bd-modal" onClick={e => e.stopPropagation()}>
            <div className="bd-modal-header">
              <div className="bd-modal-icon">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3 className="bd-modal__title">Xác nhận hủy đặt phòng</h3>
              <p className="bd-modal__text">
                Bạn có chắc chắn muốn hủy đặt phòng này không? Hành động này không thể hoàn tác.
              </p>
            </div>
            
            <div className="bd-modal-booking-info">
              <div className="bd-modal-info-row">
                <span className="bd-modal-info-label">Mã đơn</span>
                <span className="bd-modal-info-value">{booking.bookingCode || booking.bookingId}</span>
              </div>
              <div className="bd-modal-info-row">
                <span className="bd-modal-info-label">Phòng</span>
                <span className="bd-modal-info-value">{booking.roomName}</span>
              </div>
              <div className="bd-modal-info-row">
                <span className="bd-modal-info-label">Thời gian</span>
                <span className="bd-modal-info-value">{dateDisplay} | {startDisplay} - {endDisplay}</span>
              </div>
              <div className="bd-modal-info-row">
                <span className="bd-modal-info-label">Tổng tiền</span>
                <span className="bd-modal-info-value amount">{vnd(total)}đ</span>
              </div>
            </div>
            
            <div className="bd-modal__actions">
              <button className="bd-btn--danger-outline" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
              <button className="bd-btn--outline-blue" onClick={() => setShowConfirm(false)}>
                Giữ lại đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}