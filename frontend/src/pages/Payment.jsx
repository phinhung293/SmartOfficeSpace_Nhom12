// src/pages/Payment.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createQRPayment, confirmPayment } from '../api/paymentApi';
import './css/Payment.css';

const vnd = (n) => Number(n || 0).toLocaleString('vi-VN');

const formatTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN');
};

function Countdown({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);
  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  return <span className="qr-countdown">{m}:{s}</span>;
}

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const booking = state?.booking;
  console.log(JSON.stringify(booking, null, 2));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('MOMO');
  const [qrCode, setQrCode] = useState(null);
  const [qrExpired, setQrExpired] = useState(false);

  if (!booking) {
    return (
        <div className="payment-page">
          <div className="alert alert-error">Không tìm thấy thông tin đặt phòng.</div>
          <button className="btn btn--outline" onClick={() => navigate('/spaces')}>Quay lại</button>
        </div>
    );
  }

  const duration = booking.durationHours ||
    Math.ceil((new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60));

  const unitPrice = booking.pricePerHour || 0;
  const serviceFee = Math.round(booking.totalAmount * 0.05);
  const totalAmount = booking.totalAmount + serviceFee;

  const handleSelectMethod = async (methodId) => {
    setSelectedMethod(methodId);
    setQrCode(null);
    setQrExpired(false);
    if (methodId === 'MOMO') {
      setLoading(true);
      setError('');
      try {
        // Tạo QR thanh toán (giả lập, backend trả về qr_code)
        const response = await createQRPayment(booking.bookingId, 'MOMO');
        const qr = response?.qr_code || response?.data?.qr_code;
        if (qr) setQrCode(qr);
        else throw new Error('Không thể tạo mã QR');
      } catch (err) {
        setError(err.message || 'Không thể tạo QR thanh toán');
      } finally {
        setLoading(false);
      }
    }
  };

  // Xử lý thanh toán: gọi simulate để giả lập thanh toán thành công
  const handleConfirmPayment = async () => {
    setLoading(true);
    setError('');
    try {
      await confirmPayment(booking.bookingId);
      // Truyền đủ thông tin sang BookingSuccess
      navigate('/booking-success', {
        state: {
          bookingId: booking.bookingId,
          bookingCode: booking.bookingCode,
          bookedAt: new Date().toLocaleString('vi-VN')
        },
      });
    } catch (err) {
      setError(err.message || 'Xác nhận thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        <div className="payment-breadcrumb">
          <p className="payment-breadcrumb__text">Trang chủ &nbsp;&gt;&nbsp; Đặt phòng &nbsp;&gt;&nbsp; Thanh toán</p>
        </div>
        <div className="payment-page">
          <h1 className="page-title">Thanh toán</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="payment-layout">
            {/* LEFT - Phương thức thanh toán */}
            <section className="payment-methods">
              <h2 className="payment-methods__title">Chọn phương thức thanh toán</h2>

              {/* Ví điện tử MoMo */}
              <div
                  className={`payment-option ${selectedMethod === 'MOMO' ? 'payment-option--selected' : ''}`}
                  onClick={() => handleSelectMethod('MOMO')}
              >
                <div className="payment-option__header">
                  <span className={`radio-circle ${selectedMethod === 'MOMO' ? 'radio-circle--checked' : ''}`} />
                  <div className="payment-option__info">
                    <p className="payment-option__name">Ví điện tử</p>
                    <p className="payment-option__desc">Thanh toán nhanh qua ví điện tử</p>
                  </div>
                  <div className="payment-option__icon-right">
                    <div className="payment-option__brand" style={{ background: '#a50034', color: 'white', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>MoMo</div>
                  </div>
                </div>
                {selectedMethod === 'MOMO' && (
                    <div className="payment-option__qr-expand">
                      <div className="qr-expand-inner">
                        <div className="qr-image-wrap">
                          {loading ? (
                              <div className="qr-placeholder">Đang tạo QR...</div>
                          ) : qrCode ? (
                              <img src={qrCode} alt="QR Code" className="qr-real-image" />
                          ) : (
                              <div className="qr-placeholder">Mã QR sẽ hiển thị ở đây</div>
                          )}
                        </div>
                        <div className="qr-instructions">
                          <p className="qr-instructions__text">Sử dụng ứng dụng ngân hàng hoặc ví điện tử quét mã QR để thanh toán.</p>
                          {!qrExpired ? (
                              <p className="qr-instructions__timer">Thời gian còn lại: <Countdown seconds={598} onExpire={() => setQrExpired(true)} /></p>
                          ) : (
                              <div>
                                <p style={{ fontSize: 13, color: '#dc3545' }}>Mã QR đã hết hạn</p>
                                <button className="btn-refresh-qr" onClick={() => handleSelectMethod('MOMO')}>Tạo lại mã QR</button>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                )}
              </div>

              {/* Thanh toán tại chỗ */}
              <div
                  className={`payment-option ${selectedMethod === 'CASH' ? 'payment-option--selected' : ''}`}
                  onClick={() => setSelectedMethod('CASH')}
              >
                <div className="payment-option__header">
                  <span className={`radio-circle ${selectedMethod === 'CASH' ? 'radio-circle--checked' : ''}`} />
                  <div className="payment-option__info">
                    <p className="payment-option__name">Thanh toán tại chỗ</p>
                    <p className="payment-option__desc">Thanh toán bằng tiền mặt</p>
                  </div>
                </div>
              </div>

              <div className="security-notice">
                <span>🔒</span>
                <p className="security-notice__text">Thông tin thanh toán của bạn được mã hóa và bảo mật theo tiêu chuẩn PCI-DSS</p>
              </div>
            </section>

            {/* RIGHT - Thông tin đặt phòng */}
            <aside className="booking-card">
              <h2 className="booking-card__title">Thông tin đặt phòng</h2>
              <div className="room-summary">
                <img className="room-summary__image" src={booking.roomImageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=120&h=80&fit=crop'} alt={booking.roomName} />
                <div className="room-summary__info">
                  <h3 className="room-summary__name">{booking.roomName}</h3>
                  <span className="room-summary__badge">{booking.workspaceType || 'Phòng họp'}</span>
                  <div className="room-summary__meta">👥 Sức chứa: {booking.capacity || 6} người</div>
                  <div className="room-summary__meta">📺 Tiện ích: {booking.amenities || 'TV, Máy chiếu, Whiteboard, WiFi'}</div>
                </div>
              </div>
              <div className="divider" />
              <div className="booking-time">
                <h3 className="booking-time__title">Thời gian đặt</h3>
                <div className="booking-time__row"><span>📅 Ngày</span><span>{formatDate(booking.startTime)}</span></div>
                <div className="booking-time__row"><span>⏰ Thời gian</span><span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)} ({duration} giờ)</span></div>
              </div>
              <div className="divider" />
              <div className="payment-detail">
                <h3 className="payment-detail__title">Chi tiết thanh toán</h3>
                <div className="payment-detail__row"><span>Đơn giá</span><span>{vnd(unitPrice)}đ/giờ</span></div>
                <div className="payment-detail__row"><span>Thời gian</span><span>{duration} giờ</span></div>
                <div className="payment-detail__row"><span>Tạm tính</span><span>{vnd(booking.totalAmount)}đ</span></div>
                <div className="payment-detail__row"><span>Phí dịch vụ (5%)</span><span>{vnd(serviceFee)}đ</span></div>
              </div>
              <div className="divider" />
              <div className="total-row"><span className="total-row__label">Tổng tiền</span><span className="total-row__value">{vnd(totalAmount)}đ</span></div>
              <div className="booking-card__actions">
                <button className="btn btn--primary" onClick={handleConfirmPayment} disabled={loading}>{loading ? 'ĐANG XỬ LÝ...' : 'THANH TOÁN'}</button>
                <button className="btn btn--outline" onClick={() => navigate(-1)}>QUAY LẠI</button>
              </div>
            </aside>
          </div>
        </div>
      </>
  );
}