// src/pages/BookingSuccess.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './css/Bookingsuccess.css';

export default function BookingSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const bookingId   = state?.bookingId;
  const bookingCode = state?.bookingCode || 'PAY260519001';

  const bookingData = state?.booking; 

  // Nhận bookingId từ Payment.jsx khi navigate('/booking-success', { state: { bookingId, bookingCode, bookedAt } })
  const bookedAt    = state?.bookedAt   || new Date().toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  }).replace(',', ' -');

  const handleViewDetail = () => {
    if (bookingId) {
        // 👇 Truyền state fromSuccess để biết nguồn từ đâu
        navigate(`/booking-detail/${bookingId}`, { 
        state: { fromSuccess: true } 
        });
    } else {
        navigate('/my-bookings');
    }
};

  return (
    <>
      {/* Breadcrumb */}
      <div className="bs-breadcrumb">
        <p className="bs-breadcrumb__text">
          Trang chủ &nbsp;&gt;&nbsp; Đặt phòng &nbsp;&gt;&nbsp; Thanh toán &nbsp;&gt;&nbsp; Thành công
        </p>
      </div>

      <div className="bs-page">
        {/* Icon vòng tròn + sparkles */}
        <div className="bs-icon-wrap">
          <span className="bs-spark bs-spark--tl">+</span>
          <span className="bs-spark bs-spark--t">·</span>
          <span className="bs-spark bs-spark--tr">+</span>
          <span className="bs-spark bs-spark--l">·</span>
          <span className="bs-spark bs-spark--r">·</span>
          <span className="bs-spark bs-spark--bl">+</span>
          <span className="bs-spark bs-spark--br">·</span>

          {/* Vòng ngoài mờ */}
          <div className="bs-icon-ring">
            <div className="bs-icon-circle">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M10 21l8 8 13-16" stroke="#fff" strokeWidth="3.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <h1 className="bs-title">Thanh toán thành công!</h1>
        <p className="bs-subtitle">
          Cảm ơn bạn đã đặt phòng tại Smart Office Space.<br />
          Thông tin đặt phòng đã được gửi đến email của bạn
        </p>

        {/* Box thông tin */}
        <div className="bs-info-box">
          <div className="bs-info-col">
            <span className="bs-info-label">Mã đặt phòng</span>
            <span className="bs-info-code">{bookingCode}</span>
          </div>
          <div className="bs-info-divider" />
          <div className="bs-info-col">
            <span className="bs-info-label">Ngày đặt</span>
            <span className="bs-info-date">{bookedAt}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="bs-actions">
          {/* ✅ Nút này giờ dẫn đến /booking-detail/:bookingId */}
          <button className="bs-btn bs-btn--primary" onClick={handleViewDetail}>
            Xem chi tiết đặt phòng
          </button>
          <button className="bs-btn bs-btn--outline" onClick={() => navigate('/')}>
            Về trang chủ
          </button>
        </div>
      </div>
    </>
  );
}
