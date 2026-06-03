import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import notificationApi from '../api/notificationApi';
import axiosInstance from '../api/axiosInstance';
import './css/NotificationDetailPage.css';

// FIX #4 & #5: Thêm CANCELLATION vào TYPE_CONFIG
const TYPE_CONFIG = {
    BOOKING:      { icon: 'fa-circle-check',  color: '#22c55e', label: 'Đặt phòng thành công' },
    PAYMENT:      { icon: 'fa-credit-card',   color: '#3b82f6', label: 'Thanh toán thành công' },
    REMINDER:     { icon: 'fa-bell',          color: '#f97316', label: 'Nhắc lịch đặt phòng' },
    PROMOTION:    { icon: 'fa-tag',           color: '#a855f7', label: 'Ưu đãi dành cho bạn' },
    CANCELLATION: { icon: 'fa-circle-xmark',  color: '#ef4444', label: 'Đơn đặt phòng đã hủy' },
    SYSTEM:       { icon: 'fa-circle-info',   color: '#6b7280', label: 'Thông báo hệ thống' },
};

// FIX #9: Nội dung lời chào theo từng loại thông báo
const GREETING_TEXT = {
    BOOKING:      'Thông tin chi tiết đơn đặt phòng như sau:',
    PAYMENT:      'Thông tin chi tiết thanh toán như sau:',
    REMINDER:     'Nhắc bạn về lịch sử dụng phòng sắp tới:',
    CANCELLATION: 'Thông tin đơn đặt phòng đã bị hủy như sau:',
    PROMOTION:    'Chi tiết ưu đãi dành cho bạn:',
    SYSTEM:       'Thông tin chi tiết từ hệ thống:',
};

function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function formatTime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// FIX #3: Hiển thị giờ đúng, không hardcode "AM"
function formatDateTime(str) {
    if (!str) return '—';
    const d = new Date(str);
    const hours   = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const period  = hours >= 12 ? 'CH' : 'SA';
    const h12     = hours % 12 || 12;
    return `${h12}:${minutes} ${period} – ${formatDate(str)}`;
}

const NotificationDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [notif, setNotif]     = useState(null);
    const [booking, setBooking] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadAll();
    }, [id]);

    const loadAll = async () => {
        setLoading(true);
        try {
            // 1. Lấy thông báo
            const nRes = await notificationApi.getOne(id);
            const n = nRes.data.data;
            setNotif(n);

            // 2. Đánh dấu đã đọc
            if (!n.isRead) await notificationApi.markRead(Number(id));

            // 3. Lấy booking nếu có referenceId (BOOKING, PAYMENT, REMINDER, CANCELLATION)
            if (n.referenceId && ['BOOKING', 'PAYMENT', 'REMINDER', 'CANCELLATION'].includes(n.type)) {
                try {
                    const bRes = await axiosInstance.get(`/bookings/${n.referenceId}`);
                    let rawBooking = bRes.data.data;
                    if (rawBooking && rawBooking.bookingStatus) {
                        rawBooking.status = rawBooking.bookingStatus.statusName;
                    }
                    setBooking(rawBooking);
                } catch {
                    // booking có thể đã bị xóa, bỏ qua
                }
            }

            // 4. Lấy thông báo liên quan
            const rRes = await notificationApi.getRelated(id);
            setRelated(rRes.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <><Header /><div className="nfd-loading">Đang tải...</div><Footer /></>;
    if (!notif)  return <><Header /><div className="nfd-loading">Không tìm thấy thông báo.</div><Footer /></>;

    const cfg          = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM;
    const greetingText = GREETING_TEXT[notif.type] || GREETING_TEXT.SYSTEM;

    return (
        <>

            <div className="nfd-wrapper">

                {/* Breadcrumb */}
                <div className="nfd-breadcrumb">
                    <span onClick={() => navigate('/')}>Trang chủ</span> &gt;{' '}
                    <span onClick={() => navigate('/notifications')}>Thông báo</span> &gt;{' '}
                    <span>Chi tiết thông báo</span>
                </div>

                <div className="nfd-card">

                    {/* Header thông báo */}
                    <div className="nfd-header">
                        <div className="nfd-header-left">
                            <div className="nfd-icon" style={{ background: cfg.color + '22' }}>
                                <i className={`fa-solid ${cfg.icon}`} style={{ color: cfg.color }}></i>
                            </div>
                            <div>
                                <div className="nfd-type-badge">
                                    <span className="nfd-dot" style={{ background: cfg.color }}></span>
                                    {cfg.label}
                                </div>
                                <p className="nfd-main-msg">{notif.message}</p>
                                <p className="nfd-sub">Thông báo hệ thống</p>
                            </div>
                        </div>
                        {/* FIX #3: Dùng formatDateTime thay vì hardcode AM */}
                        <div className="nfd-created-at">
                            {formatDateTime(notif.createdAt)}
                        </div>
                    </div>

                    {/* Lời chào */}
                    <div className="nfd-greeting">
                        <p>Chào {user?.name || 'bạn'}!</p>
                        <p>{notif.message}</p>
                        {/* FIX #9: Nội dung theo loại thông báo */}
                        <p>{greetingText}</p>
                    </div>

                    {/* Booking detail */}
                    {booking && (
                        <div className="nfd-booking-card">
                            <div className="nfd-booking-left">
                                {booking.room?.imageUrl && (
                                    <img src={booking.room.imageUrl} alt={booking.room.name} className="nfd-room-img" />
                                )}
                                <div className="nfd-room-info">
                                    <h3>{booking.room?.name}</h3>
                                    <p><i className="fa-solid fa-location-dot"></i> {booking.room?.location}</p>
                                    <p><i className="fa-solid fa-users"></i> Sức chứa: {booking.room?.capacity} người</p>
                                    <button className="nfd-room-btn" onClick={() => navigate(`/booking-detail/${booking.bookingId}`)}>
                                        Xem chi tiết phòng
                                    </button>
                                </div>
                            </div>

                            <div className="nfd-booking-right">
                                <div className="nfd-info-row">
                                    <span>Mã đặt phòng</span>
                                    <span className="nfd-val">#{booking.bookingCode}</span>
                                </div>
                                <div className="nfd-info-row">
                                    <span>Ngày đặt</span>
                                    <span>{formatDate(booking.createdAt)}</span>
                                </div>
                                <div className="nfd-info-row">
                                    <span>Ngày sử dụng</span>
                                    <span>{formatDate(booking.startTime)}</span>
                                </div>
                                <div className="nfd-info-row">
                                    <span>Khung giờ</span>
                                    <span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
                                </div>
                                <div className="nfd-info-row">
                                    <span>Trạng thái</span>
                                    <span className={`nfd-booking-status ${
                                        booking.status === 'CANCELLED'        ? 'cancelled' :
                                            booking.status === 'CONFIRMED'        ? 'confirmed' :
                                                booking.status === 'COMPLETED'        ? 'completed' :
                                                    booking.status === 'PENDING_PAYMENT'  ? 'pending'   : ''
                                    }`}>
                                        {booking.status === 'CANCELLED'       ? 'Đã hủy' :
                                            booking.status === 'CONFIRMED'       ? 'Đã đặt thành công' :
                                                booking.status === 'COMPLETED'       ? 'Hoàn thành' :
                                                    booking.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : booking.status}
                                    </span>
                                </div>
                                <div className="nfd-info-row total">
                                    <span>Tổng tiền</span>
                                    <span className="nfd-total">{booking.totalAmount?.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FIX #1: Bỏ dấu ; thừa, sửa cấu trúc điều kiện */}
                    {/* FIX #2: Thông báo liên quan hiện độc lập, không phụ thuộc booking */}
                    <div className="nfd-bottom">
                        {/* Thanh toán — chỉ hiện khi có booking */}
                        {booking && (
                            <div className="nfd-payment-card">
                                <h4>Thông tin thanh toán</h4>
                                <div className="nfd-info-row">
                                    <span>Trạng thái thanh toán</span>
                                    <span className={`nfd-status ${
                                        booking.status === 'CANCELLED'  ? 'refunded' :
                                            booking.status === 'CONFIRMED' ? 'paid'    : 'pending'
                                    }`}>
                                        {booking.status === 'CANCELLED'  ? 'Đã hoàn tiền'      :
                                            booking.status === 'CONFIRMED' ? 'Thanh toán thành công' : 'Chưa thanh toán'}
                                    </span>
                                </div>
                                <div className="nfd-info-row">
                                    <span>Phương thức thanh toán</span>
                                    <span>{booking.paymentMethod || '—'}</span>
                                </div>
                                <div className="nfd-info-row">
                                    <span>Mã giao dịch</span>
                                    <span>{booking.transactionId || '—'}</span>
                                </div>
                                <div className="nfd-info-row">
                                    <span>Ngày thanh toán</span>
                                    <span>{booking.paidAt ? formatDate(booking.paidAt) : '—'}</span>
                                </div>
                                <div className="nfd-info-row">
                                    <span>Số tiền</span>
                                    <span>{booking.totalAmount?.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>
                        )}

                        {/* FIX #2: Thông báo liên quan — hiện khi có dữ liệu, không phụ thuộc booking */}
                        {related.length > 0 && (
                            <div className="nfd-related-card">
                                <h4>Thông báo liên quan</h4>
                                {related.map(r => {
                                    const rc = TYPE_CONFIG[r.type] || TYPE_CONFIG.SYSTEM;
                                    return (
                                        <div key={r.notifyId} className="nfd-related-item"
                                             onClick={() => navigate(`/notifications/${r.notifyId}`)}>
                                            <div className="nfd-related-icon" style={{ background: rc.color + '22' }}>
                                                <i className={`fa-solid ${rc.icon}`} style={{ color: rc.color }}></i>
                                            </div>
                                            <div className="nfd-related-body">
                                                <p className="nfd-related-label">
                                                    <span className="nfd-dot" style={{ background: rc.color }}></span>
                                                    {rc.label}
                                                </p>
                                                <p className="nfd-related-msg">{r.message}</p>
                                            </div>
                                            <i className="fa-solid fa-chevron-right nfd-related-arrow"></i>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>

        </>
    );
};

export default NotificationDetailPage;